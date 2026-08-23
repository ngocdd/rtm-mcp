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

/**
 * Body for the single `PUT /api/v2/test-plan/{key}/included-test-cases`
 * endpoint. Exactly one of `set`, `add`, or `remove` must be provided —
 * the wire payload becomes `{ includedTestCases: { <op>: [...] } }`.
 *
 * Mutual exclusion is enforced in the tool handler (see
 * `registerTestPlanTools`) so the schema keeps its `.shape` accessible
 * to the MCP SDK.
 */
const tcRef = z
  .union([z.string().min(1), z.object({ testKey: z.string().min(1) })])
  .describe('Test Case reference — pass a test key or `{ testKey }` object.');

export const UpdateIncludedTestCasesSchema = z.object({
  testPlanKey: z.string().min(1).describe('Test Plan test key.'),
  set: z.array(tcRef).min(1).optional().describe('Replace the included set with these test cases.'),
  add: z.array(tcRef).min(1).optional().describe('Append these test cases to the included set.'),
  remove: z.array(tcRef).min(1).optional().describe('Remove these test cases from the included set.'),
});
