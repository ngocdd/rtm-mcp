/**
 * Builds the MCP server instance and wires up the tool registry.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Config } from './config/env.js';
import { HttpClient } from './client/http.js';
import { RtmClient } from './client/rtm-client.js';
import { logger } from './utils/logger.js';
import { registerAllTools } from './tools/index.js';

export function createServer(config: Config): McpServer {
  logger.setLevel(config.logLevel);

  const server = new McpServer(
    {
      name: 'rtm-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
      instructions:
        'RTM MCP server. Exposes Requirements, Test Cases, Test Plans, Test Executions, ' +
        'Test Case Executions, Defects, Tree Structure and Automation over the RTM REST API v2. ' +
        'All actions are scoped to the user who owns the configured RTM_API_TOKEN.',
    },
  );

  const http = new HttpClient(config);
  const rtm = new RtmClient(http);
  registerAllTools(server, rtm);
  return server;
}
