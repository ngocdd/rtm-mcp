/**
 * MCP tool definitions for Defects.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DefectsResource } from '../resources/defects.js';
import {
  CreateDefectSchema,
  DeleteDefectSchema,
  GetDefectSchema,
  ListDefectsSchema,
  SetIdentifyingTestCasesSchema,
  UpdateDefectSchema,
} from '../schemas/defect.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerDefectTools(
  server: McpServer,
  resource: DefectsResource,
): void {
  server.tool(
    'rtm_list_defects',
    'List Defects in a Jira project.',
    ListDefectsSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.list(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_list_defects');
      }
    },
  );

  server.tool(
    'rtm_get_defect',
    'Fetch a single Defect by its test key.',
    GetDefectSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.get(args.defectKey));
      } catch (err) {
        return toErrorResult(err, 'rtm_get_defect');
      }
    },
  );

  server.tool(
    'rtm_create_defect',
    'Create a new Defect.',
    CreateDefectSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.create(args));
      } catch (err) {
        return toErrorResult(err, 'rtm_create_defect');
      }
    },
  );

  server.tool(
    'rtm_update_defect',
    'Update an existing Defect. Only provided fields are changed.',
    UpdateDefectSchema.shape,
    async (args) => {
      try {
        const { defectKey, ...patch } = args;
        return textResult(await resource.update(defectKey, patch));
      } catch (err) {
        return toErrorResult(err, 'rtm_update_defect');
      }
    },
  );

  server.tool(
    'rtm_delete_defect',
    'Permanently delete a Defect.',
    DeleteDefectSchema.shape,
    async (args) => {
      try {
        await resource.delete(args.defectKey);
        return textResult({ deleted: true, defectKey: args.defectKey });
      } catch (err) {
        return toErrorResult(err, 'rtm_delete_defect');
      }
    },
  );

  server.tool(
    'rtm_set_defect_identifying_test_cases',
    'Replace the set of identifying Test Cases for a Defect.',
    SetIdentifyingTestCasesSchema.shape,
    async (args) => {
      try {
        await resource.setIdentifyingTestCases(args.defectKey, args.testCaseKeys);
        return textResult({ ok: true, defectKey: args.defectKey });
      } catch (err) {
        return toErrorResult(err, 'rtm_set_defect_identifying_test_cases');
      }
    },
  );
}
