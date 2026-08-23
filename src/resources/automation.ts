/**
 * Resource methods for Automation (CI result import).
 *
 * V2 endpoints:
 *   POST /api/v2/automation/import-test-results   (multipart)
 *   GET  /api/v2/automation/import-status/{taskId}
 */
import { HttpClient } from '../client/http.js';
import type {
  ImportTaskAccepted,
  ImportTaskStatus,
  ImportTestResultsInput,
  ReportType,
} from './types.js';

const IMPORT_PATH = '/v2/automation/import-test-results';
const STATUS_PATH = '/v2/automation/import-status';

export class AutomationResource {
  constructor(private readonly http: HttpClient) {}

  importTestResults(input: ImportTestResultsInput): Promise<ImportTaskAccepted> {
    const form = new FormData();
    form.append('projectKey', input.projectKey);
    if (input.name) form.append('name', input.name);
    form.append('reportType', input.reportType);
    if (input.jobUrl) form.append('jobUrl', input.jobUrl);
    if (input.treePath) form.append('treePath', input.treePath);
    if (input.testExecutionFields) {
      form.append('testExecutionFields', input.testExecutionFields);
    }
    if (input.testCaseFields) {
      form.append('testCaseFields', input.testCaseFields);
    }
    const blob = new Blob([input.file], { type: archiveMimeType(input.filename) });
    form.append('file', blob, input.filename);

    return this.http.postMultipart<ImportTaskAccepted>(IMPORT_PATH, form);
  }

  getImportStatus(taskId: string): Promise<ImportTaskStatus> {
    return this.http.get<ImportTaskStatus>(
      `${STATUS_PATH}/${encodeURIComponent(taskId)}`,
    );
  }
}

function archiveMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.zip')) return 'application/zip';
  if (lower.endsWith('.tar.gz')) return 'application/gzip';
  if (lower.endsWith('.tgz')) return 'application/gzip';
  return 'application/octet-stream';
}

export type { ReportType };
