/**
 * MCP tool definitions for Test Plans.
 *
 * Mirrors the V1 deviniti REST API: GET / PUT / POST / DELETE on
 * `/api/test-plan/{testKey}` plus four sub-paths (`tc-order`, `tree/folders`,
 * `testcases`, `testcases/{tcKey}`). The earlier `updateIncludedTestCases`
 * helper (`PUT /api/v2/test-plan/{key}/included-test-cases`) is intentionally
 * gone — the public REST API exposes per-case add/remove endpoints, not a
 * bulk link-management endpoint.
 *
 * NOTE: `rtm_list_test_plans` was removed because the RTM REST API exposes no
 * list endpoint. Use the tree-structure tool to enumerate test plans in a
 * project.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TestPlansResource } from '../resources/test-plans.js';
import {
  AddTestCaseToTestPlanSchema,
  CreateTestPlanFolderSchema,
  CreateTestPlanSchema,
  DeleteTestPlanSchema,
  GetTestPlanSchema,
  RemoveTestCaseFromTestPlanSchema,
  UpdateTestCaseOrderSchema,
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

  server.tool(
    'rtm_update_test_plan_tc_order',
    'Re-order the test cases already included in a Test Plan. Wire call: PUT /api/test-plan/{key}/tc-order with body `{ order: ["TC-1", "TC-2", ...] }`.',
    UpdateTestCaseOrderSchema.shape,
    async (args) => {
      try {
        const { testPlanKey, order } = args;
        return textResult(await resource.updateTestCaseOrder(testPlanKey, { order }));
      } catch (err) {
        return toErrorResult(err, 'rtm_update_test_plan_tc_order');
      }
    },
  );

  server.tool(
    'rtm_create_test_plan_folder',
    'Create a folder inside a Test Plan tree. Wire call: POST /api/test-plan/{key}/tree/folders.',
    CreateTestPlanFolderSchema.shape,
    async (args) => {
      try {
        const { testPlanKey, ...body } = args;
        return textResult(await resource.createFolder(testPlanKey, body));
      } catch (err) {
        return toErrorResult(err, 'rtm_create_test_plan_folder');
      }
    },
  );

  server.tool(
    'rtm_add_test_case_to_test_plan',
    'Add a Test Case to a Test Plan. Wire call: POST /api/test-plan/{key}/testcases with body `{ testKey: "..." }`.',
    AddTestCaseToTestPlanSchema.shape,
    async (args) => {
      try {
        return textResult(
          await resource.addTestCase(args.testPlanKey, args.testCaseKey),
        );
      } catch (err) {
        return toErrorResult(err, 'rtm_add_test_case_to_test_plan');
      }
    },
  );

  server.tool(
    'rtm_remove_test_case_from_test_plan',
    'Remove a Test Case from a Test Plan. Wire call: DELETE /api/test-plan/{key}/testcases/{tcKey}.',
    RemoveTestCaseFromTestPlanSchema.shape,
    async (args) => {
      try {
        await resource.removeTestCase(args.testPlanKey, args.testCaseKey);
        return textResult({
          removed: true,
          testPlanKey: args.testPlanKey,
          testCaseKey: args.testCaseKey,
        });
      } catch (err) {
        return toErrorResult(err, 'rtm_remove_test_case_from_test_plan');
      }
    },
  );
}
