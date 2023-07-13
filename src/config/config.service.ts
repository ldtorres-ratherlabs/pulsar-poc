import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvConfig } from './base.config';

type DeepPaths<T extends object, Acc extends string = '', Res = never> =
  | {
      [K in keyof T]: T[K] extends object
        ? DeepPaths<T[K], `${Acc}${K & string}.`, `${Acc}${K & string}`>
        : `${Acc}${K & string}`;
    }[keyof T]
  | Res;

type PathValue<T, P extends string> = P extends `${infer K}.${infer R}`
  ? K extends keyof T
    ? PathValue<T[K], R>
    : never
  : P extends keyof T
  ? T[P]
  : never;

@Injectable()
export class ConfigService extends NestConfigService<EnvConfig> {
  get<T extends DeepPaths<EnvConfig>>(path: T): PathValue<EnvConfig, T> {
    return super.get(path, { infer: true });
  }
}
