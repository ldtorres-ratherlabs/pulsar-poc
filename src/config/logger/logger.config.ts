import { IsEnum } from 'class-validator';

enum LoggerType {
  Pretty = 'pretty',
  Json = 'json',
}

export class LoggerConfig {
  @IsEnum(LoggerType)
  pretty = (process.env.LOGGER_TYPE as LoggerType) || LoggerType.Json;
}
