import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerRequirementTools } from '../../src/tools/requirements.js';
import { RequirementsResource } from '../../src/resources/requirements.js';
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
  registerRequirementTools(
    server,
    new RequirementsResource(new HttpClient(baseConfig)),
  );
  const client = new Client({ name: 't', version: '0' }, { capabilities: {} });
  const [t1, t2] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(t1), client.connect(t2)]);
  return client;
}

describe('Requirement MCP tools', () => {
  it('rtm_create_requirement POSTs the payload with summary + issueTypeId', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_create_requirement',
      arguments: {
        projectKey: 'ACME',
        summary: 'My req',
        issueTypeId: 10015,
      },
    });
    expect(res.isError).toBeFalsy();
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toMatchObject({
      projectKey: 'ACME',
      summary: 'My req',
      issueTypeId: 10015,
    });
  });

  it('rtm_create_requirement validates missing summary', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_create_requirement',
      // @ts-expect-error testing missing fields
      arguments: { projectKey: 'ACME', issueTypeId: 10015 },
    });
    expect(res.isError).toBe(true);
    // zod validation error surfaces via isError
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rtm_create_requirement validates missing issueTypeId', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ key: 'NEW-1' }));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_create_requirement',
      // @ts-expect-error testing missing fields
      arguments: { projectKey: 'ACME', summary: 'x' },
    });
    expect(res.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns isError on 404', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'no' }, 404));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_get_requirement',
      arguments: { requirementKey: 'NOPE' },
    });
    expect(res.isError).toBe(true);
    const block = res.content[0] as { type: string; text: string };
    expect(block.text).toMatch(/not found/i);
  });

  it('returns isError with auth hint on 401', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'no' }, 401));
    const client = await makeClient();
    const res = await client.callTool({
      name: 'rtm_get_requirement',
      arguments: { requirementKey: 'ANY' },
    });
    expect(res.isError).toBe(true);
    const block = res.content[0] as { type: string; text: string };
    expect(block.text).toMatch(/Authentication failed|RTM_API_TOKEN/i);
  });
});
