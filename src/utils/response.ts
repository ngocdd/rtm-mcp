/**
 * Helpers for building MCP-compliant tool responses.
 */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  RTMAuthenticationError,
  RTMError,
  RTMNetworkError,
  RTMNotFoundError,
  RTMRateLimitError,
  RTMServerError,
  RTMTimeoutError,
  RTMValidationError,
} from '../client/errors.js';
import { logger } from './logger.js';

/** Wrap a value as a successful text content block. */
export function textResult(payload: unknown): CallToolResult {
  const text =
    typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  return {
    content: [{ type: 'text', text }],
  };
}

/** Wrap a message as an MCP error result. */
export function errorResult(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}

/**
 * Convert an unknown thrown value into a friendly MCP error message.
 * Logs the full error to stderr; returns only the safe summary to the model.
 */
export function toErrorResult(err: unknown, context?: string): CallToolResult {
  const prefix = context ? `${context}: ` : '';
  let message: string;

  if (err instanceof RTMAuthenticationError) {
    message =
      `${prefix}Authentication failed. Verify RTM_API_TOKEN is valid and has not expired ` +
      `(re-generate in Jira: Apps → RTM → API Tokens). Underlying error: ${err.message}`;
  } else if (err instanceof RTMNotFoundError) {
    message = `${prefix}Resource not found. ${err.message}`;
  } else if (err instanceof RTMValidationError) {
    message =
      `${prefix}Validation failed (HTTP 400). The RTM API rejected the payload. ` +
      `Details: ${summarizeBody(err.body)}`;
  } else if (err instanceof RTMRateLimitError) {
    const wait = err.retryAfterSeconds
      ? ` Retry after ${err.retryAfterSeconds}s.`
      : '';
    message = `${prefix}Rate limited by RTM API (HTTP 429).${wait}`;
  } else if (err instanceof RTMTimeoutError) {
    message = `${prefix}Request timed out. Try increasing RTM_TIMEOUT_MS. ${err.message}`;
  } else if (err instanceof RTMNetworkError) {
    message = `${prefix}Network error reaching RTM API. Check connectivity and RTM_BASE_URL. ${err.message}`;
  } else if (err instanceof RTMServerError) {
    message = `${prefix}RTM API server error. ${err.message}`;
  } else if (err instanceof RTMError) {
    message = `${prefix}RTM API error. ${err.message}`;
  } else if (err instanceof Error) {
    message = `${prefix}Unexpected error: ${err.message}`;
  } else {
    message = `${prefix}Unexpected error: ${String(err)}`;
  }

  logger.error(`tool error: ${message}`, err);
  return errorResult(message);
}

function summarizeBody(body: unknown): string {
  if (!body) return '(no details)';
  try {
    return JSON.stringify(body).slice(0, 600);
  } catch {
    return '(unserializable body)';
  }
}
