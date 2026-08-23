/**
 * Zod input schemas for Test Plan MCP tools.
 *
 * NOTE: the RTM API exposes no list endpoint for test plans; the per-project
 * tree must be fetched via the tree-structure tool.
 */
import { z } from 'zod';
import { folderPath, projectKey } from './common.js';

export const GetTestPlanSchema = z.object({
  testPlanKey: z.string().min(1),
});

export const CreateTestPlanSchema = z.object({
  projectKey,
  summary: z.string().min(1).describe('Test Plan summary.'),
  issueTypeId: z
    .number()
    .int()
    .positive()
    .describe('Numeric Jira issue type ID for Test Plan (project-specific).'),
  description: z.string().optional(),
  folder: folderPath,
  folderPath: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  includedTestCases: z.array(z.object({ testKey: z.string() })).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateTestPlanSchema = z.object({
  testPlanKey: z.string().min(1),
  summary: z.string().min(1).optional(),
  description: z.string().optional(),
  folder: z.string().optional(),
  folderPath: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const DeleteTestPlanSchema = z.object({
  testPlanKey: z.string().min(1),
});

export const UpdateTestCaseOrderSchema = z.object({
  testPlanKey: z.string().min(1).describe('Test Plan test key.'),
  order: z
    .array(z.string().min(1))
    .min(1)
    .describe('Test case keys in the desired order. Wire call: PUT /api/test-plan/{key}/tc-order.'),
});

export const CreateTestPlanFolderSchema = z.object({
  testPlanKey: z.string().min(1).describe('Test Plan test key.'),
  name: z.string().min(1).describe('Folder name.'),
  parentFolderPath: z
    .string()
    .optional()
    .describe('Parent folder path; omit to create at the tree root.'),
});

export const AddTestCaseToTestPlanSchema = z.object({
  testPlanKey: z.string().min(1).describe('Test Plan test key.'),
  testCaseKey: z.string().min(1).describe('Test Case key to include.'),
});

export const RemoveTestCaseFromTestPlanSchema = z.object({
  testPlanKey: z.string().min(1).describe('Test Plan test key.'),
  testCaseKey: z.string().min(1).describe('Test Case key to remove.'),
});
