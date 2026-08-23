import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/config/env.js';

describe('loadConfig', () => {
  it('returns defaults when only RTM_API_TOKEN is set', () => {
    const cfg = loadConfig({ RTM_API_TOKEN: 'tok' });
    expect(cfg.apiToken).toBe('tok');
    expect(cfg.baseUrl).toBe('https://rtm-us.deviniti.com/api');
    expect(cfg.logLevel).toBe('info');
    expect(cfg.timeoutMs).toBe(30_000);
    expect(cfg.maxRetries).toBe(2);
  });

  it('strips trailing slash from baseUrl', () => {
    const cfg = loadConfig({
      RTM_API_TOKEN: 'tok',
      RTM_BASE_URL: 'https://rtm-eu-api.hexygen.com/api/',
    });
    expect(cfg.baseUrl).toBe('https://rtm-eu-api.hexygen.com/api');
  });

  it('coerces numeric env vars', () => {
    const cfg = loadConfig({
      RTM_API_TOKEN: 'tok',
      RTM_TIMEOUT_MS: '5000',
      RTM_MAX_RETRIES: '5',
    });
    expect(cfg.timeoutMs).toBe(5000);
    expect(cfg.maxRetries).toBe(5);
  });

  it('accepts EU base URL', () => {
    const cfg = loadConfig({
      RTM_API_TOKEN: 'tok',
      RTM_BASE_URL: 'https://rtm-eu-api.hexygen.com/api',
    });
    expect(cfg.baseUrl).toBe('https://rtm-eu-api.hexygen.com/api');
  });

  it('throws (and exits) when RTM_API_TOKEN is missing', () => {
    const exit = process.exit;
    const stderr: string[] = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = ((chunk: unknown) => {
      stderr.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    process.exit = ((code?: number) => {
      throw new Error(`exit(${code ?? 'undefined'})`);
    }) as typeof process.exit;
    try {
      expect(() => loadConfig({})).toThrow(/exit\(1\)/);
      const out = stderr.join('');
      expect(out).toMatch(/RTM_API_TOKEN is required/);
      expect(out).toMatch(/Generate a token/);
    } finally {
      process.exit = exit;
      process.stderr.write = originalWrite;
    }
  });

  it('rejects invalid base URL', () => {
    const exit = process.exit;
    const stderr: string[] = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = ((chunk: unknown) => {
      stderr.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    process.exit = ((code?: number) => {
      throw new Error(`exit(${code ?? 'undefined'})`);
    }) as typeof process.exit;
    try {
      expect(() =>
        loadConfig({ RTM_API_TOKEN: 'tok', RTM_BASE_URL: 'not-a-url' }),
      ).toThrow(/exit\(1\)/);
      expect(stderr.join('')).toMatch(/RTM_BASE_URL must be a valid URL/);
    } finally {
      process.exit = exit;
      process.stderr.write = originalWrite;
    }
  });

  it('rejects negative retries', () => {
    const exit = process.exit;
    const stderr: string[] = [];
    const originalWrite = process.stderr.write;
    process.stderr.write = ((chunk: unknown) => {
      stderr.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    process.exit = ((code?: number) => {
      throw new Error(`exit(${code ?? 'undefined'})`);
    }) as typeof process.exit;
    try {
      expect(() =>
        loadConfig({ RTM_API_TOKEN: 'tok', RTM_MAX_RETRIES: '-1' }),
      ).toThrow(/exit\(1\)/);
      expect(stderr.join('')).toMatch(/RTM_MAX_RETRIES/);
    } finally {
      process.exit = exit;
      process.stderr.write = originalWrite;
    }
  });

  it('returns a frozen object', () => {
    const cfg = loadConfig({ RTM_API_TOKEN: 'tok' });
    expect(Object.isFrozen(cfg)).toBe(true);
  });
});
