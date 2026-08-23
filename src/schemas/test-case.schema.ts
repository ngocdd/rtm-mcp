/**
 * Zod input schemas for Test Case MCP tools.
 *
 * NOTE: the RTM API exposes no list endpoint for test cases; the per-project
 * tree must be fetched via the tree-structure tool.
 */
import { z } from 'zod';
import { folderPath, projectKey } from './common.js';

const stepColumnSchema = z.object({
  ordinal: z.number().int().nonnegative(),
  value: z.string(),
});

const stepSchema = z.object({
  ordinal: z.number().int().nonnegative().optional(),
  description: z.string().optional(),
  expectedResult: z.string().optional(),
  testData: z.string().optional(),
  stepColumns: z.array(stepColumnSchema).min(1),
  stepAttachments: z.array(z.object({ attachmentId: z.string() })).optional(),
});

const stepGroupSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  steps: z.array(stepSchema).min(1),
});

const reqRef = z
  .union([z.string().min(1), z.object({ testKey: z.string().min(1) })])
  .describe('Requirement reference — pass a test key or `{ testKey }` object.');

export const GetTestCaseSchema = z.object({
  testCaseKey: z.string().min(1).describe('Test Case test key.'),
});

export const CreateTestCaseSchema = z.object({
  projectKey,
  summary: z.string().min(1).describe('Test Case summary.'),
  issueTypeId: z
    .number()
    .int()
    .positive()
    .describe('Numeric Jira issue type ID for Test Case (project-specific).'),
  testKey: z.string().optional().describe('Optional explicit test key.'),
  description: z.string().optional(),
  objective: z.string().optional(),
  precondition: z.string().optional(),
  preconditions: z.string().optional(),
  folder: folderPath,
  folderPath: z.string().optional(),
  parentTestKey: z.string().optional().describe('Folder/parent test key.'),
  priority: z
    .union([z.string(), z.object({ id: z.number().int(), name: z.string().optional() })])
    .optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  estimatedTime: z.number().optional(),
  timeEstimate: z.number().optional(),
  environment: z.string().optional(),
  labels: z.array(z.string()).optional(),
  components: z.array(z.object({ id: z.string().optional(), name: z.string().optional() })).optional(),
  versions: z.array(z.object({ id: z.string().optional(), name: z.string().optional() })).optional(),
  stepGroups: z.array(stepGroupSchema).optional(),
  coveredRequirements: z.array(reqRef).optional(),
  links: z.array(z.object({ testKey: z.string() })).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateTestCaseSchema = z.object({
  testCaseKey: z.string().min(1),
  summary: z.string().min(1).optional(),
  description: z.string().optional(),
  objective: z.string().optional(),
  precondition: z.string().optional(),
  preconditions: z.string().optional(),
  folder: z.string().optional(),
  folderPath: z.string().optional(),
  priority: z
    .union([z.string(), z.object({ id: z.number().int(), name: z.string().optional() })])
    .optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  estimatedTime: z.number().optional(),
  environment: z.string().optional(),
  labels: z.array(z.string()).optional(),
  stepGroups: z.array(stepGroupSchema).optional(),
  customFields: z.record(z.unknown()).optional(),
});

/**
 * Body for the single `PUT /api/v2/test-case/{key}/covered-requirements`
 * endpoint. Exactly one of `set`, `add`, or `remove` must be provided —
 * the wire payload becomes `{ coveredRequirements: { <op>: [...] } }`.
 *
 * The mutual-exclusion check is enforced in the tool handler (see
 * `registerTestCaseTools`) so the schema keeps its `.shape` accessible to
 * the MCP SDK.
 */
export const UpdateCoveredRequirementsSchema = z.object({
  testCaseKey: z.string().min(1).describe('Test Case test key.'),
  set: z.array(reqRef).min(1).optional().describe('Replace the link set with these requirements.'),
  add: z.array(reqRef).min(1).optional().describe('Append these requirements to the link set.'),
  remove: z.array(reqRef).min(1).optional().describe('Remove these requirements from the link set.'),
});
