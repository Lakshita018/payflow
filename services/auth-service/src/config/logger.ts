import pino from 'pino';
import { config } from './env';

// ---------------------------------------------------------------------------
// Centralised logger instance.
// All modules import this singleton — never instantiate pino elsewhere.
// In production, logs are emitted as newline-delimited JSON (structured).
// In development, pino-pretty can be piped in: `npm run dev | pino-pretty`
// ---------------------------------------------------------------------------
export const logger = pino({
  name: config.SERVICE_NAME,
  level: config.LOG_LEVEL,
  // Rename pino's default "msg" field to "message" for log-aggregator compat.
  messageKey: 'message',
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact sensitive fields anywhere in the log object — belt-and-suspenders
  // on top of the rule "never pass raw secrets to logger calls".
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.password_hash',
      '*.refresh_token',
      '*.refresh_token_hash',
      '*.api_secret',
      '*.api_secret_hash',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    // Keep request serialisation lean — no body dumping.
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

export type Logger = typeof logger;
