/**
 * RTM API facade — composes one resource per concern.
 *
 * The facade is the only object tool handlers need to know about; each
 * resource gets the shared `HttpClient` so authentication, retry and
 * timeout behaviour stay consistent.
 */
import { HttpClient } from './http.js';
import { AutomationResource } from '../resources/automation.js';
import { DefectsResource } from '../resources/defects.js';
import { RequirementsResource } from '../resources/requirements.js';
import { TestCaseExecutionsResource } from '../resources/test-case-executions.js';
import { TestCasesResource } from '../resources/test-cases.js';
import { TestExecutionsResource } from '../resources/test-executions.js';
import { TestPlansResource } from '../resources/test-plans.js';
import { TreeStructureResource } from '../resources/tree-structure.js';

export class RtmClient {
  public readonly requirements: RequirementsResource;
  public readonly testCases: TestCasesResource;
  public readonly testPlans: TestPlansResource;
  public readonly testExecutions: TestExecutionsResource;
  public readonly testCaseExecutions: TestCaseExecutionsResource;
  public readonly defects: DefectsResource;
  public readonly treeStructure: TreeStructureResource;
  public readonly automation: AutomationResource;

  constructor(http: HttpClient) {
    this.requirements = new RequirementsResource(http);
    this.testCases = new TestCasesResource(http);
    this.testPlans = new TestPlansResource(http);
    this.testExecutions = new TestExecutionsResource(http);
    this.testCaseExecutions = new TestCaseExecutionsResource(http);
    this.defects = new DefectsResource(http);
    this.treeStructure = new TreeStructureResource(http);
    this.automation = new AutomationResource(http);
  }
}
