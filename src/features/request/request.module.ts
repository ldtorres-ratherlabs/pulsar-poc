import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { PulsarClient } from '../../pulsar/pulsar.client';
import { RequestsController } from './request.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PULSAR_CLIENT',
        customClass: PulsarClient,
        options: { serviceUrl: 'pulsar://localhost:6650' },
      },
    ]),
  ],
  controllers: [RequestsController],
})
export class RequestModule {}
