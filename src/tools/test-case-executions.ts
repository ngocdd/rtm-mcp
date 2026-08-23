/**
 * MCP tool definitions for Test Case Executions.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TestCaseExecutionsResource } from '../resources/test-case-executions.js';
import {
  LinkDefectToStepSchema,
  LinkDefectToTceSchema,
  ListTceAttachmentsSchema,
  UnlinkDefectFromStepSchema,
  UnlinkDefectFromTceSchema,
  UploadTceAttachmentSchema,
} from '../schemas/test-case-execution.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerTestCaseExecutionTools(
  server: McpServer,
  resource: TestCaseExecutionsResource,
): void {
  server.tool(
    'rtm_link_defect_to_test_case_execution',
    'Link a Defect to a Test Case Execution (whole, not a specific step).',
    LinkDefectToTceSchema.shape,
    async (args) => {
      try {
        await resource.linkDefect(args.testCaseExecutionKey, args.defectTestKey);
        return textResult({ ok: true, ...args });
      } catch (err) {
        return toErrorResult(err, 'rtm_link_defect_to_test_case_execution');
      }
    },
  );

  server.tool(
    'rtm_unlink_defect_from_test_case_execution',
    'Unlink a Defect from a Test Case Execution.',
    UnlinkDefectFromTceSchema.shape,
    async (args) => {
      try {
        await resource.unlinkDefect(args.testCaseExecutionKey, args.defectTestKey);
        return textResult({ ok: true, ...args });
      } catch (err) {
        return toErrorResult(err, 'rtm_unlink_defect_from_test_case_execution');
      }
    },
  );

  server.tool(
    'rtm_link_defect_to_test_case_execution_step',
    'Link a Defect to a specific step inside a Test Case Execution.',
    LinkDefectToStepSchema.shape,
    async (args) => {
      try {
        await resource.linkStepDefect(
          args.testCaseExecutionKey,
          args.stepId,
          args.defectTestKey,
        );
        return textResult({ ok: true, ...args });
      } catch (err) {
        return toErrorResult(err, 'rtm_link_defect_to_test_case_execution_step');
      }
    },
  );

  server.tool(
    'rtm_unlink_defect_from_test_case_execution_step',
    'Unlink a Defect from a specific step inside a Test Case Execution.',
    UnlinkDefectFromStepSchema.shape,
    async (args) => {
      try {
        await resource.unlinkStepDefect(
          args.testCaseExecutionKey,
          args.stepId,
          args.defectTestKey,
        );
        return textResult({ ok: true, ...args });
      } catch (err) {
        return toErrorResult(err, 'rtm_unlink_defect_from_test_case_execution_step');
      }
    },
  );

  server.tool(
    'rtm_list_test_case_execution_attachments',
    'List Attachments on a Test Case Execution.',
    ListTceAttachmentsSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.listAttachments(args.testCaseExecutionKey));
      } catch (err) {
        return toErrorResult(err, 'rtm_list_test_case_execution_attachments');
      }
    },
  );

  server.tool(
    'rtm_upload_test_case_execution_attachment',
    'Upload an Attachment to a Test Case Execution. Provide file contents as base64.',
    UploadTceAttachmentSchema.shape,
    async (args) => {
      try {
        const data = Buffer.from(args.contentBase64, 'base64');
        const attachment = await resource.uploadAttachment(args.testCaseExecutionKey, {
          filename: args.filename,
          data,
          mimeType: args.mimeType,
        });
        return textResult(attachment);
      } catch (err) {
        return toErrorResult(err, 'rtm_upload_test_case_execution_attachment');
      }
    },
  );
}
