/**
 * MCP tool definitions for Test Case Executions.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TestCaseExecutionsResource } from '../resources/test-case-executions.js';
import {
  GetTceAttachmentSchema,
  GetTestCaseExecutionSchema,
  LinkDefectToStepSchema,
  LinkDefectToTceSchema,
  ListStepAttachmentsSchema,
  ListTceAttachmentsSchema,
  UpdateTestCaseExecutionSchema,
  UploadStepAttachmentSchema,
  UploadTceAttachmentSchema,
} from '../schemas/test-case-execution.schema.js';
import { textResult, toErrorResult } from '../utils/response.js';

export function registerTestCaseExecutionTools(
  server: McpServer,
  resource: TestCaseExecutionsResource,
): void {
  server.tool(
    'rtm_get_test_case_execution',
    'Fetch a single Test Case Execution by its test key. Returns result, executor, comment, attached defects and per-step status.',
    GetTestCaseExecutionSchema.shape,
    async (args) => {
      try {
        return textResult(await resource.get(args.testCaseExecutionKey));
      } catch (err) {
        return toErrorResult(err, 'rtm_get_test_case_execution');
      }
    },
  );

  server.tool(
    'rtm_update_test_case_execution',
    'Update an existing Test Case Execution. Use `result: "Fail"` (or `"Pass"`, `"Blocked"`, ...) to set the pass/fail status of an individual run. Only provided fields are changed.',
    UpdateTestCaseExecutionSchema.shape,
    async (args) => {
      try {
        const { testCaseExecutionKey, ...patch } = args;
        return textResult(await resource.update(testCaseExecutionKey, patch));
      } catch (err) {
        return toErrorResult(err, 'rtm_update_test_case_execution');
      }
    },
  );

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

  server.tool(
    'rtm_get_test_case_execution_attachment',
    'Fetch metadata for a single Attachment on a Test Case Execution by its attachment id. Returns the download URL (use the HTTP client of your MCP host to fetch the bytes).',
    GetTceAttachmentSchema.shape,
    async (args) => {
      try {
        return textResult(
          await resource.getAttachment(args.testCaseExecutionKey, args.attachmentId),
        );
      } catch (err) {
        return toErrorResult(err, 'rtm_get_test_case_execution_attachment');
      }
    },
  );

  server.tool(
    'rtm_list_test_case_execution_step_attachments',
    'List Attachments attached to a specific step inside a Test Case Execution.',
    ListStepAttachmentsSchema.shape,
    async (args) => {
      try {
        return textResult(
          await resource.listStepAttachments(args.testCaseExecutionKey, args.stepId),
        );
      } catch (err) {
        return toErrorResult(err, 'rtm_list_test_case_execution_step_attachments');
      }
    },
  );

  server.tool(
    'rtm_upload_test_case_execution_step_attachment',
    'Upload an Attachment to a specific step inside a Test Case Execution. Provide file contents as base64.',
    UploadStepAttachmentSchema.shape,
    async (args) => {
      try {
        const data = Buffer.from(args.contentBase64, 'base64');
        const attachment = await resource.uploadStepAttachment(
          args.testCaseExecutionKey,
          args.stepId,
          { filename: args.filename, data, mimeType: args.mimeType },
        );
        return textResult(attachment);
      } catch (err) {
        return toErrorResult(err, 'rtm_upload_test_case_execution_step_attachment');
      }
    },
  );
}
