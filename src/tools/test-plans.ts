/**
 * MCP tool definitions for Test Plans.
 *
 * NOTE: `rtm_list_test_plans` was removed because the RTM REST API exposes no
 * list endpoint. Use the tree-structure tool to enumerate test plans in a
 * project. Included-test-cases link tools were removed because the underlying
 * PUT endpoints return 404 on the live API.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TestPlansResource } from '../resources/test-plans.js';
import {
  CreateTestPlanSchema,
  DeleteTestPlanSchema,
  GetTestPlanSchema,
  UpdateTestPlanSchema,
} from '../schemas/test-plan.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerTestPlanTools(
  server: McpServer,
  resource: TestPlansResource,
): void {
  server.tool(
    'rtm_get_test_plan',
    'Fetch a single Test Plan by its test key.',
    GetTestPlanSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.get(args.testPlanKey));
      } catch (err) {
        return toErrorResult(err, 'rtm_get_test_plan');
      }
    },
  );

  server.tool(
    'rtm_create_test_plan',
    'Create a new Test Plan.',
    CreateTestPlanSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.create(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_create_test_plan');
      }
    },
  );

  server.tool(
    'rtm_update_test_plan',
    'Update an existing Test Plan. Only provided fields are changed.',
    UpdateTestPlanSchema.shape,
    async (args) => {
      try {
        const { testPlanKey, ...patch } = args;
        return textResult(await resource.update(testPlanKey, patch));
      } catch (err) {
        return toErrorResult(err, 'rtm_update_test_plan');
      }
    },
  );

  server.tool(
    'rtm_delete_test_plan',
    'Permanently delete a Test Plan.',
    DeleteTestPlanSchema.shape,
    async (args) => {
      try {
        await resource.delete(args.testPlanKey);
        return textResult({ deleted: true, testPlanKey: args.testPlanKey });
      } catch (err) {
        return toErrorResult(err, 'rtm_delete_test_plan');
      }
    },
  );
}
