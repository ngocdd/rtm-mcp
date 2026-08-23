/**
 * Resource methods for Test Cases.
 *
 * Endpoint pattern (V2): /api/v2/test-case
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateTestCaseInput,
  PaginatedResponse,
  TestCase,
  UpdateTestCaseInput,
} from './types.js';

export interface ListTestCasesParams {
  projectKey: string;
  folder?: string;
  page?: number;
  pageSize?: number;
}

const BASE = '/v2/test-case';

export class TestCasesResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListTestCasesParams): Promise<PaginatedResponse<TestCase>> {
    return this.http.get<PaginatedResponse<TestCase>>(BASE, {
      query: {
        projectKey: params.projectKey,
        folder: params.folder,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
  }

  get(testCaseKey: string): Promise<TestCase> {
    return this.http.get<TestCase>(`${BASE}/${encodeURIComponent(testCaseKey)}`);
  }

  create(input: CreateTestCaseInput): Promise<TestCase> {
    return this.http.post<TestCase>(BASE, { body: input });
  }

  update(testCaseKey: string, input: UpdateTestCaseInput): Promise<TestCase> {
    return this.http.put<TestCase>(
      `${BASE}/${encodeURIComponent(testCaseKey)}`,
      { body: input },
    );
  }

  delete(testCaseKey: string): Promise<void> {
    return this.http.delete<void>(`${BASE}/${encodeURIComponent(testCaseKey)}`);
  }

  // ---------- Link management: coveredRequirements ----------

  setCoveredRequirements(
    testCaseKey: string,
    requirementKeys: string[],
  ): Promise<void> {
    return this.putLink(testCaseKey, 'set', requirementKeys);
  }

  addCoveredRequirements(
    testCaseKey: string,
    requirementKeys: string[],
  ): Promise<void> {
    return this.putLink(testCaseKey, 'add', requirementKeys);
  }

  removeCoveredRequirements(
    testCaseKey: string,
    requirementKeys: string[],
  ): Promise<void> {
    return this.putLink(testCaseKey, 'remove', requirementKeys);
  }

  private putLink(
    testCaseKey: string,
    action: 'set' | 'add' | 'remove',
    requirementKeys: string[],
  ): Promise<void> {
    return this.http.put<void>(
      `${BASE}/${encodeURIComponent(testCaseKey)}/covered-requirements`,
      {
        body: {
          coveredRequirements: {
            [action]: requirementKeys.map((testKey) => ({ testKey })),
          },
        },
      },
    );
  }
}
