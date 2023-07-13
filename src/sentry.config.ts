import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';

export class SentryInitialize {
  readonly enabled: boolean;
  readonly dsn: string;
  readonly environment: string;
  readonly appName: string;
  private static instance: SentryInitialize;
  constructor() {
    // These environment variables are not required in config because they are needed when initializing the application.
    this.enabled = process.env.SENTRY_ENABLED === 'true';
    this.dsn = process.env.SENTRY_DSN;
    this.environment = process.env.NODE_ENV;
    this.appName = process.env.SENTRY_APP_NAME;
  }
  private static getInstance() {
    if (!SentryInitialize.instance) {
      SentryInitialize.instance = new SentryInitialize();
    }
    return SentryInitialize.instance;
  }
  static execute() {
    const instance = this.getInstance();
    if (!instance.enabled) return;
    Sentry.init({
      dsn: instance.dsn,
      tracesSampleRate: 1.0,
      environment: instance.environment,
      enabled: instance.enabled,
      serverName: instance.appName,
      integrations: [new RewriteFrames({ root: __dirname })],
    });
  }
}
