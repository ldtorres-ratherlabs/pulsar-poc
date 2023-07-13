import { Module } from '@nestjs/common';

import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { loggerConfig } from './config/logger/logger.initializer';
import { RequestModule } from './features/request/request.module';

@Module({
  imports: [ConfigModule, LoggerModule.forRootAsync(loggerConfig), RequestModule],
  controllers: [AppController],
})
export class AppModule {}
