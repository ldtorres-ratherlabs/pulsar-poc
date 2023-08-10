import { EventPattern } from '@nestjs/microservices';
import { ConsumerConfig } from 'pulsar-client';

interface ConsumerParams extends Omit<ConsumerConfig, 'subscription'> {
  subscription: string;
}

const pulsar = Symbol('pulsar');

const PulsarConsumer = (options: ConsumerParams) => {
  return (target: unknown, key: string, descriptor: PropertyDescriptor) => {
    EventPattern(JSON.stringify(options), pulsar, { type: 'pulsar' })(target, key, descriptor);
  };
};

export const Pulsar = {
  Consumer: PulsarConsumer,
};
