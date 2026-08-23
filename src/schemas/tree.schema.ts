/**
 * Zod input schema for Tree Structure tool.
 *
 * NOTE: the RTM API takes a numeric `projectId` (Jira internal ID) and a
 * `treeType` enum — not the projectKey slug. This is a breaking change from
 * the previous schema, which took `projectKey` and `resourceType` query params.
 */
import { z } from 'zod';

export const GetTreeStructureSchema = z.object({
  projectId: z
    .number()
    .int()
    .positive()
    .describe(
      'Numeric Jira project ID (resolve from projectKey via Jira REST API before calling).',
    ),
  treeType: z
    .enum(['REQUIREMENTS', 'TEST_CASES', 'TEST_PLANS', 'TEST_EXECUTIONS'])
    .describe('Tree structure resource type to fetch.'),
});
