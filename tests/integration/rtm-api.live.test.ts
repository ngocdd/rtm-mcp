/**
 * Live integration test — skipped unless RTM_API_TOKEN is set AND RTM_LIVE=1.
 *
 * Run with:
 *   RTM_API_TOKEN=xxx RTM_LIVE=1 npm run test:integration
 *
 * Use a sandbox Jira project. Tests should be idempotent — they create
 * a temporary requirement and clean it up at the end.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HttpClient } from '../../src/client/http.js';
import { RequirementsResource } from '../../src/resources/requirements.js';
import type { Config } from '../../src/config/env.js';

const RUN_LIVE = Boolean(process.env.RTM_API_TOKEN && process.env.RTM_LIVE === '1');
const PROJECT_KEY = process.env.RTM_TEST_PROJECT ?? 'RTM';

describe.skipIf(!RUN_LIVE)('live RTM API', () => {
  let http: HttpClient;
  let req: RequirementsResource;
  let createdKey: string | undefined;

  beforeAll(() => {
    const cfg: Config = {
      apiToken: process.env.RTM_API_TOKEN!,
      baseUrl:
        process.env.RTM_BASE_URL ?? 'https://rtm-us.deviniti.com/api',
      logLevel: 'warn',
      timeoutMs: 30_000,
      maxRetries: 1,
    };
    http = new HttpClient(cfg);
    req = new RequirementsResource(http);
  });

  afterAll(async () => {
    if (createdKey) {
      try {
        await req.delete(createdKey);
      } catch {
        // best effort
      }
    }
  });

  it('creates, fetches and deletes a Requirement', async () => {
    const name = `rtm-mcp smoke ${Date.now()}`;
    const created = await req.create({
      projectKey: PROJECT_KEY,
      name,
      description: 'created by rtm-mcp integration test',
    });
    expect(created.key).toBeTruthy();
    createdKey = created.key;

    const fetched = await req.get(created.key);
    expect(fetched.name).toBe(name);

    const list = await req.list({ projectKey: PROJECT_KEY, pageSize: 10 });
    expect(Array.isArray(list.items)).toBe(true);
  });
});
