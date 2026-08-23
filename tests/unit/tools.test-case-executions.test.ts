import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerTestCaseExecutionTools } from '../../src/tools/test-case-executions.js';
import { TestCaseExecutionsResource } from '../../src/resources/test-case-executions.js';
import { HttpClient } from '../../src/client/http.js';
import type { Config } from '../../src/config/env.js';

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

async function makeClient(): Promise<Client> {
  const server = new McpServer(
    { name: 'test', version: '0.0.0' },
    { capabilities: { tools: {} } },
  );
  registerTestCaseExecutionTools(
    server,
    new TestCaseExecutionsResource(new HttpClient(baseConfig)),
  );
  const client = new Client({ name: 't', version: '0' }, { capabilities: {} });
  const [t1, t2] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(t1), client.connect(t2)]);
  return client;
}

describe('Test Case Execution MCP tools', () => {
  it('rtm_get_test_case_execution GETs /v2/test-case-execution/{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'KAN-53-KAN-46', result: { name: 'Pass' } }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_get_test_case_execution',
      arguments: { testCaseExecutionKey: 'KAN-53-KAN-46' },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46');
    expect(init.method).toBe('GET');
  });

  it('rtm_update_test_case_execution PUTs {result:{name:"Fail"}} when result is a string', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'KAN-53-KAN-46', result: { name: 'Fail' } }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_update_test_case_execution',
      arguments: {
        testCaseExecutionKey: 'KAN-53-KAN-46',
        result: 'Fail',
      },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ result: { name: 'Fail' } });
  });

  it('rtm_update_test_case_execution preserves object-shaped result', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_case_execution',
      arguments: {
        testCaseExecutionKey: 'KAN-53-KAN-46',
        result: { id: 96867 },
        comment: 'regression',
      },
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      result: { id: 96867 },
      comment: 'regression',
    });
  });

  it('rtm_update_test_case_execution validates missing testCaseExecutionKey', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_update_test_case_execution',
      // @ts-expect-error testing missing field
      arguments: { result: 'Fail' },
    });
    expect(res.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rtm_update_test_case_execution validates result object with no id and no name', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_update_test_case_execution',
      arguments: {
        testCaseExecutionKey: 'KAN-53-KAN-46',
        result: {},
      },
    });
    expect(res.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rtm_link_defect_to_test_case_execution POSTs /defect/{defectKey}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_link_defect_to_test_case_execution',
      arguments: {
        testCaseExecutionKey: 'KAN-53-KAN-46',
        defectTestKey: 'KAN-100',
      },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/defect/KAN-100',
    );
    expect(init.method).toBe('POST');
  });

  it('rtm_link_defect_to_test_case_execution_step POSTs /step/{stepId}/defect/{defectKey}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_link_defect_to_test_case_execution_step',
      arguments: {
        testCaseExecutionKey: 'KAN-53-KAN-46',
        stepId: '8517443',
        defectTestKey: 'KAN-100',
      },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/step/8517443/defect/KAN-100',
    );
    expect(init.method).toBe('POST');
  });

  it('rtm_get_test_case_execution_attachment GETs /attachment/{id}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ id: 'att-1', filename: 'log.txt' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_get_test_case_execution_attachment',
      arguments: {
        testCaseExecutionKey: 'KAN-53-KAN-46',
        attachmentId: 'att-1',
      },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/attachment/att-1',
    );
    expect(init.method).toBe('GET');
  });

  it('rtm_list_test_case_execution_step_attachments GETs /step/{stepId}/attachment', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse([{ id: 'att-7' }]));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_list_test_case_execution_step_attachments',
      arguments: {
        testCaseExecutionKey: 'KAN-53-KAN-46',
        stepId: '8517443',
      },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/step/8517443/attachment',
    );
    expect(init.method).toBe('GET');
  });

  it('rtm_upload_test_case_execution_step_attachment POSTs multipart to /step/{stepId}/attachment', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ id: 'att-7', filename: 'evidence.png' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_upload_test_case_execution_step_attachment',
      arguments: {
        testCaseExecutionKey: 'KAN-53-KAN-46',
        stepId: '8517443',
        filename: 'evidence.png',
        contentBase64: 'AQID', // base64 for [1,2,3]
        mimeType: 'image/png',
      },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/v2/test-case-execution/KAN-53-KAN-46/step/8517443/attachment',
    );
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('does NOT register any DELETE tool', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    const listed = await client.listTools();
    const names = listed.tools.map((t) => t.name);
    expect(names).not.toContain('rtm_unlink_defect_from_test_case_execution');
    expect(names).not.toContain('rtm_unlink_defect_from_test_case_execution_step');
    expect(names).not.toContain('rtm_delete_test_case_execution_attachment');
  });
});
