/**
 * Tool registry — registers every MCP tool against the shared McpServer.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RtmClient } from '../client/rtm-client.js';
import { logger } from '../utils/logger.js';
import { registerRequirementTools } from './requirements.js';
import { registerTestCaseTools } from './test-cases.js';
import { registerTestPlanTools } from './test-plans.js';
import { registerTestExecutionTools } from './test-executions.js';
import { registerTestCaseExecutionTools } from './test-case-executions.js';
import { registerDefectTools } from './defects.js';
import { registerTreeTools } from './tree.js';
import { registerAutomationTools } from './automation.js';

export function registerAllTools(server: McpServer, rtm: RtmClient): void {
  logger.debug('registering tools');
  registerRequirementTools(server, rtm.requirements);
  registerTestCaseTools(server, rtm.testCases);
  registerTestPlanTools(server, rtm.testPlans);
  registerTestExecutionTools(server, rtm.testExecutions);
  registerTestCaseExecutionTools(server, rtm.testCaseExecutions);
  registerDefectTools(server, rtm.defects);
  registerTreeTools(server, rtm.treeStructure);
  registerAutomationTools(server, rtm.automation);
}
