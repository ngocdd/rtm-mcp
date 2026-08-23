/**
 * Resource methods for Requirements.
 *
 * Endpoint pattern (V2): /api/v2/requirement
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateRequirementInput,
  PaginatedResponse,
  Requirement,
  UpdateRequirementInput,
} from './types.js';

export interface ListRequirementsParams {
  projectKey: string;
  folder?: string;
  page?: number;
  pageSize?: number;
}

const BASE = '/v2/requirement';

export class RequirementsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListRequirementsParams): Promise<PaginatedResponse<Requirement>> {
    return this.http.get<PaginatedResponse<Requirement>>(BASE, {
      query: {
        projectKey: params.projectKey,
        folder: params.folder,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
  }

  get(requirementKey: string): Promise<Requirement> {
    return this.http.get<Requirement>(`${BASE}/${encodeURIComponent(requirementKey)}`);
  }

  create(input: CreateRequirementInput): Promise<Requirement> {
    return this.http.post<Requirement>(BASE, { body: input });
  }

  update(
    requirementKey: string,
    input: UpdateRequirementInput,
  ): Promise<Requirement> {
    return this.http.put<Requirement>(
      `${BASE}/${encodeURIComponent(requirementKey)}`,
      { body: input },
    );
  }

  delete(requirementKey: string): Promise<void> {
    return this.http.delete<void>(
      `${BASE}/${encodeURIComponent(requirementKey)}`,
    );
  }

  // ---------- Link management: coveredTestCases ----------

  setCoveredTestCases(
    requirementKey: string,
    testCaseKeys: string[],
  ): Promise<void> {
    return this.putLink(requirementKey, 'set', testCaseKeys);
  }

  addCoveredTestCases(
    requirementKey: string,
    testCaseKeys: string[],
  ): Promise<void> {
    return this.putLink(requirementKey, 'add', testCaseKeys);
  }

  removeCoveredTestCases(
    requirementKey: string,
    testCaseKeys: string[],
  ): Promise<void> {
    return this.putLink(requirementKey, 'remove', testCaseKeys);
  }

  private putLink(
    requirementKey: string,
    action: 'set' | 'add' | 'remove',
    testCaseKeys: string[],
  ): Promise<void> {
    return this.http.put<void>(
      `${BASE}/${encodeURIComponent(requirementKey)}/covered-test-cases`,
      {
        body: {
          coveredTestCases: {
            [action]: testCaseKeys.map((testKey) => ({ testKey })),
          },
        },
      },
    );
  }
}
