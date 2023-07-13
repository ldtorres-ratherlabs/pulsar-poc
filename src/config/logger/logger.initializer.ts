import { forwardRef } from '@nestjs/common';
import { LoggerModuleAsyncParams } from 'nestjs-pino';
import { ConfigModule } from '../config.module';
import { ConfigService } from '../config.service';

export const loggerConfig = {
  imports: [forwardRef(() => ConfigModule)],
  useFactory: (config: ConfigService) => {
    return {
      pinoHttp: {
        transport: config.get('logger.pretty') === 'pretty' ? { target: 'pino-pretty' } : undefined,
      },
    };
  },
  inject: [ConfigService],
} satisfies LoggerModuleAsyncParams;
