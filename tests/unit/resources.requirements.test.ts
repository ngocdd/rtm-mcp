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
  it('get() encodes the key in the path', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.get('ACME-1');
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe('https://rtm.example.com/api/requirement/ACME-1');
  });

  it('create() POSTs JSON body with summary + issueTypeId', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.create({
      projectKey: 'ACME',
      summary: 'My req',
      issueTypeId: 10015,
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/requirement');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      projectKey: 'ACME',
      summary: 'My req',
      issueTypeId: 10015,
    });
  });

  it('update() PUTs JSON body to /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.update('ACME-1', { summary: 'updated' });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/requirement/ACME-1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ summary: 'updated' });
  });

  it('delete() DELETEs /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new RequirementsResource(new HttpClient(baseConfig));
    await r.delete('ACME-1');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/requirement/ACME-1');
    expect(init.method).toBe('DELETE');
  });
});
