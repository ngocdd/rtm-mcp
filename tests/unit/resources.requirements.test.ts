import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequirementsResource } from '../../src/resources/requirements.js';
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

describe('RequirementsResource', () => {
  it('list() sends GET with query params', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ items: [], total: 0 }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.list({ projectKey: 'ACME', page: 1, pageSize: 50 });
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe('https://rtm.example.com/api/v2/requirement?projectKey=ACME&page=1&pageSize=50');
  });

  it('get() encodes the key in the path', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.get('ACME-1');
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe('https://rtm.example.com/api/v2/requirement/ACME-1');
  });

  it('create() POSTs JSON body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.create({ projectKey: 'ACME', name: 'req' });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/requirement');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ projectKey: 'ACME', name: 'req' });
  });

  it('update() PUTs JSON body to /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.update('ACME-1', { name: 'updated' });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/requirement/ACME-1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'updated' });
  });

  it('delete() DELETEs /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.delete('ACME-1');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/requirement/ACME-1');
    expect(init.method).toBe('DELETE');
  });

  it('setCoveredTestCases builds coveredTestCases.set payload', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.setCoveredTestCases('ACME-1', ['TC-1', 'TC-2']);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/requirement/ACME-1/covered-test-cases');
    expect(JSON.parse(init.body as string)).toEqual({
      coveredTestCases: { set: [{ testKey: 'TC-1' }, { testKey: 'TC-2' }] },
    });
  });

  it('addCoveredTestCases builds coveredTestCases.add payload', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.addCoveredTestCases('ACME-1', ['TC-9']);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      coveredTestCases: { add: [{ testKey: 'TC-9' }] },
    });
  });

  it('removeCoveredTestCases builds coveredTestCases.remove payload', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.removeCoveredTestCases('ACME-1', ['TC-9']);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      coveredTestCases: { remove: [{ testKey: 'TC-9' }] },
    });
  });
});
