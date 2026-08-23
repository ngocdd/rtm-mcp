import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestCaseExecutionsResource } from '../../src/resources/test-case-executions.js';
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

describe('TestCaseExecutionsResource', () => {
  it('get() encodes the key in the path', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'KAN-53-KAN-46' }));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.get('KAN-53-KAN-46');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46');
    expect(init.method).toBe('GET');
  });

  it('update() PUTs `{result:{name:"Fail"}}` for plain-string result', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'KAN-53-KAN-46', result: { name: 'Fail' } }));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.update('KAN-53-KAN-46', { result: 'Fail' });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ result: { name: 'Fail' } });
  });

  it('update() forwards `{result:{id:96867}}` verbatim', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'KAN-53-KAN-46' }));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.update('KAN-53-KAN-46', { result: { id: 96867 } });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ result: { id: 96867 } });
  });

  it('update() falls back to `status` when no `result` provided', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.update('KAN-53-KAN-46', { status: 'Blocked' });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ status: 'Blocked' });
  });

  it('update() forwards comment + executedBy + customFields', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.update('KAN-53-KAN-46', {
      result: 'Fail',
      comment: 'CDN cache miss in EU region',
      executedBy: 'alice@example.com',
      customFields: { severity: 'high' },
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      result: { name: 'Fail' },
      comment: 'CDN cache miss in EU region',
      executedBy: 'alice@example.com',
      customFields: { severity: 'high' },
    });
  });

  it('update() omits empty payload (does not send undefined keys)', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.update('KAN-53-KAN-46', {});
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({});
  });

  it('getAttachment() GETs /attachment/{id} with both ids encoded', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ id: 'att-1', filename: 'log.txt' }));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.getAttachment('KAN-53-KAN-46', 'att-1');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/attachment/att-1',
    );
    expect(init.method).toBe('GET');
  });

  it('getAttachment() URL-encodes slashes and special chars in ids', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.getAttachment('KAN-53-KAN-46', 'att/with slash');
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/attachment/att%2Fwith%20slash',
    );
  });

  it('listStepAttachments() GETs /step/{stepId}/attachment', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse([{ id: 'att-7' }]));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.listStepAttachments('KAN-53-KAN-46', '8517443');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/step/8517443/attachment',
    );
    expect(init.method).toBe('GET');
  });

  it('uploadStepAttachment() POSTs multipart to /step/{stepId}/attachment', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ id: 'att-7', filename: 'evidence.png' }));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.uploadStepAttachment('KAN-53-KAN-46', '8517443', {
      filename: 'evidence.png',
      data: new Uint8Array([1, 2, 3]),
      mimeType: 'image/png',
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/step/8517443/attachment',
    );
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('linkDefect() POSTs /defect/{defectKey}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.linkDefect('KAN-53-KAN-46', 'KAN-100');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/defect/KAN-100',
    );
    expect(init.method).toBe('POST');
  });

  it('linkStepDefect() POSTs /step/{stepId}/defect/{defectKey}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    await r.linkStepDefect('KAN-53-KAN-46', '8517443', 'KAN-100');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/step/8517443/defect/KAN-100',
    );
    expect(init.method).toBe('POST');
  });

  it('does NOT expose any DELETE method', async () => {
    const r = new TestCaseExecutionsResource(new HttpClient(baseConfig));
    expect((r as unknown as Record<string, unknown>).unlinkDefect).toBeUndefined();
    expect((r as unknown as Record<string, unknown>).unlinkStepDefect).toBeUndefined();
    expect((r as unknown as Record<string, unknown>).deleteAttachment).toBeUndefined();
  });
});
