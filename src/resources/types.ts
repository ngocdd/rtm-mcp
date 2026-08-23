/**
 * Domain types for the RTM REST API.
 *
 * Field names mirror the API verbatim (snake_case where the API uses it,
 * otherwise camelCase) so we can pass the same object back as a payload.
 * Optional fields are marked `?` based on the documented responses — list
 * endpoints may omit certain keys for performance.
 */

/** Generic paginated envelope. */
export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
  startAt?: number;
  maxResults?: number;
}

/** Lightweight link used in nested payloads. */
export interface LinkRef {
  testKey: string;
  name?: string;
  id?: string;
}

/** Attachment metadata returned by the API. */
export interface Attachment {
  id: string;
  filename: string;
  size?: number;
  mimeType?: string;
  url?: string;
  createdOn?: string;
}

/** Step column (a single cell in a test-step row). */
export interface StepColumn {
  ordinal: number;
  value: string;
}

/** A single test step. */
export interface Step {
  id?: string;
  ordinal?: number;
  description?: string;
  expectedResult?: string;
  testData?: string;
  stepColumns: StepColumn[];
  /** Step attachments — RTM API accepts an array of `{ attachmentId }` references. */
  stepAttachments?: Array<{ attachmentId: string } | Attachment>;
}

/** A named group of steps on a Test Case. */
export interface StepGroup {
  id?: string;
  name?: string;
  description?: string;
  steps: Step[];
}

// ---------- Resources ----------

export interface Requirement {
  id?: string;
  key: string;
  summary: string;
  description?: string;
  projectKey: string;
  folder?: string;
  folderPath?: string;
  priority?: string;
  status?: string;
  owner?: string;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
  version?: number;
  customFields?: Record<string, unknown>;
  coveredTestCases?: LinkRef[];
}

export interface CreateRequirementInput {
  projectKey: string;
  summary: string;
  issueTypeId: number;
  description?: string;
  folder?: string;
  folderPath?: string;
  priority?: string;
  owner?: string;
  status?: string;
  customFields?: Record<string, unknown>;
}

export type UpdateRequirementInput = Partial<Omit<CreateRequirementInput, 'projectKey'>>;

export interface TestCase {
  id?: string;
  key: string;
  summary: string;
  description?: string;
  objective?: string;
  precondition?: string;
  preconditions?: string;
  projectKey: string;
  folder?: string;
  folderPath?: string;
  priority?: string;
  status?: string;
  owner?: string;
  estimatedTime?: number;
  timeEstimate?: number;
  environment?: string;
  labels?: string[];
  components?: Array<{ id?: string; name?: string }>;
  versions?: Array<{ id?: string; name?: string }>;
  stepGroups?: StepGroup[];
  coveredRequirements?: LinkRef[];
  customFields?: Record<string, unknown>;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
}

export interface CreateTestCaseInput {
  projectKey: string;
  summary: string;
  issueTypeId: number;
  testKey?: string;
  description?: string;
  objective?: string;
  precondition?: string;
  preconditions?: string;
  folder?: string;
  folderPath?: string;
  parentTestKey?: string;
  priority?: string | { id?: number; name?: string };
  status?: string;
  owner?: string;
  estimatedTime?: number;
  timeEstimate?: number;
  environment?: string;
  labels?: string[];
  components?: Array<{ id?: string; name?: string }>;
  versions?: Array<{ id?: string; name?: string }>;
  stepGroups?: StepGroup[];
  coveredRequirements?: Array<{ testKey: string } | string>;
  links?: Array<{ testKey: string }>;
  customFields?: Record<string, unknown>;
}

export type UpdateTestCaseInput = Partial<Omit<CreateTestCaseInput, 'projectKey'>>;

export interface TestPlan {
  id?: string;
  key: string;
  summary: string;
  description?: string;
  projectKey: string;
  folder?: string;
  folderPath?: string;
  priority?: string;
  status?: string;
  owner?: string;
  includedTestCases?: LinkRef[];
  customFields?: Record<string, unknown>;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
}

export interface CreateTestPlanInput {
  projectKey: string;
  summary: string;
  issueTypeId: number;
  description?: string;
  folder?: string;
  folderPath?: string;
  priority?: string;
  status?: string;
  owner?: string;
  includedTestCases?: Array<{ testKey: string }>;
  customFields?: Record<string, unknown>;
}

export type UpdateTestPlanInput = Partial<Omit<CreateTestPlanInput, 'projectKey'>>;

export interface TestExecution {
  id?: string;
  key: string;
  summary?: string;
  description?: string;
  projectKey: string;
  folder?: string;
  folderPath?: string;
  priority?: string;
  status?: string;
  owner?: string;
  includedTestCases?: LinkRef[];
  customFields?: Record<string, unknown>;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
}

export interface CreateTestExecutionInput {
  projectKey: string;
  summary?: string;
  description?: string;
  folder?: string;
  folderPath?: string;
  priority?: string;
  status?: string;
  owner?: string;
  includedTestCases?: Array<{ testKey: string }>;
  customFields?: Record<string, unknown>;
}

export type UpdateTestExecutionInput = Partial<Omit<CreateTestExecutionInput, 'projectKey'>>;

export interface TestCaseExecution {
  id?: string;
  key: string;
  summary?: string;
  testCaseKey?: string;
  testKey?: string;
  testExecutionKey?: string;
  status?: string;
  result?: string;
  executor?: string;
  executedBy?: string;
  executedOn?: string;
  defects?: LinkRef[];
  attachments?: Attachment[];
  customFields?: Record<string, unknown>;
  createdOn?: string;
  updatedOn?: string;
}

export interface Defect {
  id?: string;
  key: string;
  summary: string;
  description?: string;
  projectKey: string;
  status?: string;
  priority?: string;
  reporter?: string;
  assignee?: string;
  identifyingTestCases?: LinkRef[];
  customFields?: Record<string, unknown>;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
}

export interface CreateDefectInput {
  projectKey: string;
  summary: string;
  issueTypeId: number;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  identifyingTestCases?: Array<{ testKey: string }>;
  customFields?: Record<string, unknown>;
}

export type UpdateDefectInput = Partial<Omit<CreateDefectInput, 'projectKey'>>;

export interface TreeNode {
  id?: string;
  name: string;
  path: string;
  type: 'folder' | 'item' | string;
  resourceType?: ResourceType | string;
  children?: TreeNode[];
  itemCount?: number;
}

export type ResourceType =
  | 'REQUIREMENTS'
  | 'TEST_CASES'
  | 'TEST_PLANS'
  | 'TEST_EXECUTIONS';

// ---------- Automation ----------

export type ReportType = 'JUNIT' | 'NUNIT' | 'CUCUMBER_JSON';

export interface ImportTestResultsInput {
  projectKey: string;
  name?: string;
  file: Buffer | Uint8Array;
  filename: string;
  reportType: ReportType;
  jobUrl?: string;
  treePath?: string;
  testExecutionFields?: string;
  testCaseFields?: string;
}

export interface ImportTaskAccepted {
  taskId: string;
  [key: string]: unknown;
}

export interface ImportTaskStatus {
  taskId: string;
  status: 'IMPORTING' | 'DONE' | 'FAILED' | string;
  progress?: number;
  message?: string;
  result?: {
    testExecutionKey?: string;
    imported?: number;
    failed?: number;
    [key: string]: unknown;
  };
  errors?: Array<{ message?: string; [key: string]: unknown }>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{ field?: string; message?: string }>;
}
