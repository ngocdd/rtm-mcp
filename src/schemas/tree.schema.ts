/**
 * Zod input schema for Tree Structure tool.
 */
import { z } from 'zod';
import { projectKey } from './common.js';

export const GetTreeStructureSchema = z.object({
  projectKey: projectKey
    .optional()
    .describe('Restrict the tree to a single Jira project.'),
  resourceType: z
    .enum(['REQUIREMENTS', 'TEST_CASES', 'TEST_PLANS', 'TEST_EXECUTIONS'])
    .optional()
    .describe('Optional resource type to scope the tree to.'),
});
