/**
 * Resource methods for Test Executions.
 *
 * Endpoint pattern (V2): /api/v2/test-execution
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateTestExecutionInput,
  PaginatedResponse,
  TestExecution,
  UpdateTestExecutionInput,
} from './types.js';

export interface ListTestExecutionsParams {
  projectKey: string;
  folder?: string;
  page?: number;
  pageSize?: number;
}

const BASE = '/v2/test-execution';

export class TestExecutionsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListTestExecutionsParams): Promise<PaginatedResponse<TestExecution>> {
    return this.http.get<PaginatedResponse<TestExecution>>(BASE, {
      query: {
        projectKey: params.projectKey,
        folder: params.folder,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
  }

  get(testExecutionKey: string): Promise<TestExecution> {
    return this.http.get<TestExecution>(
      `${BASE}/${encodeURIComponent(testExecutionKey)}`,
    );
  }

  create(input: CreateTestExecutionInput): Promise<TestExecution> {
    return this.http.post<TestExecution>(BASE, { body: input });
  }

  update(
    testExecutionKey: string,
    input: UpdateTestExecutionInput,
  ): Promise<TestExecution> {
    return this.http.put<TestExecution>(
      `${BASE}/${encodeURIComponent(testExecutionKey)}`,
      { body: input },
    );
  }

  delete(testExecutionKey: string): Promise<void> {
    return this.http.delete<void>(
      `${BASE}/${encodeURIComponent(testExecutionKey)}`,
    );
  }
}
