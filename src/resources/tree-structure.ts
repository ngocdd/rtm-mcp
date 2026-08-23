/**
 * Resource methods for Tree Structure.
 *
 * Endpoint pattern (V2): GET /api/v2/tree/{projectId}/{treeType}
 *
 * NOTE: path requires numeric `projectId` (Jira internal project ID), NOT the
 * `projectKey` slug (e.g. "ACME"). Callers must resolve projectKey → projectId
 * via the Jira REST API before calling this resource.
 */
import { HttpClient } from '../client/http.js';
import type { ResourceType, TreeNode } from './types.js';

export interface GetTreeParams {
  projectId: number;
  treeType: ResourceType;
}

export class TreeStructureResource {
  constructor(private readonly http: HttpClient) {}

  get(params: GetTreeParams): Promise<TreeNode[]> {
    return this.http.get<TreeNode[]>(
      `/v2/tree/${encodeURIComponent(String(params.projectId))}/${encodeURIComponent(params.treeType)}`,
    );
  }
}
