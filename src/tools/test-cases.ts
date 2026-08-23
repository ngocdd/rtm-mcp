/**
 * MCP tool definitions for Test Cases.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TestCasesResource } from '../resources/test-cases.js';
import {
  AddCoveredRequirementsSchema,
  CreateTestCaseSchema,
  DeleteTestCaseSchema,
  GetTestCaseSchema,
  ListTestCasesSchema,
  RemoveCoveredRequirementsSchema,
  SetCoveredRequirementsSchema,
  UpdateTestCaseSchema,
} from '../schemas/test-case.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerTestCaseTools(
  server: McpServer,
  resource: TestCasesResource,
): void {
  server.tool(
    'rtm_list_test_cases',
    'List Test Cases in a Jira project with optional folder filter and pagination.',
    ListTestCasesSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.list(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_list_test_cases');
      }
    },
  );

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

  server.tool(
    'rtm_set_test_case_covered_requirements',
    'Replace the set of Requirements covered by this Test Case.',
    SetCoveredRequirementsSchema.shape,
    async (args) => {
      try {
        await resource.setCoveredRequirements(args.testCaseKey, args.requirementKeys);
        return textResult({ ok: true, testCaseKey: args.testCaseKey, action: 'set' });
      } catch (err) {
        return toErrorResult(err, 'rtm_set_test_case_covered_requirements');
      }
    },
  );

  server.tool(
    'rtm_add_test_case_covered_requirements',
    'Append Requirements to the existing covered set of a Test Case.',
    AddCoveredRequirementsSchema.shape,
    async (args) => {
      try {
        await resource.addCoveredRequirements(args.testCaseKey, args.requirementKeys);
        return textResult({ ok: true, testCaseKey: args.testCaseKey, action: 'add' });
      } catch (err) {
        return toErrorResult(err, 'rtm_add_test_case_covered_requirements');
      }
    },
  );

  server.tool(
    'rtm_remove_test_case_covered_requirements',
    'Remove specific Requirements from the covered set of a Test Case.',
    RemoveCoveredRequirementsSchema.shape,
    async (args) => {
      try {
        await resource.removeCoveredRequirements(args.testCaseKey, args.requirementKeys);
        return textResult({ ok: true, testCaseKey: args.testCaseKey, action: 'remove' });
      } catch (err) {
        return toErrorResult(err, 'rtm_remove_test_case_covered_requirements');
      }
    },
  );
}
