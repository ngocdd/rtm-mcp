/**
 * Zod input schemas for Test Execution MCP tools.
 */
import { z } from 'zod';
import { folderPath, pagination, projectKey } from './common.js';

export const ListTestExecutionsSchema = z.object({
  projectKey,
  folder: folderPath,
  ...pagination,
});

export const GetTestExecutionSchema = z.object({
  testExecutionKey: z.string().min(1),
});

export const CreateTestExecutionSchema = z.object({
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

export const UpdateTestExecutionSchema = z.object({
  testExecutionKey: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  folder: z.string().optional(),
  folderPath: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const DeleteTestExecutionSchema = z.object({
  testExecutionKey: z.string().min(1),
});
