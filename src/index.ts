#!/usr/bin/env node
/**
 * RTM MCP Server — entry point.
 *
 * Reads configuration from environment variables, creates the MCP server,
 * wires the stdio transport and connects. Logs go to stderr only —
 * stdout is reserved for JSON-RPC messages exchanged with the MCP client.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config/env.js';
import { createServer } from './server.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const config = loadConfig();
  logger.info(
    `rtm-mcp starting — baseUrl=${redactUrl(config.baseUrl)}, logLevel=${config.logLevel}`,
  );

  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('rtm-mcp connected via stdio');
}

/**
 * Redact userinfo and trailing path from the base URL so we never
 * accidentally leak credentials in log lines.
 */
function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '<invalid-url>';
  }
}

main().catch((err) => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});
