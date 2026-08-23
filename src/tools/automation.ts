/**
 * MCP tool definitions for Automation (CI result import).
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AutomationResource } from '../resources/automation.js';
import {
  GetImportStatusSchema,
  ImportTestResultsSchema,
} from '../schemas/automation.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerAutomationTools(
  server: McpServer,
  resource: AutomationResource,
): void {
  server.tool(
    'rtm_import_test_results',
    'Upload a ZIP/TAR.GZ archive of test results to RTM. Returns a task ID for polling.',
    ImportTestResultsSchema.shape,
    async (args) => {
      try {
        const buffer = Buffer.from(args.contentBase64, 'base64');
        const result = await resource.importTestResults({
          projectKey: args.projectKey,
          name: args.name,
          filename: args.filename,
          file: buffer,
          reportType: args.reportType,
          jobUrl: args.jobUrl,
          treePath: args.treePath,
          testExecutionFields: args.testExecutionFields,
          testCaseFields: args.testCaseFields,
        });
        return textResult(result);
      } catch (err) {
        return toErrorResult(err, 'rtm_import_test_results');
      }
    },
  );

  server.tool(
    'rtm_get_import_status',
    'Poll the status of a previously submitted test-results import task.',
    GetImportStatusSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.getImportStatus(args.taskId));
      } catch (err) {
        return toErrorResult(err, 'rtm_get_import_status');
      }
    },
  );
}
