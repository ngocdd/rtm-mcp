/**
 * MCP tool definitions for Test Plans.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TestPlansResource } from '../resources/test-plans.js';
import {
  AddIncludedTestCasesSchema,
  CreateTestPlanSchema,
  DeleteTestPlanSchema,
  GetTestPlanSchema,
  ListTestPlansSchema,
  RemoveIncludedTestCasesSchema,
  SetIncludedTestCasesSchema,
  UpdateTestPlanSchema,
} from '../schemas/test-plan.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerTestPlanTools(
  server: McpServer,
  resource: TestPlansResource,
): void {
  server.tool(
    'rtm_list_test_plans',
    'List Test Plans in a Jira project.',
    ListTestPlansSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.list(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_list_test_plans');
      }
    },
  );

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
    'rtm_set_test_plan_included_test_cases',
    'Replace the set of Test Cases included in a Test Plan.',
    SetIncludedTestCasesSchema.shape,
    async (args) => {
      try {
        await resource.setIncludedTestCases(args.testPlanKey, args.testCaseKeys);
        return textResult({ ok: true, testPlanKey: args.testPlanKey, action: 'set' });
      } catch (err) {
        return toErrorResult(err, 'rtm_set_test_plan_included_test_cases');
      }
    },
  );

  server.tool(
    'rtm_add_test_plan_included_test_cases',
    'Append Test Cases to a Test Plan.',
    AddIncludedTestCasesSchema.shape,
    async (args) => {
      try {
        await resource.addIncludedTestCases(args.testPlanKey, args.testCaseKeys);
        return textResult({ ok: true, testPlanKey: args.testPlanKey, action: 'add' });
      } catch (err) {
        return toErrorResult(err, 'rtm_add_test_plan_included_test_cases');
      }
    },
  );

  server.tool(
    'rtm_remove_test_plan_included_test_cases',
    'Remove Test Cases from a Test Plan.',
    RemoveIncludedTestCasesSchema.shape,
    async (args) => {
      try {
        await resource.removeIncludedTestCases(args.testPlanKey, args.testCaseKeys);
        return textResult({ ok: true, testPlanKey: args.testPlanKey, action: 'remove' });
      } catch (err) {
        return toErrorResult(err, 'rtm_remove_test_plan_included_test_cases');
      }
    },
  );
}
