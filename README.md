# rtm-mcp

[![npm version](https://img.shields.io/npm/v/rtm-mcp.svg)](https://www.npmjs.com/package/rtm-mcp)
[![npm downloads](https://img.shields.io/npm/dt/rtm-mcp.svg)](https://www.npmjs.com/package/rtm-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![GitHub repo](https://img.shields.io/badge/GitHub-ngocdd%2Frtm--mcp-181717?logo=github)](https://github.com/ngocdd/rtm-mcp)
[![CI status](https://img.shields.io/badge/build-passing-brightgreen)](#)

An **open-source** MCP (Model Context Protocol) server for the
**[Requirements and Test Management for Jira](https://deviniti.com/support/addon/cloud/requirements-test-management/latest/rest-api/)**
REST API v2. Exposes Requirements, Test Cases, Test Plans, Test Executions,
Test Case Executions, Defects, Tree Structure and Automation as MCP tools
so any MCP-compatible client (Claude Desktop, IDE extensions, custom agents)
can drive RTM directly.

Run it with NPX — no install, no clone:

```bash
npx rtm-mcp
```

### Links

- 📦 **npm package**: https://www.npmjs.com/package/rtm-mcp
- 🐙 **GitHub repo**: https://github.com/ngocdd/rtm-mcp
- 🐛 **Issue tracker**: https://github.com/ngocdd/rtm-mcp/issues
- 📚 **RTM API docs**: https://deviniti.com/support/addon/cloud/requirements-test-management/latest/rest-api/

---

## Features

- **32 MCP tools** covering CRUD, link management, attachments, and CI result import for every RTM resource.
- **Bearer-token auth** via `RTM_API_TOKEN`. Generate a token in Jira:
  Apps → Requirements and Test Management → ⋯ → *Rest API authentication* → Generate Token.
- **US + EU regions** — switch via `RTM_BASE_URL`.
- **Retries + timeouts + jitter** baked into the HTTP client (handles 429/5xx/network).
- **Typed errors** mapped to friendly MCP error messages — never leaks stack traces.
- **Attachment upload** accepts base64 payloads (safe for sandboxed MCP clients).
- **Stderr-only logging** — stdout stays clean for JSON-RPC.

---

## Quick start

### 1. Generate an RTM API token

1. Open Jira.
2. Go to **Apps → Requirements and Test Management**.
3. Click the three-dot menu (⋯) → **Rest API authentication**.
4. Click **Generate Token**, pick a user, add a label, click **Generate**.
5. **Copy the token immediately** — RTM never shows it again.

### 2. Run the server

```bash
RTM_API_TOKEN=your-token-here npx rtm-mcp
```

The server speaks MCP over stdio — point your MCP client at it.

---

## Claude Desktop setup

Add to `claude_desktop_config.json`:

US / Global (default URL):

```json
{
  "mcpServers": {
    "rtm": {
      "command": "npx",
      "args": ["-y", "rtm-mcp"],
      "env": {
        "RTM_API_TOKEN": "<your-token-here>",
        "RTM_BASE_URL": "https://rtm-us.deviniti.com/api"
      }
    }
  }
}
```

EU region:

```json
{
  "mcpServers": {
    "rtm": {
      "command": "npx",
      "args": ["-y", "rtm-mcp"],
      "env": {
        "RTM_API_TOKEN": "<your-token-here>",
        "RTM_BASE_URL": "https://rtm-eu-api.hexygen.com/api"
      }
    }
  }
}
```

---

## Claude Code CLI setup

Use the `claude mcp add` command to register the server with Claude Code.

### User scope (recommended — available across all your projects)

```bash
claude mcp add --scope user --transport stdio rtm \
  -e RTM_API_TOKEN=<your-token-here> \
  -e RTM_BASE_URL=https://rtm-us.deviniti.com/api \
  -- npx -y rtm-mcp
```

EU region:

```bash
claude mcp add --scope user --transport stdio rtm \
  -e RTM_API_TOKEN=<your-token-here> \
  -e RTM_BASE_URL=https://rtm-eu-api.hexygen.com/api \
  -- npx -y rtm-mcp
```

`--scope user` writes the entry to `~/.claude.json` so every Claude Code
project on this machine can see the `rtm` server.

### Project scope (only this project)

```bash
claude mcp add --scope project --transport stdio rtm \
  -e RTM_API_TOKEN=<your-token-here> \
  -e RTM_BASE_URL=https://rtm-us.deviniti.com/api \
  -- npx -y rtm-mcp
```

Writes to `.mcp.json` in the current directory (committed to git).

### Verify the registration

```bash
claude mcp list           # see all configured servers
claude mcp get rtm        # inspect the rtm entry
```

### Remove the server

```bash
claude mcp remove rtm
```

---

## Configuration

| Env var          | Required | Default                                  | Purpose                                                                                       |
|------------------|----------|------------------------------------------|-----------------------------------------------------------------------------------------------|
| `RTM_API_TOKEN`  | **yes**  | —                                        | Bearer token from Jira → Apps → RTM → API Tokens.                                              |
| `RTM_BASE_URL`   | no       | `https://rtm-us.deviniti.com/api`        | EU: `https://rtm-eu-api.hexygen.com/api`. Confirm from the *Rest API authentication* panel.    |
| `RTM_LOG_LEVEL`  | no       | `info`                                   | One of `debug`, `info`, `warn`, `error`. Logs go to **stderr** only.                          |
| `RTM_TIMEOUT_MS` | no       | `30000`                                  | Per-request HTTP timeout in milliseconds.                                                     |
| `RTM_MAX_RETRIES`| no       | `2`                                      | Retries on `429`/`5xx`/network errors. Respects `Retry-After`.                                 |

A missing or empty `RTM_API_TOKEN` aborts startup with a friendly hint.

---

## Available tools

All tools return MCP `text` content with pretty-printed JSON. **32 tools** total, organised by RTM resource below. Use the MCP host's tool-list command to enumerate them at runtime.

### Requirements (`REQUIREMENTS`)

- `rtm_get_requirement` — fetch by `requirementKey`
- `rtm_create_requirement` — create
- `rtm_update_requirement` — partial update
- `rtm_delete_requirement` — permanently delete

> RTM has no list endpoint for requirements — use `rtm_get_tree_structure` to enumerate them per project.

### Test Cases (`TEST_CASES`)

- `rtm_get_test_case` — fetch by `testCaseKey`
- `rtm_create_test_case` — create (pass `stepGroups` to define steps)
- `rtm_update_test_case` — partial update
- `rtm_update_test_case_covered_requirements` — manage covered-requirement links. Pass exactly one of `set` / `add` / `remove`. Wire call: `PUT /api/v2/test-case/{key}/covered-requirements` with body `{ coveredRequirements: { <op>: [...] } }`.

> `rtm_delete_test_case` is intentionally not exposed — perform deletes via the Jira UI. RTM has no list endpoint — use `rtm_get_tree_structure`.

### Test Plans (`TEST_PLANS`)

- `rtm_get_test_plan` — fetch by `testPlanKey`
- `rtm_create_test_plan` — create (pass `includedTestCases` to populate on creation)
- `rtm_update_test_plan` — partial update
- `rtm_update_test_plan_included_test_cases` — manage included-test-case links. Pass exactly one of `set` / `add` / `remove`. Wire call: `PUT /api/v2/test-plan/{key}/included-test-cases` with body `{ includedTestCases: { <op>: [...] } }`.

> `rtm_delete_test_plan` is intentionally not exposed — perform deletes via the Jira UI. RTM has no list endpoint — use `rtm_get_tree_structure`.

### Test Executions (`TEST_EXECUTIONS`)

- `rtm_get_test_execution` — fetch by `testExecutionKey`
- `rtm_create_test_execution` — create by executing a Test Plan (pass `testPlanTestKey`)
- `rtm_update_test_execution` — partial update (accepts `status`, `summary`, `description`, `priority`, `owner`, `customFields`)
- `rtm_delete_test_execution` — permanently delete

> RTM has no list endpoint — use `rtm_get_tree_structure`.

### Test Case Executions (`TCE`)

TCE = one row in a Test Execution that records the result of running one Test Case.

- `rtm_get_test_case_execution` — fetch one TCE (result, executor, comment, defects, steps)
- `rtm_update_test_case_execution` — partial update. Pass `result: "Fail"` (or `"Pass"`, `"Blocked"`, …) to change pass/fail status. Wire call: `PUT /api/v2/test-case-execution/{key}` with body `{ result: { name: "Fail" } }`.
- `rtm_link_defect_to_test_case_execution` — link a defect to the whole TCE
- `rtm_link_defect_to_test_case_execution_step` — link a defect to a specific step
- `rtm_list_test_case_execution_attachments` — list attachments on the TCE
- `rtm_upload_test_case_execution_attachment` (base64 input) — upload a file to the TCE
- `rtm_get_test_case_execution_attachment` — fetch one attachment's metadata (returns download URL)
- `rtm_list_test_case_execution_step_attachments` — list attachments on a single step
- `rtm_upload_test_case_execution_step_attachment` (base64 input) — upload a file to a specific step

> DELETE endpoints on TCE (`unlink defect`, `delete attachment`) are intentionally **not** exposed — perform those via the Jira UI or call the underlying REST API directly. The endpoints exist; only the MCP one-shot wrappers were removed because destructive operations belong behind a confirmation flow.

### Defects

- `rtm_get_defect` — fetch by `defectKey`
- `rtm_create_defect` — create (pass `identifyingTestCases` to link to test cases)
- `rtm_update_defect` — partial update
- `rtm_delete_defect` — permanently delete

> RTM has no list endpoint — use `rtm_get_tree_structure` or `jira_search` via the Atlassian MCP.

### Tree

- `rtm_get_tree_structure` — fetch the folder tree for a project. Requires numeric `projectId` (resolve from `projectKey` via the Jira REST API) and `treeType` ∈ `REQUIREMENTS` / `TEST_CASES` / `TEST_PLANS` / `TEST_EXECUTIONS`.

### Automation

- `rtm_import_test_results` — upload a ZIP/TAR.GZ archive of JUnit / NUnit / Cucumber JSON reports; returns a `taskId`
- `rtm_get_import_status` — poll a previous `taskId` until `status` leaves `IMPORTING`

## Conventions used across every resource

| Convention | Description |
|---|---|
| **Link management** | One `PUT /api/v2/{resource}/{key}/{linkField}` endpoint takes the operation (`set` / `add` / `remove`) in the body. There are no separate `…/set`, `…/add`, `…/remove` paths. |
| **Test Case Execution result** | The pass/fail status is sent as `{ result: { name: "Fail" } }` (not a plain string). The MCP tool normalises `result: "Fail"` → `{ result: { name: "Fail" } }` automatically. |
| **Attachments** | Upload via multipart with `file=@…`. List, fetch-by-id, and step-level variants are exposed per the V2 layout. |
| **No DELETE MCP tools for nested resources** | Unlinking defects and deleting attachments belong behind an explicit confirmation flow in the MCP client — not a one-shot tool call. Use the Jira UI or call the REST API directly. |

---

## Examples

> *"Enumerate the requirements in project ACME."*

```
> // No list endpoint — fetch the tree and walk it.
> rtm_get_tree_structure { projectId: 10000, treeType: "REQUIREMENTS" }
```

> *"Create a Test Case called 'Login with valid credentials' under folder /Smoke and link it to requirement ACME-42."*

```
> rtm_create_test_case { projectKey: "ACME", summary: "Login with valid credentials", folder: "/Smoke", stepGroups: [...] }
> rtm_update_test_case_covered_requirements { testCaseKey: "<new>", set: ["ACME-42"] }
```

> *"Add 3 test cases to plan KAN-52 without replacing the existing set."*

```
> rtm_update_test_plan_included_test_cases {
    testPlanKey: "KAN-52",
    add: ["KAN-30", "KAN-31", "KAN-32"]
  }
```

> *"Link defect KAN-100 to test-case execution KAN-53-KAN-46 at step 8517443."*

```
> rtm_link_defect_to_test_case_execution_step {
    testCaseExecutionKey: "KAN-53-KAN-46",
    stepId: "8517443",
    defectTestKey: "KAN-100"
  }
```

> *"Mark TCE KAN-53-KAN-46 as Failed and add a comment."*

```
> rtm_update_test_case_execution {
    testCaseExecutionKey: "KAN-53-KAN-46",
    result: "Fail",
    comment: "Login button did not respond after 3 retries"
  }
```

> *"Attach a screenshot to step 2 of TCE KAN-53-KAN-46."*

```
> rtm_upload_test_case_execution_step_attachment {
    testCaseExecutionKey: "KAN-53-KAN-46",
    stepId: "8517444",
    filename: "evidence.png",
    contentBase64: "<base64 bytes>",
    mimeType: "image/png"
  }
```

> *"Import last night's JUnit XML."*

```
> rtm_import_test_results {
    projectKey: "ACME",
    filename: "junit.zip",
    contentBase64: "<base64>",
    reportType: "JUNIT",
    jobUrl: "https://ci/job/123"
  }
> rtm_get_import_status { taskId: "<returned>" }
```

---

## Troubleshooting

| Symptom                                                      | Likely cause / fix                                                                                                  |
|--------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Server exits on startup with `RTM_API_TOKEN is required`     | Token missing or empty. Set it as `RTM_API_TOKEN=...` before launching.                                              |
| Tool returns `Authentication failed. Verify RTM_API_TOKEN…`  | Token invalid, expired, or generated for a different user. Re-generate in Jira.                                      |
| Tool returns `Resource not found`                            | The test key doesn't match any issue — verify it with `rtm_get_*` or the tree-structure tool.                     |
| `Validation failed (HTTP 400)`                               | RTM rejected the payload. The tool message includes the parsed response body.                                         |
| `Rate limited by RTM API (HTTP 429). Retry after Ns.`        | You're hitting the rate limit. Reduce concurrency or wait.                                                          |
| `Network error reaching RTM API`                             | Wrong `RTM_BASE_URL` (US vs EU mismatch), firewall, or transient network issue.                                       |
| Tool hangs / times out                                       | Bump `RTM_TIMEOUT_MS`. Default is 30s; automation imports may take longer.                                          |

---

## Development

```bash
git clone <repo>
cd rtm-mcp
npm install
npm run build         # compile to dist/
npm test              # unit tests
npm run dev           # run from src/ via tsx
npm run typecheck     # tsc --noEmit
```

### Project layout

```
src/
├── index.ts                  # entry point (shebang)
├── server.ts                 # McpServer wiring
├── config/                   # env validation + constants
├── client/
│   ├── http.ts               # fetch wrapper w/ retry + timeout
│   ├── errors.ts             # RTMError hierarchy
│   └── rtm-client.ts         # facade composing all resources
├── resources/                # one file per RTM resource
├── tools/                    # MCP tool registrations
├── schemas/                  # zod input schemas per tool group
└── utils/                    # logger, MCP response helpers
tests/
├── unit/                     # mocked fetch tests
└── integration/              # opt-in live tests (gated by RTM_LIVE=1)
```

### Live integration tests

```bash
RTM_API_TOKEN=xxx \
RTM_BASE_URL=https://rtm-us.deviniti.com/api \
RTM_LIVE=1 \
RTM_TEST_PROJECT=ACME \
npm run test:integration
```

Use a sandbox Jira project. The smoke test creates a Requirement, fetches
it, lists nearby, and cleans up.

---

## Publishing

```bash
npm login
npm version patch   # or minor / major
npm publish --access public
```

`prepublishOnly` runs `typecheck`, `test`, `build` automatically.

---

## Contributing

This is an open-source project — issues and PRs are welcome!

1. Fork the repo: https://github.com/ngocdd/rtm-mcp
2. Create a feature branch: `git checkout -b feat/my-tool`
3. Install + run tests locally:
   ```bash
   npm install
   npm run typecheck
   npm test
   ```
4. Add tests for any new resource method or tool.
5. Open a Pull Request against `main`:
   https://github.com/ngocdd/rtm-mcp/compare

### Adding a new RTM endpoint

1. Add a typed method to the matching `src/resources/<resource>.ts` module.
2. Add a zod input schema to `src/schemas/<resource>.schema.ts`.
3. Register an MCP tool in `src/tools/<resource>.ts`.
4. Add a unit test in `tests/unit/`.
5. Run `npm run typecheck && npm test`.

### Reporting bugs

Use https://github.com/ngocdd/rtm-mcp/issues — include RTM resource type,
endpoint path, expected vs actual response and (redacted) request body.

---

## License

MIT — see [LICENSE](./LICENSE).

Copyright (c) 2026 rtm-mcp contributors. Released under the
[MIT License](https://opensource.org/licenses/MIT); you are free to use,
modify and distribute this project in both open-source and proprietary
software, provided the copyright notice is preserved.
