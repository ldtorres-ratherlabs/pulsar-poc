import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { PulsarClient } from '../../pulsar/pulsar.client';
import { RequestsController } from './request.controller';
import { RequestService } from './request.service';

@Module({
  providers: [
    {
      provide: 'PULSAR_CLIENT',
      useFactory: (configService: ConfigService) => {
        const options = configService.get('pulsar');
        return ClientProxyFactory.create({
          customClass: PulsarClient,
          options,
        });
      },
      inject: [ConfigService],
    },
    RequestService,
  ],
  controllers: [RequestsController],
})
export class RequestModule {}
