/**
 * HTTP client wrapping native `fetch` with bearer-token auth, retry,
 * exponential backoff and timeout. Owns no domain knowledge — the
 * `RtmClient` composes this with resource modules.
 */
import type { Config } from '../config/env.js';
import { USER_AGENT } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import {
  RTMError,
  RTMAuthenticationError,
  RTMNetworkError,
  RTMNotFoundError,
  RTMRateLimitError,
  RTMServerError,
  RTMTimeoutError,
  RTMValidationError,
} from './errors.js';

export interface HttpRequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** When set, sent as multipart/form-data instead of JSON. */
  formData?: FormData;
  headers?: Record<string, string>;
  /** Override per-request timeout in ms. */
  timeoutMs?: number;
  /** Disable retries for this single request. */
  noRetry?: boolean;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly defaultTimeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: Config) {
    this.baseUrl = config.baseUrl;
    this.apiToken = config.apiToken;
    this.defaultTimeoutMs = config.timeoutMs;
    this.maxRetries = config.maxRetries;
  }

  /**
   * Issue an HTTP request and return the parsed JSON body.
   * Throws an `RTMError` subclass on any non-2xx response.
   */
  async request<T = unknown>(
    method: string,
    path: string,
    opts: HttpRequestOptions = {},
  ): Promise<T> {
    const url = this.buildUrl(path, opts.query);
    const headers = this.buildHeaders(opts.headers, opts.formData != null);

    const init: RequestInit = {
      method,
      headers,
    };
    if (opts.formData) {
      init.body = opts.formData;
    } else if (opts.body !== undefined) {
      init.body = JSON.stringify(opts.body);
    }

    return this.executeWithRetry<T>(url, init, opts);
  }

  // ---------- Convenience helpers ----------

  get<T = unknown>(path: string, opts: HttpRequestOptions = {}): Promise<T> {
    return this.request<T>('GET', path, opts);
  }

  post<T = unknown>(path: string, opts: HttpRequestOptions = {}): Promise<T> {
    return this.request<T>('POST', path, opts);
  }

  put<T = unknown>(path: string, opts: HttpRequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', path, opts);
  }

  patch<T = unknown>(path: string, opts: HttpRequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', path, opts);
  }

  delete<T = unknown>(path: string, opts: HttpRequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', path, opts);
  }

  postMultipart<T = unknown>(
    path: string,
    formData: FormData,
    opts: Omit<HttpRequestOptions, 'formData' | 'body'> = {},
  ): Promise<T> {
    return this.request<T>('POST', path, { ...opts, formData });
  }

  // ---------- Internals ----------

  private buildUrl(
    path: string,
    query?: HttpRequestOptions['query'],
  ): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(this.baseUrl + normalizedPath);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  private buildHeaders(
    extra: Record<string, string> | undefined,
    isMultipart: boolean,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiToken}`,
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      ...extra,
    };
    if (!isMultipart && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private async executeWithRetry<T>(
    url: string,
    init: RequestInit,
    opts: HttpRequestOptions,
  ): Promise<T> {
    const maxAttempts = (opts.noRetry ? 0 : this.maxRetries) + 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const timeoutMs = opts.timeoutMs ?? this.defaultTimeoutMs;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timer);
        return await this.handleResponse<T>(res, url, attempt);
      } catch (err) {
        clearTimeout(timer);
        lastError = err;

        if (err instanceof RTMError) {
          // Already-classified error. Decide if we retry.
          if (attempt < maxAttempts - 1 && isRetryable(err)) {
            const wait = computeBackoffMs(attempt, (err as RTMRateLimitError).retryAfterSeconds);
            logger.debug(`retry ${attempt + 1}/${maxAttempts} after ${wait}ms: ${err.message}`);
            await sleep(wait);
            continue;
          }
          throw err;
        }

        // Unclassified error from fetch — network/timeout.
        if (err instanceof Error && err.name === 'AbortError') {
          const timeoutErr = new RTMTimeoutError(
            `Request to ${url} timed out after ${timeoutMs}ms`,
          );
          lastError = timeoutErr;
          if (attempt < maxAttempts - 1) {
            const wait = computeBackoffMs(attempt);
            await sleep(wait);
            continue;
          }
          throw timeoutErr;
        }

        const networkErr = new RTMNetworkError(
          `Network error contacting ${url}: ${(err as Error)?.message ?? String(err)}`,
        );
        lastError = networkErr;
        if (attempt < maxAttempts - 1) {
          const wait = computeBackoffMs(attempt);
          await sleep(wait);
          continue;
        }
        throw networkErr;
      }
    }

    // Unreachable — loop above always either returns or throws.
    throw lastError instanceof RTMError
      ? lastError
      : new RTMError(`Request to ${url} failed: ${String(lastError)}`);
  }

  private async handleResponse<T>(
    res: Response,
    url: string,
    attempt: number,
  ): Promise<T> {
    const status = res.status;
    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    // 204 / 205: no body.
    if (status === 204 || status === 205) {
      return undefined as T;
    }

    // Buffer once so we can attempt JSON parse and still keep raw text.
    const text = await res.text();
    const body: unknown = isJson && text ? safeJsonParse(text) : text;

    if (status >= 200 && status < 300) {
      return (body ?? (undefined as unknown)) as T;
    }

    const retryAfterSeconds = parseRetryAfter(res.headers.get('retry-after'));
    const message = `RTM API ${status} on ${url}: ${summarize(body)}`;
    const err = mapStatusToError(status, message, url, body, retryAfterSeconds);
    (err as { attempt?: number }).attempt = attempt;
    throw err;
  }
}

// ---------- helpers ----------

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function summarize(body: unknown): string {
  if (!body) return '';
  if (typeof body === 'string') return body.slice(0, 300);
  try {
    return JSON.stringify(body).slice(0, 300);
  } catch {
    return '<unserializable>';
  }
}

function mapStatusToError(
  status: number,
  message: string,
  endpoint: string,
  body: unknown,
  retryAfterSeconds?: number,
): RTMError {
  switch (status) {
    case 400:
      return new RTMValidationError(message, { status, endpoint, body });
    case 401:
    case 403:
      return new RTMAuthenticationError(message, { status, endpoint, body });
    case 404:
      return new RTMNotFoundError(message, { status, endpoint, body });
    case 429:
      return new RTMRateLimitError(message, {
        status,
        endpoint,
        body,
        retryAfterSeconds,
      });
    default:
      if (status >= 500) {
        return new RTMServerError(message, { status, endpoint, body });
      }
      return new RTMError(message, { status, endpoint, body });
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  // HTTP date format → seconds from now.
  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, Math.round((dateMs - Date.now()) / 1000));
  }
  return undefined;
}

function isRetryable(err: RTMError): boolean {
  if (err instanceof RTMRateLimitError) return true;
  if (err instanceof RTMServerError) return true;
  return false;
}

function computeBackoffMs(attempt: number, retryAfterSeconds?: number): number {
  if (retryAfterSeconds != null && retryAfterSeconds > 0) {
    return Math.min(30_000, retryAfterSeconds * 1000);
  }
  const base = 500 * Math.pow(2, attempt);
  const jitter = Math.random() * 250;
  return Math.min(30_000, base + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
