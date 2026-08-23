/**
 * Resource methods for Test Plans.
 *
 * V1 endpoints (per deviniti REST API docs):
 *   GET    /api/test-plan/{testKey}
 *   PUT    /api/test-plan/{testKey}
 *   DELETE /api/test-plan/{testKey}
 *   PUT    /api/test-plan/{testKey}/tc-order
 *   POST   /api/test-plan
 *   POST   /api/test-plan/{testKey}/tree/folders
 *   POST   /api/test-plan/{testKey}/testcases
 *   DELETE /api/test-plan/{testKey}/testcases/{tcKey}
 *
 * Test Case inclusion is two separate endpoints:
 *   - POST   .../testcases          — add one test case
 *   - DELETE .../testcases/{tcKey}  — remove one test case
 * Re-ordering included cases uses PUT .../tc-order with the new ordering.
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateTestPlanInput,
  TestPlan,
  UpdateTestPlanInput,
} from './types.js';

const BASE = '/test-plan';

export interface CreateTestPlanFolderInput {
  name: string;
  parentFolderPath?: string;
}

export interface UpdateTestCaseOrderInput {
  /** Test case keys in the desired order. */
  order: string[];
}

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
    return this.http.delete<void>(
      `${BASE}/${encodeURIComponent(testPlanKey)}`,
    );
  }

  /**
   * Persist a new ordering for the test cases already included in a Test Plan.
   * Wire call: `PUT /api/test-plan/{key}/tc-order` with body
   * `{ order: ["TC-1", "TC-3", "TC-2"] }`.
   */
  updateTestCaseOrder(
    testPlanKey: string,
    input: UpdateTestCaseOrderInput,
  ): Promise<TestPlan> {
    return this.http.put<TestPlan>(
      `${BASE}/${encodeURIComponent(testPlanKey)}/tc-order`,
      { body: input },
    );
  }

  /**
   * Create a folder inside a Test Plan's tree.
   * Wire call: `POST /api/test-plan/{key}/tree/folders`.
   */
  createFolder(
    testPlanKey: string,
    input: CreateTestPlanFolderInput,
  ): Promise<TestPlan> {
    return this.http.post<TestPlan>(
      `${BASE}/${encodeURIComponent(testPlanKey)}/tree/folders`,
      { body: input },
    );
  }

  /**
   * Add a Test Case to a Test Plan.
   * Wire call: `POST /api/test-plan/{key}/testcases`.
   */
  addTestCase(testPlanKey: string, testCaseKey: string): Promise<TestPlan> {
    return this.http.post<TestPlan>(
      `${BASE}/${encodeURIComponent(testPlanKey)}/testcases`,
      { body: { testKey: testCaseKey } },
    );
  }

  /**
   * Remove a Test Case from a Test Plan.
   * Wire call: `DELETE /api/test-plan/{key}/testcases/{tcKey}`.
   */
  removeTestCase(testPlanKey: string, testCaseKey: string): Promise<void> {
    return this.http.delete<void>(
      `${BASE}/${encodeURIComponent(testPlanKey)}/testcases/${encodeURIComponent(testCaseKey)}`,
    );
  }
}
