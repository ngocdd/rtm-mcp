/**
 * Zod input schemas for Requirement MCP tools.
 *
 * NOTE: the RTM API exposes no list endpoint for requirements; the per-project
 * tree must be fetched via the tree-structure tool.
 */
import { z } from 'zod';

const projectKey = z.string().min(1).describe('Jira project key (e.g. "ACME").');
const requirementKey = z
  .string()
  .min(1)
  .describe('Requirement test key (e.g. "ACME-123").');
const testCaseKeyList = z
  .array(z.string().min(1))
  .min(1)
  .describe('List of test case keys to link.');

export const GetRequirementSchema = z.object({
  requirementKey,
});

export const CreateRequirementSchema = z.object({
  projectKey,
  summary: z.string().min(1).describe('Requirement summary (the "name" field).'),
  issueTypeId: z
    .number()
    .int()
    .positive()
    .describe(
      'Numeric Jira issue type ID for Requirement (project-specific; e.g. 10015 in KAN).',
    ),
  description: z.string().optional(),
  folder: z.string().optional().describe('Folder path inside the project.'),
  folderPath: z.string().optional(),
  priority: z.string().optional(),
  owner: z.string().optional(),
  status: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateRequirementSchema = z.object({
  requirementKey,
  summary: z.string().min(1).optional(),
  description: z.string().optional(),
  folder: z.string().optional(),
  folderPath: z.string().optional(),
  priority: z.string().optional(),
  owner: z.string().optional(),
  status: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const DeleteRequirementSchema = z.object({
  requirementKey,
});

// NOTE: covered-test-cases linking is NOT supported by the live RTM REST API
// (returns 404 on every PUT). The schemas below are retained so callers fail
// fast with a validation error instead of hitting the API blindly; the tools
// that exposed them have been removed.
const CoveredTestCasesSchema = z.object({
  requirementKey,
  testCaseKeys: testCaseKeyList,
});
export const SetCoveredTestCasesSchema = CoveredTestCasesSchema;
export const AddCoveredTestCasesSchema = CoveredTestCasesSchema;
export const RemoveCoveredTestCasesSchema = CoveredTestCasesSchema;
