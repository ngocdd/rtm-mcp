/**
 * Zod input schemas for Defect MCP tools.
 */
import { z } from 'zod';
import { pagination, projectKey } from './common.js';

export const ListDefectsSchema = z.object({
  projectKey,
  ...pagination,
});

export const GetDefectSchema = z.object({
  defectKey: z.string().min(1),
});

export const CreateDefectSchema = z.object({
  projectKey,
  name: z.string().min(1).describe('Defect summary.'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  identifyingTestCases: z.array(z.object({ testKey: z.string() })).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateDefectSchema = z.object({
  defectKey: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const DeleteDefectSchema = z.object({
  defectKey: z.string().min(1),
});

export const SetIdentifyingTestCasesSchema = z.object({
  defectKey: z.string().min(1),
  testCaseKeys: z.array(z.string().min(1)).min(1),
});
