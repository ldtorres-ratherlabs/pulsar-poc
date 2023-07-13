import { DocumentBuilder } from '@nestjs/swagger';
import { version } from '../../../package.json';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('NestJS API')
  .setDescription('The NestJS API description')
  .setVersion(version)
  .build();
