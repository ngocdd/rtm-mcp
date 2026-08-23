/**
 * Tiny stderr-only logger.
 *
 * IMPORTANT: stdout is reserved for the MCP JSON-RPC stream, so every
 * diagnostic message MUST go to stderr. Calling `console.log` directly
 * from anywhere in this codebase will corrupt the protocol.
 */
import type { LogLevel } from '../config/env.js';

type Level = LogLevel | 'silent';

const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

class StderrLogger {
  private threshold: number = LEVELS.info;

  setLevel(level: Level): void {
    this.threshold = LEVELS[level];
  }

  debug(msg: string, ...rest: unknown[]): void {
    this.write('debug', msg, rest);
  }

  info(msg: string, ...rest: unknown[]): void {
    this.write('info', msg, rest);
  }

  warn(msg: string, ...rest: unknown[]): void {
    this.write('warn', msg, rest);
  }

  error(msg: string, ...rest: unknown[]): void {
    this.write('error', msg, rest);
  }

  private write(level: 'debug' | 'info' | 'warn' | 'error', msg: string, rest: unknown[]): void {
    if (LEVELS[level] < this.threshold) return;
    const ts = new Date().toISOString();
    const tail = rest.length > 0 ? ' ' + rest.map(safeStringify).join(' ') : '';
    process.stderr.write(`[${ts}] [${level}] ${msg}${tail}\n`);
  }
}

function safeStringify(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`;
  }
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const logger = new StderrLogger();
