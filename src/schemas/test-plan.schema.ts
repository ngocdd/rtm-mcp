/**
 * Zod input schemas for Test Plan MCP tools.
 */
import { z } from 'zod';
import { folderPath, pagination, projectKey } from './common.js';

export const ListTestPlansSchema = z.object({
  projectKey,
  folder: folderPath,
  ...pagination,
});

export const GetTestPlanSchema = z.object({
  testPlanKey: z.string().min(1),
});

export const CreateTestPlanSchema = z.object({
  projectKey,
  name: z.string().min(1),
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
  name: z.string().optional(),
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

const IncludedTestCasesSchema = z.object({
  testPlanKey: z.string().min(1),
  testCaseKeys: z.array(z.string().min(1)).min(1),
});

export const SetIncludedTestCasesSchema = IncludedTestCasesSchema;
export const AddIncludedTestCasesSchema = IncludedTestCasesSchema;
export const RemoveIncludedTestCasesSchema = IncludedTestCasesSchema;
