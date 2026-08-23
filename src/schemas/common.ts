/**
 * Shared zod fragments for tool input schemas.
 */
import { z } from 'zod';

export const projectKey = z.string().min(1).describe('Jira project key (e.g. "ACME").');

export const pagination = {
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(200).optional(),
};

export const folderPath = z
  .string()
  .optional()
  .describe('Folder path inside the project (e.g. "/Smoke tests").');

export const testKey = (label = 'Test key') =>
  z.string().min(1).describe(`${label} (e.g. "ACME-123").`);
