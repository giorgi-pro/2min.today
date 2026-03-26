import pino from 'pino';
import type { Logger } from 'pino';

function shouldUsePretty(): boolean {
  const flag = process.env.LOG_PRETTY;
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local';
}

const level = process.env.LOG_LEVEL ?? 'info';

const baseOptions = {
  level,
  timestamp: pino.stdTimeFunctions.isoTime,
} as const;

export const digestLogger: Logger = shouldUsePretty()
  ? pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, singleLine: false },
      },
    })
  : pino(baseOptions);

export const silentLogger: Logger = pino({ level: 'silent' });

export function createDigestChild(bindings: { runId: string }): Logger {
  return digestLogger.child({ ...bindings, pipeline: 'digest' });
}
