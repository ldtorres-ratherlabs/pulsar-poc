import { Logger as WinstonLoggerType, createLogger, format, transports } from 'winston';

const { combine, timestamp, json, errors } = format;

enum LevelName {
  DEBUG = 'debug',
  VERBOSE = 'verbose',
  HTTP = 'http',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

const LEVEL_SEVERITY = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
};

class WinstonLogger {
  private readonly level: string = LevelName.DEBUG;

  private readonly logger: WinstonLoggerType;

  constructor() {
    this.logger = this.configureAndGetLogger();
  }

  public child(options: Record<string, unknown>): WinstonLoggerType {
    return this.logger.child(options);
  }

  public debug(value: string | unknown, metadata?: Record<string, unknown>): void {
    this.logger.debug(value as string, { metadata });
  }

  public verbose(value: string | unknown): void {
    this.logger.verbose(value);
  }

  public http(value: string | unknown): void {
    this.logger.http(value);
  }

  public info(value: string | unknown): void {
    this.logger.info(value);
  }

  public warn(value: string | unknown): void {
    this.logger.warn(value);
  }

  public error(value: string | unknown, metadata?: Record<string, unknown>): void {
    this.logger.error(value as string, { metadata });
  }

  private configureAndGetLogger = (): WinstonLoggerType => {
    return createLogger({
      level: this.level,
      levels: LEVEL_SEVERITY,
      format: combine(timestamp(), errors({ stack: true }), json()),
      transports: [new transports.Console()],
      exitOnError: false,
      handleExceptions: true,
    });
  };
}

const Logger = new WinstonLogger();
export { Logger };
