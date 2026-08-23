/**
 * Resource methods for Defects.
 *
 * Endpoint pattern (V2): /api/v2/defect
 */
import { HttpClient } from '../client/http.js';
import type {
  CreateDefectInput,
  Defect,
  PaginatedResponse,
  UpdateDefectInput,
} from './types.js';

export interface ListDefectsParams {
  projectKey: string;
  page?: number;
  pageSize?: number;
}

const BASE = '/v2/defect';

export class DefectsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: ListDefectsParams): Promise<PaginatedResponse<Defect>> {
    return this.http.get<PaginatedResponse<Defect>>(BASE, {
      query: {
        projectKey: params.projectKey,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
  }

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

  // ---------- Link management: identifyingTestCases ----------

  setIdentifyingTestCases(defectKey: string, testCaseKeys: string[]): Promise<void> {
    return this.http.put<void>(
      `${BASE}/${encodeURIComponent(defectKey)}/identifying-test-cases`,
      {
        body: {
          identifyingTestCases: testCaseKeys.map((testKey) => ({ testKey })),
        },
      },
    );
  }
}
