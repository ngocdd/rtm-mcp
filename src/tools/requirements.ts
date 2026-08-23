/**
 * MCP tool definitions for Requirements.
 *
 * Each tool calls the matching method on the RequirementsResource and
 * wraps the result as MCP content. Errors are mapped via toErrorResult.
 *
 * NOTE: `rtm_list_requirements` was removed because the RTM REST API exposes
 * no list endpoint. Use the tree-structure tool to enumerate requirements in
 * a project.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequirementsResource } from '../resources/requirements.js';
import {
  CreateRequirementSchema,
  DeleteRequirementSchema,
  GetRequirementSchema,
  UpdateRequirementSchema,
} from '../schemas/requirement.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerRequirementTools(
  server: McpServer,
  resource: RequirementsResource,
): void {
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
}
