import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerTestCaseTools } from '../../src/tools/test-cases.js';
import { TestCasesResource } from '../../src/resources/test-cases.js';
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
  registerTestCaseTools(server, new TestCasesResource(new HttpClient(baseConfig)));
  const client = new Client({ name: 't', version: '0' }, { capabilities: {} });
  const [t1, t2] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(t1), client.connect(t2)]);
  return client;
}

describe('Test Case MCP tools', () => {
  it('rtm_get_test_case GETs /v2/test-case/{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'ACME-1' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_get_test_case',
      arguments: { testCaseKey: 'ACME-1' },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case/ACME-1');
    expect(init.method).toBe('GET');
  });

  it('rtm_create_test_case POSTs body with summary + issueTypeId', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_create_test_case',
      arguments: {
        projectKey: 'ACME',
        summary: 'Login',
        issueTypeId: 10015,
      },
    });
    expect(res.isError).toBeFalsy();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toMatchObject({
      projectKey: 'ACME',
      summary: 'Login',
      issueTypeId: 10015,
    });
  });

  it('rtm_update_test_case PUTs /{key}', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_case',
      arguments: { testCaseKey: 'ACME-1', summary: 'Updated' },
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://rtm.example.com/api/v2/test-case/ACME-1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ summary: 'Updated' });
  });

  it('rtm_update_test_case_covered_requirements SETs the link list', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_case_covered_requirements',
      arguments: {
        testCaseKey: 'ACME-1',
        set: ['ACME-10', { testKey: 'ACME-11' }],
      },
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

  it('rtm_update_test_case_covered_requirements ADDs to the link list', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_case_covered_requirements',
      arguments: { testCaseKey: 'ACME-1', add: ['ACME-12'] },
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      coveredRequirements: { add: [{ testKey: 'ACME-12' }] },
    });
  });

  it('rtm_update_test_case_covered_requirements REMOVEs from the link list', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    await client.callTool({
      name: 'rtm_update_test_case_covered_requirements',
      arguments: { testCaseKey: 'ACME-1', remove: ['ACME-12'] },
    });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      coveredRequirements: { remove: [{ testKey: 'ACME-12' }] },
    });
  });

  it('rtm_update_test_case_covered_requirements rejects multiple operations', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_update_test_case_covered_requirements',
      arguments: {
        testCaseKey: 'ACME-1',
        set: ['ACME-10'],
        add: ['ACME-11'],
      },
    });
    expect(res.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rtm_update_test_case_covered_requirements rejects missing operation', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({}));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_update_test_case_covered_requirements',
      arguments: { testCaseKey: 'ACME-1' },
    });
    expect(res.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does NOT register any DELETE tool', async () => {
    const client = await makeClient();
    const listed = await client.listTools();
    const names = listed.tools.map((t) => t.name);
    expect(names).not.toContain('rtm_delete_test_case');
  });
});
