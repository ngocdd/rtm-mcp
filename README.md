# rtm-mcp

An MCP (Model Context Protocol) server for the
**[Requirements and Test Management for Jira](https://deviniti.com/support/addon/cloud/requirements-test-management/latest/rest-api/)**
REST API v2. Exposes Requirements, Test Cases, Test Plans, Test Executions,
Test Case Executions, Defects, Tree Structure and Automation as MCP tools
so any MCP-compatible client (Claude Desktop, IDE extensions, custom agents)
can drive RTM directly.

Run it with NPX — no install, no clone:

```bash
npx rtm-mcp
```

---

## Features

- **40+ tools** covering CRUD and link management for every RTM resource.
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
  -e RTM_BASE_URL=https://rtm-us.devinti.com/api \
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
  -e RTM_BASE_URL=https://rtm-us.devinti.com/api \
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

All tools return MCP `text` content with pretty-printed JSON.

### Requirements (`REQUIREMENTS`)

- `rtm_list_requirements` — list with `projectKey`, optional `folder`, `page`, `pageSize`
- `rtm_get_requirement` — fetch by `requirementKey`
- `rtm_create_requirement` — create
- `rtm_update_requirement` — partial update
- `rtm_delete_requirement`
- `rtm_set_requirement_covered_test_cases` — replace link set
- `rtm_add_requirement_covered_test_cases` — append
- `rtm_remove_requirement_covered_test_cases` — remove subset

### Test Cases (`TEST_CASES`)

- `rtm_list_test_cases`, `rtm_get_test_case`, `rtm_create_test_case`,
  `rtm_update_test_case`, `rtm_delete_test_case`
- `rtm_set_test_case_covered_requirements`, `rtm_add_test_case_covered_requirements`,
  `rtm_remove_test_case_covered_requirements`

### Test Plans (`TEST_PLANS`)

- `rtm_list_test_plans`, `rtm_get_test_plan`, `rtm_create_test_plan`,
  `rtm_update_test_plan`, `rtm_delete_test_plan`
- `rtm_set_test_plan_included_test_cases`, `rtm_add_test_plan_included_test_cases`,
  `rtm_remove_test_plan_included_test_cases`

### Test Executions (`TEST_EXECUTIONS`)

- `rtm_list_test_executions`, `rtm_get_test_execution`, `rtm_create_test_execution`,
  `rtm_update_test_execution`, `rtm_delete_test_execution`

### Test Case Executions (`TCE`)

- `rtm_link_defect_to_test_case_execution`
- `rtm_unlink_defect_from_test_case_execution`
- `rtm_link_defect_to_test_case_execution_step`
- `rtm_unlink_defect_from_test_case_execution_step`
- `rtm_list_test_case_execution_attachments`
- `rtm_upload_test_case_execution_attachment` (base64 input)

### Defects

- `rtm_list_defects`, `rtm_get_defect`, `rtm_create_defect`,
  `rtm_update_defect`, `rtm_delete_defect`
- `rtm_set_defect_identifying_test_cases`

### Tree

- `rtm_get_tree_structure` — optional `projectKey`, optional `resourceType`

### Automation

- `rtm_import_test_results` — upload ZIP/TAR.GZ of JUnit/NUnit/Cucumber JSON; returns a `taskId`
- `rtm_get_import_status` — poll until `status` leaves `IMPORTING`

---

## Examples

> *"List the 10 most recent Requirements in project ACME."*

```
> rtm_list_requirements { projectKey: "ACME", pageSize: 10 }
```

> *"Create a Test Case called 'Login with valid credentials' under folder /Smoke and link it to requirement ACME-42."*

```
> rtm_create_test_case { projectKey: "ACME", name: "Login with valid credentials", folder: "/Smoke", stepGroups: [...] }
> rtm_set_test_case_covered_requirements { testCaseKey: "<new>", requirementKeys: ["ACME-42"] }
```

> *"Link defect DEF-1 to test-case execution TCE-42 at step 3."*

```
> rtm_link_defect_to_test_case_execution_step { testCaseExecutionKey: "TCE-42", stepId: "3", defectTestKey: "DEF-1" }
```

> *"Import last night's JUnit XML."*

```
> rtm_import_test_results { projectKey: "ACME", filename: "junit.zip", contentBase64: "<base64>", reportType: "JUNIT", jobUrl: "https://ci/job/123" }
> rtm_get_import_status { taskId: "<returned>" }
```

---

## Troubleshooting

| Symptom                                                      | Likely cause / fix                                                                                                  |
|--------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Server exits on startup with `RTM_API_TOKEN is required`     | Token missing or empty. Set it as `RTM_API_TOKEN=...` before launching.                                              |
| Tool returns `Authentication failed. Verify RTM_API_TOKEN…`  | Token invalid, expired, or generated for a different user. Re-generate in Jira.                                      |
| Tool returns `Resource not found`                            | The test key doesn't match any issue — verify it with `rtm_list_*` first.                                          |
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

## License

MIT — see [LICENSE](./LICENSE).
