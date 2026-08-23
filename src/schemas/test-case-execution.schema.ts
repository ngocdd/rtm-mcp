/**
 * Zod input schemas for Test Case Execution MCP tools.
 */
import { z } from 'zod';

const tceKey = z.string().min(1).describe('Test Case Execution test key.');
const defectKey = z.string().min(1).describe('Defect test key.');
const stepId = z.string().min(1).describe('Test step identifier.');

export const LinkDefectToTceSchema = z.object({
  testCaseExecutionKey: tceKey,
  defectTestKey: defectKey,
});

export const UnlinkDefectFromTceSchema = LinkDefectToTceSchema;

export const LinkDefectToStepSchema = z.object({
  testCaseExecutionKey: tceKey,
  stepId,
  defectTestKey: defectKey,
});

export const UnlinkDefectFromStepSchema = LinkDefectToStepSchema;

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
