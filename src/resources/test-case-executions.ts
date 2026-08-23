/**
 * Resource methods for Test Case Executions (TCE).
 *
 * Confirmed V2 endpoints:
 *   POST   /api/v2/test-case-execution/{tceKey}/defect/{defectKey}
 *   DELETE /api/v2/test-case-execution/{tceKey}/defect/{defectKey}
 *   POST   /api/v2/test-case-execution/{tceKey}/step/{stepId}/defect/{defectKey}
 *   DELETE /api/v2/test-case-execution/{tceKey}/step/{stepId}/defect/{defectKey}
 *   POST   /api/v2/test-case-execution/{tceKey}/attachment   (multipart)
 */
import { HttpClient } from '../client/http.js';
import type { Attachment, TestCaseExecution } from './types.js';

const BASE = '/v2/test-case-execution';

export class TestCaseExecutionsResource {
  constructor(private readonly http: HttpClient) {}

  get(testCaseExecutionKey: string): Promise<TestCaseExecution> {
    return this.http.get<TestCaseExecution>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}`,
    );
  }

  listAttachments(testCaseExecutionKey: string): Promise<Attachment[]> {
    return this.http.get<Attachment[]>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}/attachment`,
    );
  }

  uploadAttachment(
    testCaseExecutionKey: string,
    file: { filename: string; data: Buffer | Uint8Array; mimeType?: string },
  ): Promise<Attachment> {
    const form = new FormData();
    const blob = new Blob([file.data], {
      type: file.mimeType ?? 'application/octet-stream',
    });
    form.append('file', blob, file.filename);
    return this.http.postMultipart<Attachment>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}/attachment`,
      form,
    );
  }

  // ---------- Defect linking ----------

  linkDefect(testCaseExecutionKey: string, defectTestKey: string): Promise<void> {
    return this.http.post<void>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}/defect/${encodeURIComponent(defectTestKey)}`,
    );
  }

  unlinkDefect(testCaseExecutionKey: string, defectTestKey: string): Promise<void> {
    return this.http.delete<void>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}/defect/${encodeURIComponent(defectTestKey)}`,
    );
  }

  linkStepDefect(
    testCaseExecutionKey: string,
    stepId: string,
    defectTestKey: string,
  ): Promise<void> {
    return this.http.post<void>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}/step/${encodeURIComponent(stepId)}/defect/${encodeURIComponent(defectTestKey)}`,
    );
  }

  unlinkStepDefect(
    testCaseExecutionKey: string,
    stepId: string,
    defectTestKey: string,
  ): Promise<void> {
    return this.http.delete<void>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}/step/${encodeURIComponent(stepId)}/defect/${encodeURIComponent(defectTestKey)}`,
    );
  }
}
