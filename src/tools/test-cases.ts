/**
 * MCP tool definitions for Test Cases.
 *
 * NOTE: `rtm_list_test_cases` was removed because the RTM REST API exposes no
 * list endpoint. Use the tree-structure tool to enumerate test cases in a
 * project. Covered-requirements link tools were removed because the underlying
 * PUT endpoints return 404 on the live API.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TestCasesResource } from '../resources/test-cases.js';
import {
  CreateTestCaseSchema,
  DeleteTestCaseSchema,
  GetTestCaseSchema,
  UpdateTestCaseSchema,
} from '../schemas/test-case.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerTestCaseTools(
  server: McpServer,
  resource: TestCasesResource,
): void {
  server.tool(
    'rtm_get_test_case',
    'Fetch a single Test Case by its test key.',
    GetTestCaseSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.get(args.testCaseKey));
      } catch (err) {
        return toErrorResult(err, 'rtm_get_test_case');
      }
    },
  );

  server.tool(
    'rtm_create_test_case',
    'Create a new Test Case. Pass `stepGroups` to define steps.',
    CreateTestCaseSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.create(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_create_test_case');
      }
    },
  );

  server.tool(
    'rtm_update_test_case',
    'Update an existing Test Case. Only provided fields are changed.',
    UpdateTestCaseSchema.shape,
    async (args) => {
      try {
        const { testCaseKey, ...patch } = args;
        return textResult(await resource.update(testCaseKey, patch));
      } catch (err) {
        return toErrorResult(err, 'rtm_update_test_case');
      }
    },
  );

  server.tool(
    'rtm_delete_test_case',
    'Permanently delete a Test Case.',
    DeleteTestCaseSchema.shape,
    async (args) => {
      try {
        await resource.delete(args.testCaseKey);
        return textResult({ deleted: true, testCaseKey: args.testCaseKey });
      } catch (err) {
        return toErrorResult(err, 'rtm_delete_test_case');
      }
    },
  );
}
