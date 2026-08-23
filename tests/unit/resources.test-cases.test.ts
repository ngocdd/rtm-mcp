import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestCasesResource } from '../../src/resources/test-cases.js';
import type { Config } from '../../src/config/env.js';
import { HttpClient } from '../../src/client/http.js';

const baseConfig: Config = {
  apiToken: 'tok',
  baseUrl: 'https://rtm.example.com/api',
  logLevel: 'error',
  timeoutMs: 5_000,
  maxRetries: 0,
};

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  // @ts-expect-error assign mocked fetch
  globalThis.fetch = fetchSpy;
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('TestCasesResource', () => {
  it('get() encodes the key in the path', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestCasesResource(new HttpClient(baseConfig));
    await r.get('ACME-1');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case/ACME-1');
    expect(init.method).toBe('GET');
  });

  it('create() POSTs JSON body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const r = new TestCasesResource(new HttpClient(baseConfig));
    await r.create({
      projectKey: 'ACME',
      summary: 'Login test',
      issueTypeId: 10015,
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      projectKey: 'ACME',
      summary: 'Login test',
      issueTypeId: 10015,
    });
  });

  it('update() PUTs /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestCasesResource(new HttpClient(baseConfig));
    await r.update('ACME-1', { summary: 'updated' });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case/ACME-1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ summary: 'updated' });
  });

  it('updateCoveredRequirements() sends `set` body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestCasesResource(new HttpClient(baseConfig));
    await r.updateCoveredRequirements('ACME-1', {
      set: [{ testKey: 'ACME-10' }, { testKey: 'ACME-11' }],
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case/ACME-1/covered-requirements');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({
      coveredRequirements: {
        set: [{ testKey: 'ACME-10' }, { testKey: 'ACME-11' }],
      },
    });
  });

  it('updateCoveredRequirements() sends `add` body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const r = new TestCasesResource(new HttpClient(baseConfig));
    await r.updateCoveredRequirements('ACME-1', {
      add: [{ testKey: 'ACME-12' }],
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      coveredRequirements: { add: [{ testKey: 'ACME-12' }] },
    });
  });

  it('updateCoveredRequirements() sends `remove` body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const r = new TestCasesResource(new HttpClient(baseConfig));
    await r.updateCoveredRequirements('ACME-1', {
      remove: [{ testKey: 'ACME-12' }],
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      coveredRequirements: { remove: [{ testKey: 'ACME-12' }] },
    });
  });

  it('does NOT expose any DELETE method', async () => {
    const r = new TestCasesResource(new HttpClient(baseConfig));
    expect((r as unknown as Record<string, unknown>).delete).toBeUndefined();
  });
});
