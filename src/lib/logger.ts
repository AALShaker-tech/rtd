/**
 * Minimal structured logger — isomorphic (server + client), dependency-free.
 *
 * - Emits one JSON line per event in production (ready for log aggregation),
 *   and a readable line in development.
 * - Level-filtered via `LOG_LEVEL` (default: `info` in prod, `debug` otherwise).
 * - `logger.error(...)` also forwards to a pluggable error reporter, which is the
 *   single seam where an error-tracking SDK (e.g. Sentry) is wired in — see
 *   `src/instrumentation.ts`. Nothing here throws, so logging can never break a
 *   request.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogFields {
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  if (env && env in LEVEL_ORDER) return LEVEL_ORDER[env];
  return process.env.NODE_ENV === "production" ? LEVEL_ORDER.info : LEVEL_ORDER.debug;
}

/** Turn an unknown thrown value into a plain, log-friendly object. */
export function serializeError(err: unknown): Record<string, unknown> | undefined {
  if (err == null) return undefined;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}

export interface LogEntry {
  level: LogLevel;
  msg: string;
  time: string;
  fields?: LogFields;
  err?: Record<string, unknown>;
}

/**
 * Pure: build the structured entry (no I/O). A reserved `err` field in `fields`
 * is serialized separately so stack traces are captured consistently.
 */
export function buildEntry(
  level: LogLevel,
  msg: string,
  fields: LogFields | undefined,
  time: string,
): LogEntry {
  const entry: LogEntry = { level, msg, time };
  if (fields) {
    const { err, ...rest } = fields;
    if (err !== undefined) entry.err = serializeError(err);
    if (Object.keys(rest).length > 0) entry.fields = rest;
  }
  return entry;
}

function render(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") return JSON.stringify(entry);
  const parts = [entry.time, entry.level.toUpperCase(), entry.msg];
  if (entry.fields) parts.push(JSON.stringify(entry.fields));
  let line = parts.join(" ");
  if (entry.err) line += `\n${entry.err.stack ?? entry.err.message ?? ""}`;
  return line;
}

export type ErrorReporter = (err: unknown, context?: LogFields) => void;
let reporter: ErrorReporter | null = null;

/** Register an error-tracking sink (called for every `logger.error`). */
export function setErrorReporter(fn: ErrorReporter | null): void {
  reporter = fn;
}

function write(level: LogLevel, msg: string, fields?: LogFields): void {
  if (LEVEL_ORDER[level] < threshold()) return;
  const entry = buildEntry(level, msg, fields, new Date().toISOString());
  const line = render(entry);
  // eslint-disable-next-line no-console -- this module IS the logging sink
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink(line);
  if (level === "error" && reporter) {
    try {
      reporter(fields?.err ?? new Error(msg), entry.fields);
    } catch {
      /* a broken reporter must never break the request */
    }
  }
}

export const logger = {
  debug: (msg: string, fields?: LogFields) => write("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => write("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => write("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => write("error", msg, fields),
};
