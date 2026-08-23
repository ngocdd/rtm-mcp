/**
 * Zod input schemas for Test Case Execution MCP tools.
 */
import { z } from 'zod';

const tceKey = z.string().min(1).describe('Test Case Execution test key.');
const defectKey = z.string().min(1).describe('Defect test key.');
const stepId = z.string().min(1).describe('Test step identifier.');

export const GetTestCaseExecutionSchema = z.object({
  testCaseExecutionKey: tceKey,
});

/**
 * Pass either a plain status name (`"Fail"`) or a `{ name }` / `{ id }`
 * object. Common RTM status names: `"Pass"`, `"Fail"`, `"Blocked"`,
 * `"In progress"`, `"Skipped"`, `"To do"`.
 */
const resultRef = z
  .union([
    z.string().min(1).describe('Status name (e.g. "Fail", "Pass").'),
    z
      .object({
        id: z.number().int().optional(),
        name: z.string().min(1).optional(),
      })
      .refine((v) => v.id !== undefined || v.name !== undefined, {
        message: 'Provide at least `id` or `name`.',
      }),
  ])
  .optional();

export const UpdateTestCaseExecutionSchema = z.object({
  testCaseExecutionKey: tceKey,
  summary: z.string().min(1).optional(),
  /** TCE result/status. Use `"Fail"` / `"Pass"` / `"Blocked"` / etc. */
  result: resultRef,
  /** Optional fallback for installations that accept `status` instead of `result`. */
  status: z.string().min(1).optional(),
  comment: z.string().optional(),
  executedBy: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const LinkDefectToTceSchema = z.object({
  testCaseExecutionKey: tceKey,
  defectTestKey: defectKey,
});

export const LinkDefectToStepSchema = z.object({
  testCaseExecutionKey: tceKey,
  stepId,
  defectTestKey: defectKey,
});

export const ListTceAttachmentsSchema = z.object({
  testCaseExecutionKey: tceKey,
});

export const UploadTceAttachmentSchema = z.object({
  testCaseExecutionKey: tceKey,
  filename: z.string().min(1).describe('Filename including extension.'),
  // Accept base64 to avoid reading file paths from MCP clients.
  contentBase64: z
    .string()
    .min(1)
    .describe('File contents encoded as base64.'),
  mimeType: z.string().optional(),
});

export const GetTceAttachmentSchema = z.object({
  testCaseExecutionKey: tceKey,
  attachmentId: z
    .string()
    .min(1)
    .describe('Attachment identifier (from `rtm_list_test_case_execution_attachments`).'),
});

export const ListStepAttachmentsSchema = z.object({
  testCaseExecutionKey: tceKey,
  stepId,
});

export const UploadStepAttachmentSchema = z.object({
  testCaseExecutionKey: tceKey,
  stepId,
  filename: z.string().min(1).describe('Filename including extension.'),
  contentBase64: z
    .string()
    .min(1)
    .describe('File contents encoded as base64.'),
  mimeType: z.string().optional(),
});
