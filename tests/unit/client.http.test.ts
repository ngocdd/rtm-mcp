import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpClient } from '../../src/client/http.js';
import {
  RTMAuthenticationError,
  RTMNetworkError,
  RTMNotFoundError,
  RTMRateLimitError,
  RTMServerError,
  RTMTimeoutError,
  RTMValidationError,
} from '../../src/client/errors.js';
import type { Config } from '../../src/config/env.js';

const baseConfig: Config = {
  apiToken: 'test-token',
  baseUrl: 'https://rtm.example.com/api',
  logLevel: 'error',
  timeoutMs: 1_000,
  maxRetries: 2,
};

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...(headers ?? {}) },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  // @ts-expect-error - assign mocked fetch
  globalThis.fetch = fetchSpy;
});

afterEach(() => {
  vi.restoreAllMocks();
  fetchSpy.mockReset();
});

describe('HttpClient - request shape', () => {
  it('sends Bearer auth and JSON body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const http = new HttpClient(baseConfig);
    const out = await http.post<{ ok: boolean }>('/test', {
      body: { hello: 'world' },
    });
    expect(out.ok).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ hello: 'world' });
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-token');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Accept).toBe('application/json');
  });

  it('serializes query params (and skips undefined)', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, {}));
    const http = new HttpClient(baseConfig);
    await http.get('/list', {
      query: { projectKey: 'ACME', folder: undefined, page: 1 },
    });
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe('https://rtm.example.com/api/list?projectKey=ACME&page=1');
  });

  it('returns undefined for 204 responses', async () => {
    fetchSpy.mockResolvedValueOnce(emptyResponse(204));
    const http = new HttpClient(baseConfig);
    const out = await http.delete('/x');
    expect(out).toBeUndefined();
  });
});

describe('HttpClient - error mapping', () => {
  it('maps 400 → RTMValidationError', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(400, { error: 'bad' }));
    const http = new HttpClient(baseConfig);
    await expect(http.get('/x')).rejects.toBeInstanceOf(RTMValidationError);
  });

  it('maps 401/403 → RTMAuthenticationError', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(401, { error: 'no' }));
    const http = new HttpClient(baseConfig);
    await expect(http.get('/x')).rejects.toBeInstanceOf(RTMAuthenticationError);
  });

  it('maps 404 → RTMNotFoundError', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(404, {}));
    const http = new HttpClient(baseConfig);
    await expect(http.get('/x')).rejects.toBeInstanceOf(RTMNotFoundError);
  });

  it('maps 429 → RTMRateLimitError and parses Retry-After', async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(429, { error: 'slow' }, { 'retry-after': '7' }),
    );
    const http = new HttpClient(baseConfig);
    try {
      await http.get('/x', { noRetry: true });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RTMRateLimitError);
      expect((err as RTMRateLimitError).retryAfterSeconds).toBe(7);
    }
  });

  it('maps 5xx → RTMServerError', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(503, {}));
    const http = new HttpClient(baseConfig);
    await expect(http.get('/x', { noRetry: true })).rejects.toBeInstanceOf(RTMServerError);
  });
});

describe('HttpClient - retry / timeout / network', () => {
  it('retries on 503 then succeeds', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(503, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const http = new HttpClient(baseConfig);
    const out = await http.get<{ ok: boolean }>('/x');
    expect(out.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 4xx', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(400, {}));
    const http = new HttpClient(baseConfig);
    await expect(http.get('/x')).rejects.toBeInstanceOf(RTMValidationError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not retry when noRetry is set', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(503, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const http = new HttpClient(baseConfig);
    await expect(http.get('/x', { noRetry: true })).rejects.toBeInstanceOf(RTMServerError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxRetries+1 attempts', async () => {
    fetchSpy.mockImplementation(() => Promise.resolve(jsonResponse(503, {})));
    const http = new HttpClient(baseConfig);
    await expect(http.get('/x')).rejects.toBeInstanceOf(RTMServerError);
    expect(fetchSpy).toHaveBeenCalledTimes(3); // 2 retries + 1 initial
  });

  it('maps AbortError to RTMTimeoutError', async () => {
    fetchSpy.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          }, 50);
        }),
    );
    const http = new HttpClient({ ...baseConfig, timeoutMs: 5 });
    await expect(http.get('/x')).rejects.toBeInstanceOf(RTMTimeoutError);
  });

  it('maps generic fetch failure to RTMNetworkError', async () => {
    fetchSpy.mockRejectedValue(new TypeError('socket reset'));
    const http = new HttpClient(baseConfig);
    await expect(http.get('/x')).rejects.toBeInstanceOf(RTMNetworkError);
  });
});

describe('HttpClient - multipart', () => {
  it('does not set Content-Type on multipart (browser/RT27 sets boundary)', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { taskId: 't' }));
    const http = new HttpClient(baseConfig);
    const form = new FormData();
    form.append('projectKey', 'X');
    form.append('file', new Blob(['hello']), 'a.txt');
    await http.postMultipart('/upload', form);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(form);
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });
});
