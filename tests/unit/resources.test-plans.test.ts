import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestPlansResource } from '../../src/resources/test-plans.js';
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

describe('TestPlansResource', () => {
  it('get() encodes the key in the path under /v2', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.get('ACME-1');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-plan/ACME-1');
    expect(init.method).toBe('GET');
  });

  it('create() POSTs JSON body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.create({
      projectKey: 'ACME',
      summary: 'Smoke plan',
      issueTypeId: 10016,
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-plan');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      projectKey: 'ACME',
      summary: 'Smoke plan',
      issueTypeId: 10016,
    });
  });

  it('update() PUTs /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.update('ACME-1', { summary: 'updated' });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-plan/ACME-1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ summary: 'updated' });
  });

  it('updateIncludedTestCases() sends `set` body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.updateIncludedTestCases('ACME-1', {
      set: [{ testKey: 'ACME-10' }, { testKey: 'ACME-11' }],
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-plan/ACME-1/included-test-cases',
    );
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({
      includedTestCases: {
        set: [{ testKey: 'ACME-10' }, { testKey: 'ACME-11' }],
      },
    });
  });

  it('updateIncludedTestCases() sends `add` body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.updateIncludedTestCases('ACME-1', {
      add: [{ testKey: 'ACME-12' }],
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      includedTestCases: { add: [{ testKey: 'ACME-12' }] },
    });
  });

  it('updateIncludedTestCases() sends `remove` body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.updateIncludedTestCases('ACME-1', {
      remove: [{ testKey: 'ACME-12' }],
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      includedTestCases: { remove: [{ testKey: 'ACME-12' }] },
    });
  });

  it('does NOT expose any DELETE method', async () => {
    const r = new TestPlansResource(new HttpClient(baseConfig));
    expect((r as unknown as Record<string, unknown>).delete).toBeUndefined();
  });
});
