/**
 * Resource methods for Test Cases.
 *
 * Endpoint pattern: /api/v2/test-case
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateTestCaseInput,
  TestCase,
  UpdateTestCaseInput,
} from './types.js';

const BASE = '/v2/test-case';

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

  delete(testCaseKey: string): Promise<void> {
    return this.http.delete<void>(`${BASE}/${encodeURIComponent(testCaseKey)}`);
  }

  // NOTE: covered-requirements link management endpoints are NOT supported by
  // the live RTM REST API (PUT .../covered-requirements → 404). The corresponding
  // tools have been removed; if you re-introduce them, point at the correct
  // path discovered from a fresh API doc.
}
