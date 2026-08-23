/**
 * MCP tool definitions for Requirements.
 *
 * Each tool calls the matching method on the RequirementsResource and
 * wraps the result as MCP content. Errors are mapped via toErrorResult.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequirementsResource } from '../resources/requirements.js';
import {
  AddCoveredTestCasesSchema,
  CreateRequirementSchema,
  DeleteRequirementSchema,
  GetRequirementSchema,
  ListRequirementsSchema,
  RemoveCoveredTestCasesSchema,
  SetCoveredTestCasesSchema,
  UpdateRequirementSchema,
} from '../schemas/requirement.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerRequirementTools(
  server: McpServer,
  resource: RequirementsResource,
): void {
  server.tool(
    'rtm_list_requirements',
    'List Requirements in a Jira project. Supports folder and basic pagination.',
    ListRequirementsSchema.shape,
    async (args) => {
      try {
        const result = await resource.list(args);
        return textResult(result);
      } catch (err) {
        return toErrorResult(err, 'rtm_list_requirements');
      }
    },
  );

  server.tool(
    'rtm_get_requirement',
    'Fetch a single Requirement by its test key.',
    GetRequirementSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.get(args.requirementKey));
      } catch (err) {
        return toErrorResult(err, 'rtm_get_requirement');
      }
    },
  );

  server.tool(
    'rtm_create_requirement',
    'Create a new Requirement in a Jira project.',
    CreateRequirementSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.create(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_create_requirement');
      }
    },
  );

  server.tool(
    'rtm_update_requirement',
    'Update an existing Requirement. Only provided fields are changed.',
    UpdateRequirementSchema.shape,
    async (args) => {
      try {
        const { requirementKey, ...patch } = args;
        return textResult(await resource.update(requirementKey, patch));
      } catch (err) {
        return toErrorResult(err, 'rtm_update_requirement');
      }
    },
  );

  server.tool(
    'rtm_delete_requirement',
    'Permanently delete a Requirement.',
    DeleteRequirementSchema.shape,
    async (args) => {
      try {
        await resource.delete(args.requirementKey);
        return textResult({ deleted: true, requirementKey: args.requirementKey });
      } catch (err) {
        return toErrorResult(err, 'rtm_delete_requirement');
      }
    },
  );

  server.tool(
    'rtm_set_requirement_covered_test_cases',
    'Replace the set of Test Cases that cover this Requirement.',
    SetCoveredTestCasesSchema.shape,
    async (args) => {
      try {
        await resource.setCoveredTestCases(args.requirementKey, args.testCaseKeys);
        return textResult({ ok: true, requirementKey: args.requirementKey, action: 'set' });
      } catch (err) {
        return toErrorResult(err, 'rtm_set_requirement_covered_test_cases');
      }
    },
  );

  server.tool(
    'rtm_add_requirement_covered_test_cases',
    'Append Test Cases to the existing covered set of a Requirement.',
    AddCoveredTestCasesSchema.shape,
    async (args) => {
      try {
        await resource.addCoveredTestCases(args.requirementKey, args.testCaseKeys);
        return textResult({ ok: true, requirementKey: args.requirementKey, action: 'add' });
      } catch (err) {
        return toErrorResult(err, 'rtm_add_requirement_covered_test_cases');
      }
    },
  );

  server.tool(
    'rtm_remove_requirement_covered_test_cases',
    'Remove specific Test Cases from the covered set of a Requirement.',
    RemoveCoveredTestCasesSchema.shape,
    async (args) => {
      try {
        await resource.removeCoveredTestCases(args.requirementKey, args.testCaseKeys);
        return textResult({ ok: true, requirementKey: args.requirementKey, action: 'remove' });
      } catch (err) {
        return toErrorResult(err, 'rtm_remove_requirement_covered_test_cases');
      }
    },
  );
}
