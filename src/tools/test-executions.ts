/**
 * MCP tool definitions for Test Executions.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TestExecutionsResource } from '../resources/test-executions.js';
import {
  CreateTestExecutionSchema,
  DeleteTestExecutionSchema,
  GetTestExecutionSchema,
  ListTestExecutionsSchema,
  UpdateTestExecutionSchema,
} from '../schemas/test-execution.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerTestExecutionTools(
  server: McpServer,
  resource: TestExecutionsResource,
): void {
  server.tool(
    'rtm_list_test_executions',
    'List Test Executions in a Jira project.',
    ListTestExecutionsSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.list(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_list_test_executions');
      }
    },
  );

  server.tool(
    'rtm_get_test_execution',
    'Fetch a single Test Execution by its test key.',
    GetTestExecutionSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.get(args.testExecutionKey));
      } catch (err) {
        return toErrorResult(err, 'rtm_get_test_execution');
      }
    },
  );

  server.tool(
    'rtm_create_test_execution',
    'Create a new Test Execution.',
    CreateTestExecutionSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.create(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_create_test_execution');
      }
    },
  );

  server.tool(
    'rtm_update_test_execution',
    'Update an existing Test Execution. Only provided fields are changed.',
    UpdateTestExecutionSchema.shape,
    async (args) => {
      try {
        const { testExecutionKey, ...patch } = args;
        return textResult(await resource.update(testExecutionKey, patch));
      } catch (err) {
        return toErrorResult(err, 'rtm_update_test_execution');
      }
    },
  );

  server.tool(
    'rtm_delete_test_execution',
    'Permanently delete a Test Execution.',
    DeleteTestExecutionSchema.shape,
    async (args) => {
      try {
        await resource.delete(args.testExecutionKey);
        return textResult({ deleted: true, testExecutionKey: args.testExecutionKey });
      } catch (err) {
        return toErrorResult(err, 'rtm_delete_test_execution');
      }
    },
  );
}
