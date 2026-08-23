/**
 * Zod input schemas for Test Execution MCP tools.
 *
 * NOTE: the RTM API exposes no list endpoint for test executions.
 *
 * `create` here is a convenience wrapper around
 * `POST /api/v2/test-execution/execute/{testPlanTestKey}` — the server creates
 * the execution, the body supplies optional metadata. Pass `testPlanTestKey`
 * separately so we know which plan to execute.
 */
import { z } from 'zod';
import { folderPath, projectKey } from './common.js';

const testPlanTestKey = z
  .string()
  .min(1)
  .describe('Test Plan test key whose included cases will be executed.');

export const GetTestExecutionSchema = z.object({
  testExecutionKey: z.string().min(1),
});

export const CreateTestExecutionSchema = z.object({
  projectKey,
  testPlanTestKey,
  summary: z.string().min(1).optional().describe('Optional execution summary.'),
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
  summary: z.string().min(1).optional(),
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
