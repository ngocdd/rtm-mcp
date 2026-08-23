/**
 * Resource methods for Test Case Executions (TCE).
 *
 * Confirmed V2 endpoints:
 *   GET    /api/v2/test-case-execution/{tceKey}
 *   PUT    /api/v2/test-case-execution/{tceKey}                              (result, comment, etc.)
 *   POST   /api/v2/test-case-execution/{tceKey}/defect/{defectKey}
 *   POST   /api/v2/test-case-execution/{tceKey}/step/{stepId}/defect/{defectKey}
 *   GET    /api/v2/test-case-execution/{tceKey}/attachment
 *   POST   /api/v2/test-case-execution/{tceKey}/attachment                   (multipart)
 *   GET    /api/v2/test-case-execution/{tceKey}/attachment/{attachmentId}
 *   GET    /api/v2/test-case-execution/{tceKey}/step/{stepId}/attachment
 *   POST   /api/v2/test-case-execution/{tceKey}/step/{stepId}/attachment     (multipart)
 *
 * Step-level attachment endpoints are confirmed by devinti release notes
 * ("New REST API for step's attachments" — 11 Jan 2022, "Adding an
 * attachment to a step via REST API" — 27 May 2021) and follow the same
 * multipart convention as the TCE-level attachment upload.
 *
 * The PUT payload format is verified by a public GitHub Action that drives the
 * RTM API (see Dirtmain/sever-for-jira): the working body for changing the
 * result/status is `{"result":{"name":"Fail"}}`. We also accept plain
 * `{"status":"Fail"}` and `{"resultStatus":{"name":"Fail"}}` as fallbacks
 * because some RTM installations accept either.
 *
 * The attachment-by-id endpoint (`/attachment/{id}`) follows the same
 * `/{collection}/{itemId}` convention as the defect endpoints. It is not
 * separately documented in the public devinti docs but the resource layout
 * is consistent across the RTM REST API.
 *
 * DELETE endpoints exist for defects and attachments but are intentionally
 * not exposed as MCP tools — destructive operations belong behind a
 * confirmation flow in the MCP client, not a one-shot tool call.
 */
import { HttpClient } from '../client/http.js';
import type {
  Attachment,
  TestCaseExecution,
  UpdateTestCaseExecutionInput,
} from './types.js';

const BASE = '/v2/test-case-execution';

export class TestCaseExecutionsResource {
  constructor(private readonly http: HttpClient) {}

  get(testCaseExecutionKey: string): Promise<TestCaseExecution> {
    return this.http.get<TestCaseExecution>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}`,
    );
  }

  /**
   * Update a Test Case Execution. Used to set the result/status of an
   * individual test case run inside a Test Execution, attach a comment, or
   * patch custom fields. Only provided fields are sent.
   *
   * For setting the pass/fail result, pass `result` as either a plain status
   * name (`"Fail"`) or a `{ id }` / `{ name }` object. The server normalises
   * to the `{ result: { name } }` shape which is the documented working
   * payload on the live RTM cloud.
   */
  update(
    testCaseExecutionKey: string,
    input: UpdateTestCaseExecutionInput,
  ): Promise<TestCaseExecution> {
    return this.http.put<TestCaseExecution>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}`,
      { body: normalizeUpdatePayload(input) },
    );
  }

  // ---------- Attachments ----------

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

  getAttachment(
    testCaseExecutionKey: string,
    attachmentId: string,
  ): Promise<Attachment> {
    return this.http.get<Attachment>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}/attachment/${encodeURIComponent(attachmentId)}`,
    );
  }

  // ---------- Step attachments ----------

  listStepAttachments(
    testCaseExecutionKey: string,
    stepId: string,
  ): Promise<Attachment[]> {
    return this.http.get<Attachment[]>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}/step/${encodeURIComponent(stepId)}/attachment`,
    );
  }

  uploadStepAttachment(
    testCaseExecutionKey: string,
    stepId: string,
    file: { filename: string; data: Buffer | Uint8Array; mimeType?: string },
  ): Promise<Attachment> {
    const form = new FormData();
    const blob = new Blob([file.data], {
      type: file.mimeType ?? 'application/octet-stream',
    });
    form.append('file', blob, file.filename);
    return this.http.postMultipart<Attachment>(
      `${BASE}/${encodeURIComponent(testCaseExecutionKey)}/step/${encodeURIComponent(stepId)}/attachment`,
      form,
    );
  }

  // ---------- Defect linking ----------

  linkDefect(testCaseExecutionKey: string, defectTestKey: string): Promise<void> {
    return this.http.post<void>(
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
}

/**
 * Translate the friendly `result: "Fail"` shorthand into the wire-format
 * `result: { name: "Fail" }` that the live RTM API expects. Plain-string
 * `status` and `resultStatus` are also forwarded as fallbacks.
 */
function normalizeUpdatePayload(
  input: UpdateTestCaseExecutionInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (input.summary !== undefined) body.summary = input.summary;
  if (input.comment !== undefined) body.comment = input.comment;
  if (input.executedBy !== undefined) body.executedBy = input.executedBy;
  if (input.customFields !== undefined) body.customFields = input.customFields;

  // Always send `result` as `{ name | id }` if provided. The RTM API expects
  // a structured object; a plain string fails on the live cloud.
  if (input.result !== undefined) {
    body.result =
      typeof input.result === 'string'
        ? { name: input.result }
        : input.result;
  } else if (input.status !== undefined) {
    // No `result` given — forward `status` as the plain alternative.
    body.status = input.status;
  }

  return body;
}
