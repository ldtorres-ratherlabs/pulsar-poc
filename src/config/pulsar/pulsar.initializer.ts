import { CustomStrategy } from '@nestjs/microservices';
import { PulsarServer } from '../../pulsar/pulsar.server';
import { ConfigService } from '../config.service';

export const pulsarConfig = (config: ConfigService) => {
  return {
    strategy: new PulsarServer(config.get('pulsar')),
  } satisfies CustomStrategy;
};
