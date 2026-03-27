import { env } from '@2min.today/config/env';
import pino from 'pino';
import type { Logger } from 'pino';

function shouldUsePretty(): boolean {
  const flag = env.LOG_PRETTY;
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  if (env.NODE_ENV === 'production') return false;
  return env.NODE_ENV === 'development';
}

function createDigestLogger(): Logger {
  const level = env.LOG_LEVEL ?? 'info';
  const baseOptions = { level, timestamp: pino.stdTimeFunctions.isoTime } as const;
  if (!shouldUsePretty()) return pino(baseOptions);
  try {
    const pretty = require('pino-pretty');
    return pino(baseOptions, pretty({ colorize: true, singleLine: false }));
  } catch {
    return pino(baseOptions);
  }
}

let _digestLogger: Logger | undefined;
export const digestLogger: Logger = new Proxy({} as Logger, {
  get(_, key) {
    if (!_digestLogger) _digestLogger = createDigestLogger();
    return _digestLogger[key as keyof Logger];
  },
});

export const silentLogger: Logger = pino({ level: 'silent' });

export function createDigestChild(bindings: { runId: string }): Logger {
  return digestLogger.child({ ...bindings, pipeline: 'digest' });
}
