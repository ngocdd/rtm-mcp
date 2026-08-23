/**
 * Zod input schemas for Test Case MCP tools.
 */
import { z } from 'zod';
import { folderPath, pagination, projectKey } from './common.js';

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

const testKeyList = z
  .array(z.string().min(1))
  .min(1)
  .describe('List of test keys.');

export const ListTestCasesSchema = z.object({
  projectKey,
  folder: folderPath,
  ...pagination,
});

export const GetTestCaseSchema = z.object({
  testCaseKey: z.string().min(1).describe('Test Case test key.'),
});

export const CreateTestCaseSchema = z.object({
  projectKey,
  name: z.string().min(1).describe('Test Case name (summary).'),
  testKey: z.string().optional().describe('Optional explicit test key.'),
  description: z.string().optional(),
  objective: z.string().optional(),
  precondition: z.string().optional(),
  preconditions: z.string().optional(),
  folder: folderPath,
  folderPath: z.string().optional(),
  parentTestKey: z.string().optional().describe('Folder/parent test key.'),
  priority: z.union([z.string(), z.object({ id: z.number().int(), name: z.string().optional() })]).optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  estimatedTime: z.number().optional(),
  timeEstimate: z.number().optional(),
  environment: z.string().optional(),
  labels: z.array(z.string()).optional(),
  components: z.array(z.object({ id: z.string().optional(), name: z.string().optional() })).optional(),
  versions: z.array(z.object({ id: z.string().optional(), name: z.string().optional() })).optional(),
  stepGroups: z.array(stepGroupSchema).optional(),
  coveredRequirements: z.array(z.union([z.string(), z.object({ testKey: z.string() })])).optional(),
  links: z.array(z.object({ testKey: z.string() })).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateTestCaseSchema = z.object({
  testCaseKey: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  objective: z.string().optional(),
  precondition: z.string().optional(),
  preconditions: z.string().optional(),
  folder: z.string().optional(),
  folderPath: z.string().optional(),
  priority: z.union([z.string(), z.object({ id: z.number().int(), name: z.string().optional() })]).optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  estimatedTime: z.number().optional(),
  environment: z.string().optional(),
  labels: z.array(z.string()).optional(),
  stepGroups: z.array(stepGroupSchema).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const DeleteTestCaseSchema = z.object({
  testCaseKey: z.string().min(1),
});

const CoveredRequirementsSchema = z.object({
  testCaseKey: z.string().min(1),
  requirementKeys: testKeyList.describe('Requirement test keys to link.'),
});

export const SetCoveredRequirementsSchema = CoveredRequirementsSchema;
export const AddCoveredRequirementsSchema = CoveredRequirementsSchema;
export const RemoveCoveredRequirementsSchema = CoveredRequirementsSchema;
