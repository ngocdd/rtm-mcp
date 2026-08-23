/**
 * Resource methods for Test Executions.
 *
 * Endpoint pattern: /api/v2/test-execution
 *
 * Create flow uses `POST /api/v2/test-execution/execute/{testPlanTestKey}`,
 * where the plan key is a path param, not part of the body.
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateTestExecutionInput,
  TestExecution,
  UpdateTestExecutionInput,
} from './types.js';

const BASE = '/v2/test-execution';

export class TestExecutionsResource {
  constructor(private readonly http: HttpClient) {}

  get(testExecutionKey: string): Promise<TestExecution> {
    return this.http.get<TestExecution>(
      `${BASE}/${encodeURIComponent(testExecutionKey)}`,
    );
  }

  create(
    testPlanTestKey: string,
    input: Omit<CreateTestExecutionInput, 'projectKey' | 'testPlanTestKey'>,
  ): Promise<TestExecution> {
    return this.http.post<TestExecution>(
      `${BASE}/execute/${encodeURIComponent(testPlanTestKey)}`,
      { body: input },
    );
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
