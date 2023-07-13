import { Type } from 'class-transformer';
import { IsEnum, IsInt, ValidateNested } from 'class-validator';
import { LoggerConfig } from './logger/logger.config';
import { PulsarConfig } from './pulsar/pulsar.config';

export enum NodeEnv {
  Development = 'develop',
  Production = 'prod',
  Test = 'test',
  Local = 'local',
}

export class EnvConfig {
  @IsEnum(NodeEnv)
  env = process.env.NODE_ENV as NodeEnv;

  @IsInt()
  port = parseInt(process.env.PORT, 10) || 3000;

  @Type(() => LoggerConfig)
  @ValidateNested()
  logger = new LoggerConfig();

  @Type(() => PulsarConfig)
  @ValidateNested()
  pulsar = new PulsarConfig();
}
