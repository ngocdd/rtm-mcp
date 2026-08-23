/**
 * Typed error hierarchy for the RTM API client.
 *
 * The HTTP layer catches raw `fetch` errors and parses non-2xx responses,
 * then throws the most specific subclass it can. Tool handlers map these
 * to friendly MCP error messages — never leak stack traces to the model.
 */

export interface RTMErrorContext {
  status: number;
  endpoint: string;
  body: unknown;
}

export class RTMError extends Error {
  public readonly status: number;
  public readonly endpoint: string;
  public readonly body: unknown;

  constructor(message: string, ctx: Partial<RTMErrorContext> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = ctx.status ?? 0;
    this.endpoint = ctx.endpoint ?? '';
    this.body = ctx.body;
  }
}

export class RTMAuthenticationError extends RTMError {}
export class RTMNotFoundError extends RTMError {}
export class RTMValidationError extends RTMError {}
export class RTMRateLimitError extends RTMError {
  public readonly retryAfterSeconds?: number;
  constructor(
    message: string,
    ctx: Partial<RTMErrorContext> & { retryAfterSeconds?: number } = {},
  ) {
    super(message, ctx);
    this.retryAfterSeconds = ctx.retryAfterSeconds;
  }
}
export class RTMServerError extends RTMError {}
export class RTMTimeoutError extends RTMError {}
export class RTMNetworkError extends RTMError {}
