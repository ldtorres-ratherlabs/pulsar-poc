import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { config } from 'dotenv';
import { EnvConfig } from './base.config';
import { ConfigService } from './config.service';

config();

const validate = (config: typeof process.env) => {
  process.env = { ...process.env, ...config };
  const configService = new EnvConfig();
  const validatedConfig = plainToInstance(EnvConfig, configService, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) throw new Error(errors.toString());

  return validatedConfig;
};

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: ['.env', `.env.${process.env.NODE_ENV}`],
      validate,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
