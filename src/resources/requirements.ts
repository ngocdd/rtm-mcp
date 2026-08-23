/**
 * Resource methods for Requirements.
 *
 * Endpoint pattern: /api/requirement (no v2 in doc; falls back to v1)
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateRequirementInput,
  Requirement,
  UpdateRequirementInput,
} from './types.js';

const BASE = '/requirement';

export class RequirementsResource {
  constructor(private readonly http: HttpClient) {}

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

  // NOTE: covered-test-cases link management endpoints are NOT supported by
  // the live RTM REST API (PUT .../covered-test-cases → 404). The corresponding
  // tools have been removed; if you re-introduce them, point at the correct
  // path discovered from a fresh API doc.
}
