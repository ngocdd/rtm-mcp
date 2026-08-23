/**
 * Zod input schemas for Requirement MCP tools.
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

export const ListRequirementsSchema = z.object({
  projectKey,
  folder: z.string().optional().describe('Restrict to a folder path.'),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(200).optional(),
});

export const GetRequirementSchema = z.object({
  requirementKey,
});

export const CreateRequirementSchema = z.object({
  projectKey,
  name: z.string().min(1).describe('Requirement name (summary).'),
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
  name: z.string().min(1).optional(),
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

const CoveredTestCasesSchema = z.object({
  requirementKey,
  testCaseKeys: testCaseKeyList,
});
export const SetCoveredTestCasesSchema = CoveredTestCasesSchema;
export const AddCoveredTestCasesSchema = CoveredTestCasesSchema;
export const RemoveCoveredTestCasesSchema = CoveredTestCasesSchema;
