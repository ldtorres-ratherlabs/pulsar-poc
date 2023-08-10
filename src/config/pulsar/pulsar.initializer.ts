import { CustomStrategy } from '@nestjs/microservices';
import { AuthenticationToken, ClientConfig } from 'pulsar-client';
import { PulsarServer } from '../../pulsar/pulsar.server';
import { ConfigService } from '../config.service';

export const pulsarConfig = (config: ConfigService) => {
  const { authParams, ...rest } = config.get('pulsar');

  const auth: ClientConfig['authentication'] | null = authParams
    ? new AuthenticationToken({
        token: authParams,
      })
    : null;

  const params: ClientConfig = {
    authentication: auth,
    ...rest,
  };

  return {
    strategy: new PulsarServer(params),
  } satisfies CustomStrategy;
};
