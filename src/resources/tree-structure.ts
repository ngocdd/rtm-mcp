/**
 * Resource methods for Tree Structure.
 *
 * Endpoint: GET /api/tree-structure
 */
import { HttpClient } from '../client/http.js';
import type { TreeNode } from './types.js';

const ENDPOINT = '/tree-structure';

export interface GetTreeParams {
  projectKey?: string;
  resourceType?: string;
}

export class TreeStructureResource {
  constructor(private readonly http: HttpClient) {}

  get(params: GetTreeParams = {}): Promise<TreeNode[]> {
    return this.http.get<TreeNode[]>(ENDPOINT, {
      query: {
        projectKey: params.projectKey,
        resourceType: params.resourceType,
      },
    });
  }
}
