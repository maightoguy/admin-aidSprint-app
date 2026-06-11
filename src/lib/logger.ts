export const LOGGING_ENABLED = true;

type LoggerMethod = "debug" | "info" | "warn" | "error";

function writeLog(method: LoggerMethod, scope: string, args: unknown[]) {
  if (!LOGGING_ENABLED) {
    return;
  }

  const consoleMethod = console[method] ?? console.log;
  consoleMethod(`[${scope}]`, ...args);
}

export function createLogger(scope: string) {
  return {
    debug: (...args: unknown[]) => writeLog("debug", scope, args),
    info: (...args: unknown[]) => writeLog("info", scope, args),
    warn: (...args: unknown[]) => writeLog("warn", scope, args),
    error: (...args: unknown[]) => writeLog("error", scope, args),
  };
}
