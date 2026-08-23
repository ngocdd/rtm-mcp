/**
 * Resource methods for Test Plans.
 *
 * Endpoint pattern (V2): /api/v2/test-plan
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateTestPlanInput,
  PaginatedResponse,
  TestPlan,
  UpdateTestPlanInput,
} from './types.js';

export interface ListTestPlansParams {
  projectKey: string;
  folder?: string;
  page?: number;
  pageSize?: number;
}

const BASE = '/v2/test-plan';

export class TestPlansResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListTestPlansParams): Promise<PaginatedResponse<TestPlan>> {
    return this.http.get<PaginatedResponse<TestPlan>>(BASE, {
      query: {
        projectKey: params.projectKey,
        folder: params.folder,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
  }

  get(testPlanKey: string): Promise<TestPlan> {
    return this.http.get<TestPlan>(`${BASE}/${encodeURIComponent(testPlanKey)}`);
  }

  create(input: CreateTestPlanInput): Promise<TestPlan> {
    return this.http.post<TestPlan>(BASE, { body: input });
  }

  update(testPlanKey: string, input: UpdateTestPlanInput): Promise<TestPlan> {
    return this.http.put<TestPlan>(
      `${BASE}/${encodeURIComponent(testPlanKey)}`,
      { body: input },
    );
  }

  delete(testPlanKey: string): Promise<void> {
    return this.http.delete<void>(`${BASE}/${encodeURIComponent(testPlanKey)}`);
  }

  // ---------- Link management: includedTestCases ----------

  setIncludedTestCases(testPlanKey: string, testCaseKeys: string[]): Promise<void> {
    return this.putLink(testPlanKey, 'set', testCaseKeys);
  }
  addIncludedTestCases(testPlanKey: string, testCaseKeys: string[]): Promise<void> {
    return this.putLink(testPlanKey, 'add', testCaseKeys);
  }
  removeIncludedTestCases(testPlanKey: string, testCaseKeys: string[]): Promise<void> {
    return this.putLink(testPlanKey, 'remove', testCaseKeys);
  }

  private putLink(
    testPlanKey: string,
    action: 'set' | 'add' | 'remove',
    testCaseKeys: string[],
  ): Promise<void> {
    return this.http.put<void>(
      `${BASE}/${encodeURIComponent(testPlanKey)}/included-test-cases`,
      {
        body: {
          includedTestCases: {
            [action]: testCaseKeys.map((testKey) => ({ testKey })),
          },
        },
      },
    );
  }
}
