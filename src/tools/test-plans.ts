/**
 * MCP tool definitions for Test Plans.
 *
 * NOTE: `rtm_list_test_plans` was removed because the RTM REST API exposes no
 * list endpoint. Use the tree-structure tool to enumerate test plans in a
 * project.
 *
 * DELETE endpoints are intentionally NOT exposed as MCP tools — destructive
 * operations belong behind an explicit confirmation flow in the MCP client.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  IncludedTestCasesOperation,
  TestPlansResource,
} from '../resources/test-plans.js';
import {
  CreateTestPlanSchema,
  GetTestPlanSchema,
  UpdateIncludedTestCasesSchema,
  UpdateTestPlanSchema,
} from '../schemas/test-plan.schema.js';
import { errorResult, textResult, toErrorResult } from '../utils/response.js';

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
    'rtm_update_test_plan_included_test_cases',
    'Manage included-test-case links on a Test Plan. Pass exactly one of `set` (replace the whole set), `add` (append), or `remove` (drop from the set). Wire call: PUT /api/v2/test-plan/{key}/included-test-cases with body `{ includedTestCases: { <op>: [...] } }`.',
    UpdateIncludedTestCasesSchema.shape,
    async (args) => {
      try {
        const { testPlanKey, set, add, remove } = args;
        const ops = [set, add, remove].filter((v) => v !== undefined);
        if (ops.length !== 1) {
          return errorResult(
            'Provide exactly one of `set`, `add`, or `remove` — these are mutually exclusive operations on the same endpoint.',
          );
        }

        const operation: IncludedTestCasesOperation =
          set !== undefined
            ? { set: normalizeRefList(set) }
            : add !== undefined
              ? { add: normalizeRefList(add) }
              : { remove: normalizeRefList(remove as never) };

        return textResult(
          await resource.updateIncludedTestCases(testPlanKey, operation),
        );
      } catch (err) {
        return toErrorResult(err, 'rtm_update_test_plan_included_test_cases');
      }
    },
  );
}

function normalizeRefList(
  refs: ReadonlyArray<string | { testKey: string }>,
): Array<{ testKey: string }> {
  return refs.map((r) => (typeof r === 'string' ? { testKey: r } : r));
}
