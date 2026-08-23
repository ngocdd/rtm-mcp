/**
 * Resource methods for Test Plans.
 *
 * V2 endpoints:
 *   GET  /api/v2/test-plan/{testKey}
 *   POST /api/v2/test-plan
 *   PUT  /api/v2/test-plan/{testKey}
 *   PUT  /api/v2/test-plan/{testKey}/included-test-cases
 *        body: { "includedTestCases": { "set"|"add"|"remove": [{"testKey": "..."}] } }
 *
 * Included-test-cases link management follows the same single-endpoint +
 * body-operation pattern as Test Case covered-requirements (documented on
 * the devinti REST API page). Earlier attempts to call separate
 * `/{testKey}/included-test-cases/set|add|remove` returned 404.
 *
 * DELETE endpoints are intentionally NOT exposed — destructive operations
 * belong behind an explicit confirmation flow in the MCP client.
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateTestPlanInput,
  LinkRef,
  TestPlan,
  UpdateTestPlanInput,
} from './types.js';

const BASE = '/v2/test-plan';

export type IncludedTestCasesOperation =
  | { set: LinkRef[] }
  | { add: LinkRef[] }
  | { remove: LinkRef[] };

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

  /**
   * Replace / extend / shrink the set of Test Cases included in a Test Plan.
   * Pass exactly one of `set`, `add`, or `remove` — the body sent to RTM is
   * `{ "includedTestCases": <operation> }`.
   */
  updateIncludedTestCases(
    testPlanKey: string,
    operation: IncludedTestCasesOperation,
  ): Promise<TestPlan> {
    return this.http.put<TestPlan>(
      `${BASE}/${encodeURIComponent(testPlanKey)}/included-test-cases`,
      { body: { includedTestCases: operation } },
    );
  }
}
