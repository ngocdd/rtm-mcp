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

describe('TestPlansResource (V1)', () => {
  it('get() encodes the key in the path', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.get('ACME-1');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1');
    expect(init.method).toBe('GET');
  });

  it('create() POSTs JSON body to /test-plan', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.create({
      projectKey: 'ACME',
      summary: 'Smoke plan',
      issueTypeId: 10016,
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan');
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
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ summary: 'updated' });
  });

  it('delete() DELETEs /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.delete('ACME-1');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1');
    expect(init.method).toBe('DELETE');
  });

  it('updateTestCaseOrder() PUTs /{key}/tc-order with body { order: [...] }', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.updateTestCaseOrder('ACME-1', { order: ['ACME-10', 'ACME-11'] });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1/tc-order');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({
      order: ['ACME-10', 'ACME-11'],
    });
  });

  it('createFolder() POSTs /{key}/tree/folders', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.createFolder('ACME-1', { name: 'Smoke', parentFolderPath: '/' });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/test-plan/ACME-1/tree/folders',
    );
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Smoke',
      parentFolderPath: '/',
    });
  });

  it('addTestCase() POSTs /{key}/testcases with { testKey } body', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.addTestCase('ACME-1', 'ACME-10');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1/testcases');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ testKey: 'ACME-10' });
  });

  it('removeTestCase() DELETEs /{key}/testcases/{tcKey}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.removeTestCase('ACME-1', 'ACME-10');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/test-plan/ACME-1/testcases/ACME-10',
    );
    expect(init.method).toBe('DELETE');
  });

  it('encodes special characters in testCaseKey', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new TestPlansResource(new HttpClient(baseConfig));
    await r.removeTestCase('ACME-1', 'ACME/with space');
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/test-plan/ACME-1/testcases/ACME%2Fwith%20space',
    );
  });
});
