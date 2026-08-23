/**
 * Resource methods for Defects.
 *
 * Endpoint pattern: /api/defect (no v2 in doc; falls back to v1)
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateDefectInput,
  Defect,
  UpdateDefectInput,
} from './types.js';

const BASE = '/defect';

export class DefectsResource {
  constructor(private readonly http: HttpClient) {}

  get(defectKey: string): Promise<Defect> {
    return this.http.get<Defect>(`${BASE}/${encodeURIComponent(defectKey)}`);
  }

  create(input: CreateDefectInput): Promise<Defect> {
    return this.http.post<Defect>(BASE, { body: input });
  }

  update(defectKey: string, input: UpdateDefectInput): Promise<Defect> {
    return this.http.put<Defect>(`${BASE}/${encodeURIComponent(defectKey)}`, {
      body: input,
    });
  }

  delete(defectKey: string): Promise<void> {
    return this.http.delete<void>(`${BASE}/${encodeURIComponent(defectKey)}`);
  }

  // NOTE: identifying-test-cases link management endpoints are NOT supported by
  // the live RTM REST API (PUT .../identifying-test-cases → 404). The
  // corresponding tool has been removed; if you re-introduce it, point at the
  // correct path discovered from a fresh API doc.
}
