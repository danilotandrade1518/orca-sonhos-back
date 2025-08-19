export interface LogFields {
  [key: string]: unknown;
}

export interface ILogger {
  info(message: string | LogFields, fields?: LogFields): void;
  error(message: string | Error | LogFields, fields?: LogFields): void;
  warn(message: string | LogFields, fields?: LogFields): void;
  debug(message: string | LogFields, fields?: LogFields): void;
  child?(fields: LogFields): ILogger;
}

function merge(message: string | Error | LogFields, fields?: LogFields) {
  if (typeof message === 'string') return { msg: message, ...(fields || {}) };
  if (message instanceof Error)
    return { msg: message.message, stack: message.stack, ...(fields || {}) };
  return { ...(message as LogFields), ...(fields || {}) };
}

export class ConsoleLogger implements ILogger {
  constructor(private base: LogFields = {}) {}

  private log(
    level: string,
    message: string | Error | LogFields,
    fields?: LogFields,
  ) {
    const entry = {
      level,
      timestamp: new Date().toISOString(),
      ...this.base,
      ...merge(message, fields),
    };
    console.log(JSON.stringify(entry));
  }
  info(message: string | LogFields, fields?: LogFields): void {
    this.log('info', message, fields);
  }
  error(message: string | Error | LogFields, fields?: LogFields): void {
    this.log('error', message, fields);
  }
  warn(message: string | LogFields, fields?: LogFields): void {
    this.log('warn', message, fields);
  }
  debug(message: string | LogFields, fields?: LogFields): void {
    this.log('debug', message, fields);
  }
  child(fields: LogFields): ILogger {
    return new ConsoleLogger({ ...this.base, ...fields });
  }
}

// Root logger; request-scoped loggers should be derived via contextLoggerMiddleware
export const logger: ILogger = new ConsoleLogger();

// Utility to create a child with request correlation (used if middleware not available)
export function withRequestId(requestId: string): ILogger {
  return logger.child ? logger.child({ requestId }) : logger;
}
