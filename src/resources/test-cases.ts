/**
 * Resource methods for Test Cases.
 *
 * V2 endpoints:
 *   GET  /api/v2/test-case/{testKey}
 *   POST /api/v2/test-case
 *   PUT  /api/v2/test-case/{testKey}
 *   PUT  /api/v2/test-case/{testKey}/covered-requirements
 *        body: { "coveredRequirements": { "set"|"add"|"remove": [{"testKey": "..."}] } }
 *
 * Covered-requirements link management is documented on the devinti REST API
 * page as a single endpoint that takes one of three body shapes (`set`,
 * `add`, `remove`). Earlier attempts to call separate
 * `/{testKey}/covered-requirements/set|add|remove` returned 404 because
 * RTM exposes one endpoint with the operation in the body, not the path.
 *
 * DELETE endpoints are intentionally NOT exposed — destructive operations
 * belong behind an explicit confirmation flow in the MCP client.
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateTestCaseInput,
  LinkRef,
  TestCase,
  UpdateTestCaseInput,
} from './types.js';

const BASE = '/v2/test-case';

export type CoveredRequirementsOperation =
  | { set: LinkRef[] }
  | { add: LinkRef[] }
  | { remove: LinkRef[] };

export class TestCasesResource {
  constructor(private readonly http: HttpClient) {}

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

  /**
   * Replace / extend / shrink the set of requirements a Test Case covers.
   * Pass exactly one of `set`, `add`, or `remove` on the input object —
   * the body sent to RTM is `{ "coveredRequirements": <operation> }` per
   * the devinti REST API docs.
   */
  updateCoveredRequirements(
    testCaseKey: string,
    operation: CoveredRequirementsOperation,
  ): Promise<TestCase> {
    return this.http.put<TestCase>(
      `${BASE}/${encodeURIComponent(testCaseKey)}/covered-requirements`,
      { body: { coveredRequirements: operation } },
    );
  }
}
