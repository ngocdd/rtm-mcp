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

describe('Test Plan MCP tools', () => {
  it('rtm_get_test_plan GETs /v2/test-plan/{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_get_test_plan',
      arguments: { testPlanKey: 'ACME-1' },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-plan/ACME-1');
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
    expect(url).toBe('https://rtm.example.com/api/v2/test-plan');
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
    expect(url).toBe('https://rtm.example.com/api/v2/test-plan/ACME-1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ summary: 'Updated' });
  });

  it('rtm_update_test_plan_included_test_cases SETs the link list', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_plan_included_test_cases',
      arguments: {
        testPlanKey: 'ACME-1',
        set: ['ACME-10', { testKey: 'ACME-11' }],
      },
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

  it('rtm_update_test_plan_included_test_cases ADDs to the link list', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_plan_included_test_cases',
      arguments: { testPlanKey: 'ACME-1', add: ['ACME-12'] },
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      includedTestCases: { add: [{ testKey: 'ACME-12' }] },
    });
  });

  it('rtm_update_test_plan_included_test_cases REMOVEs from the link list', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_plan_included_test_cases',
      arguments: { testPlanKey: 'ACME-1', remove: ['ACME-12'] },
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      includedTestCases: { remove: [{ testKey: 'ACME-12' }] },
    });
  });

  it('rtm_update_test_plan_included_test_cases rejects multiple operations', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_update_test_plan_included_test_cases',
      arguments: {
        testPlanKey: 'ACME-1',
        set: ['ACME-10'],
        add: ['ACME-11'],
      },
    });
    expect(res.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rtm_update_test_plan_included_test_cases rejects missing operation', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_update_test_plan_included_test_cases',
      arguments: { testPlanKey: 'ACME-1' },
    });
    expect(res.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does NOT register any DELETE tool', async () => {
    const client = await makeClient();
    const listed = await client.listTools();
    const names = listed.tools.map((t) => t.name);
    expect(names).not.toContain('rtm_delete_test_plan');
  });
});
