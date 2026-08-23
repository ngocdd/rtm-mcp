/**
 * Zod input schemas for Automation tools.
 */
import { z } from 'zod';

export const ImportTestResultsSchema = z.object({
  projectKey: z.string().min(1).describe('RTM-enabled Jira project key.'),
  name: z.string().optional().describe('Name for the created Test Execution.'),
  filename: z.string().min(1).describe('Filename of the archive (e.g. "junit.zip").'),
  contentBase64: z
    .string()
    .min(1)
    .describe('Archive contents (zip or tar.gz) encoded as base64.'),
  reportType: z
    .enum(['JUNIT', 'NUNIT', 'CUCUMBER_JSON'])
    .describe('Format of test results inside the archive.'),
  jobUrl: z
    .string()
    .url()
    .optional()
    .describe('HTTP(S) URL of the CI job that produced the results.'),
  treePath: z
    .string()
    .optional()
    .describe('Destination folder path (created if missing).'),
  testExecutionFields: z
    .string()
    .optional()
    .describe('JSON string of fields to set on the created Test Execution.'),
  testCaseFields: z
    .string()
    .optional()
    .describe('JSON string of fields to set on created Test Cases.'),
});

export const GetImportStatusSchema = z.object({
  taskId: z.string().min(1).describe('Task ID returned by rtm_import_test_results.'),
});
