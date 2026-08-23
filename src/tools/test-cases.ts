/**
 * MCP tool definitions for Test Cases.
 *
 * NOTE: `rtm_list_test_cases` was removed because the RTM REST API exposes no
 * list endpoint. Use the tree-structure tool to enumerate test cases in a
 * project.
 *
 * DELETE endpoints are intentionally NOT exposed as MCP tools — destructive
 * operations belong behind an explicit confirmation flow in the MCP client.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  CoveredRequirementsOperation,
  TestCasesResource,
} from '../resources/test-cases.js';
import {
  CreateTestCaseSchema,
  GetTestCaseSchema,
  UpdateCoveredRequirementsSchema,
  UpdateTestCaseSchema,
} from '../schemas/test-case.schema.js';
import { textResult, errorResult, toErrorResult } from '../utils/response.js';

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
    'rtm_update_test_case_covered_requirements',
    'Manage covered-requirements links on a Test Case. Pass exactly one of `set` (replace the whole link set), `add` (append), or `remove` (drop from the set). Wire call: PUT /api/v2/test-case/{key}/covered-requirements with body `{ coveredRequirements: { <op>: [...] } }`.',
    UpdateCoveredRequirementsSchema.shape,
    async (args) => {
      try {
        const { testCaseKey, set, add, remove } = args;
        const ops = [set, add, remove].filter((v) => v !== undefined);
        if (ops.length !== 1) {
          return errorResult(
            'Provide exactly one of `set`, `add`, or `remove` — these are mutually exclusive operations on the same endpoint.',
          );
        }

        const operation: CoveredRequirementsOperation =
          set !== undefined
            ? { set: normalizeRefList(set) }
            : add !== undefined
              ? { add: normalizeRefList(add) }
              : { remove: normalizeRefList(remove as never) };

        return textResult(
          await resource.updateCoveredRequirements(testCaseKey, operation),
        );
      } catch (err) {
        return toErrorResult(err, 'rtm_update_test_case_covered_requirements');
      }
    },
  );
}

function normalizeRefList(
  refs: ReadonlyArray<string | { testKey: string }>,
): Array<{ testKey: string }> {
  return refs.map((r) => (typeof r === 'string' ? { testKey: r } : r));
}
