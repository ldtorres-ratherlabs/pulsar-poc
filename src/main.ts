import { pulsarConfig } from '@Config/pulsar/pulsar.initializer';
import { NestFactory } from '@nestjs/core';
import { CustomStrategy } from '@nestjs/microservices';
import { SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { swaggerConfig } from './config/swagger/swagger.initializer';
import { SentryInitialize } from './sentry.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(ConfigService);

  app.connectMicroservice<CustomStrategy>(pulsarConfig(config));

  await app.startAllMicroservices();

  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, swaggerConfig));
  SentryInitialize.execute();

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  const port = config.get('port');
  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}/`);
}

bootstrap();
