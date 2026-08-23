import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerTestPlanTools } from '../../src/tools/test-plans.js';
import { TestPlansResource } from '../../src/resources/test-plans.js';
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
  registerTestPlanTools(server, new TestPlansResource(new HttpClient(baseConfig)));
  const client = new Client({ name: 't', version: '0' }, { capabilities: {} });
  const [t1, t2] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(t1), client.connect(t2)]);
  return client;
}

describe('Test Plan MCP tools (V1)', () => {
  it('rtm_get_test_plan GETs /test-plan/{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_get_test_plan',
      arguments: { testPlanKey: 'ACME-1' },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1');
    expect(init.method).toBe('GET');
  });

  it('rtm_create_test_plan POSTs body with summary + issueTypeId', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_create_test_plan',
      arguments: {
        projectKey: 'ACME',
        summary: 'Smoke',
        issueTypeId: 10016,
      },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toMatchObject({
      projectKey: 'ACME',
      summary: 'Smoke',
      issueTypeId: 10016,
    });
  });

  it('rtm_update_test_plan PUTs /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_plan',
      arguments: { testPlanKey: 'ACME-1', summary: 'Updated' },
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ summary: 'Updated' });
  });

  it('rtm_delete_test_plan DELETEs /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_delete_test_plan',
      arguments: { testPlanKey: 'ACME-1' },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1');
    expect(init.method).toBe('DELETE');
  });

  it('rtm_update_test_plan_tc_order PUTs /{key}/tc-order with { order }', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_plan_tc_order',
      arguments: { testPlanKey: 'ACME-1', order: ['ACME-10', 'ACME-11'] },
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1/tc-order');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({
      order: ['ACME-10', 'ACME-11'],
    });
  });

  it('rtm_create_test_plan_folder POSTs /{key}/tree/folders', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_create_test_plan_folder',
      arguments: { testPlanKey: 'ACME-1', name: 'Smoke' },
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/test-plan/ACME-1/tree/folders',
    );
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Smoke' });
  });

  it('rtm_add_test_case_to_test_plan POSTs /{key}/testcases with { testKey }', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_add_test_case_to_test_plan',
      arguments: { testPlanKey: 'ACME-1', testCaseKey: 'ACME-10' },
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/test-plan/ACME-1/testcases');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ testKey: 'ACME-10' });
  });

  it('rtm_remove_test_case_from_test_plan DELETEs /{key}/testcases/{tcKey}', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_remove_test_case_from_test_plan',
      arguments: { testPlanKey: 'ACME-1', testCaseKey: 'ACME-10' },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://rtm.example.com/api/test-plan/ACME-1/testcases/ACME-10',
    );
    expect(init.method).toBe('DELETE');
  });

  it('registers exactly the 8 documented Test Plan tools', async () => {
    const client = await makeClient();
    const listed = await client.listTools();
    const names = listed.tools.map((t) => t.name).filter((n) =>
      n.startsWith('rtm_'),
    );
    expect(names).toEqual(
      expect.arrayContaining([
        'rtm_get_test_plan',
        'rtm_create_test_plan',
        'rtm_update_test_plan',
        'rtm_delete_test_plan',
        'rtm_update_test_plan_tc_order',
        'rtm_create_test_plan_folder',
        'rtm_add_test_case_to_test_plan',
        'rtm_remove_test_case_from_test_plan',
      ]),
    );
    // removed bulk link-management tool
    expect(names).not.toContain('rtm_update_test_plan_included_test_cases');
  });
});
