/**
 * Loads and validates environment variables using zod.
 *
 * On failure: prints a friendly message to stderr and exits with code 1.
 * On success: returns a frozen, immutable config object.
 */
import { z } from 'zod';
import {
  DEFAULT_BASE_URL,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
} from './constants.js';

const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

const ConfigSchema = z.object({
  apiToken: z
    .string({ required_error: 'RTM_API_TOKEN is required' })
    .min(1, 'RTM_API_TOKEN must not be empty'),
  baseUrl: z
    .string()
    .url('RTM_BASE_URL must be a valid URL')
    .default(DEFAULT_BASE_URL),
  logLevel: LogLevelSchema.default('info'),
  timeoutMs: z.coerce
    .number()
    .int()
    .positive('RTM_TIMEOUT_MS must be a positive integer')
    .default(DEFAULT_TIMEOUT_MS),
  maxRetries: z.coerce
    .number()
    .int()
    .min(0, 'RTM_MAX_RETRIES must be >= 0')
    .default(DEFAULT_MAX_RETRIES),
});

export type Config = Readonly<z.infer<typeof ConfigSchema>>;
export type LogLevel = z.infer<typeof LogLevelSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = ConfigSchema.safeParse({
    apiToken: env.RTM_API_TOKEN,
    baseUrl: env.RTM_BASE_URL,
    logLevel: env.RTM_LOG_LEVEL,
    timeoutMs: env.RTM_TIMEOUT_MS,
    maxRetries: env.RTM_MAX_RETRIES,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    printToStderr(
      [
        'rtm-mcp: invalid configuration',
        issues,
        '',
        'To fix:',
        '  • Generate a token: Jira → Apps → Requirements and Test Management → ⋯ → Rest API authentication → Generate Token.',
        '  • Set the token before launching:',
        '      export RTM_API_TOKEN=...',
        '  • Optional:',
        '      export RTM_BASE_URL=https://rtm-eu-api.hexygen.com/api  # for EU',
        '      export RTM_LOG_LEVEL=info',
        '      export RTM_TIMEOUT_MS=30000',
        '      export RTM_MAX_RETRIES=2',
      ].join('\n'),
    );
    process.exit(1);
  }

  // Strip trailing slash for consistent URL joining.
  const cfg: Config = Object.freeze({
    ...result.data,
    baseUrl: result.data.baseUrl.replace(/\/+$/, ''),
  });
  return cfg;
}

function printToStderr(msg: string): void {
  process.stderr.write(msg + '\n');
}
