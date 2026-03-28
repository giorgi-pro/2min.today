import { env } from "@2min.today/config/env";
import type { Logger } from "pino";
import pino from "pino";
import pinoPretty from "pino-pretty";

function shouldUsePretty(): boolean {
  const flag = env.LOG_PRETTY;
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;
  if (env.NODE_ENV === "production") return false;
  return env.NODE_ENV === "development";
}

function createDigestLogger(): Logger {
  const level = env.LOG_LEVEL ?? "info";
  const baseOptions = {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
  } as const;
  if (!shouldUsePretty()) return pino(baseOptions);
  return pino(
    baseOptions,
    pinoPretty({ colorize: true, singleLine: false }),
  );
}

let _logger: Logger | undefined;
export const logger: Logger = new Proxy({} as Logger, {
  get(_, key) {
    if (!_logger) _logger = createDigestLogger();
    return _logger[key as keyof Logger];
  },
});

export const silentLogger: Logger = pino({ level: "silent" });

export function createDigestChild(bindings: { runId: string }): Logger {
  return logger.child({ ...bindings, pipeline: "digest" });
}
