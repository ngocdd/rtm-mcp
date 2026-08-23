/**
 * Zod input schemas for Defect MCP tools.
 *
 * NOTE: the RTM API exposes no list endpoint for defects.
 */
import { z } from 'zod';
import { projectKey } from './common.js';

export const GetDefectSchema = z.object({
  defectKey: z.string().min(1),
});

export const CreateDefectSchema = z.object({
  projectKey,
  summary: z.string().min(1).describe('Defect summary.'),
  issueTypeId: z
    .number()
    .int()
    .positive()
    .describe('Numeric Jira issue type ID for Defect (project-specific).'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  identifyingTestCases: z.array(z.object({ testKey: z.string() })).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateDefectSchema = z.object({
  defectKey: z.string().min(1),
  summary: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const DeleteDefectSchema = z.object({
  defectKey: z.string().min(1),
});

// NOTE: identifying-test-cases linking is NOT supported by the live RTM REST
// API (returns 404 on every PUT). Schema retained so callers fail fast; the
// tool that exposed it has been removed.
export const SetIdentifyingTestCasesSchema = z.object({
  defectKey: z.string().min(1),
  testCaseKeys: z.array(z.string().min(1)).min(1),
});
