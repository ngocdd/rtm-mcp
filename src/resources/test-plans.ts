/**
 * Resource methods for Test Plans.
 *
 * Endpoint pattern: /api/test-plan (no version segment)
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateTestPlanInput,
  TestPlan,
  UpdateTestPlanInput,
} from './types.js';

const BASE = '/test-plan';

export class TestPlansResource {
  constructor(private readonly http: HttpClient) {}

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

  // NOTE: included-test-cases link management endpoints are NOT supported by
  // the live RTM REST API (PUT .../included-test-cases → 404). The corresponding
  // tools have been removed; if you re-introduce them, point at the correct
  // path discovered from a fresh API doc.
}
