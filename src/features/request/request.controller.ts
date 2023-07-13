import { Body, Controller, Get, Post } from '@nestjs/common';
import { Pulsar } from '../../pulsar/pulsar.decorator';
import { TOPIC } from './constant';
import { ReceiveMessage, RequestMessage } from './dto/request.dto';
import { RequestService } from './request.service';

@Controller('requests')
export class RequestsController {
  constructor(private requestService: RequestService) {}

  @Get()
  findAll() {
    return this.requestService.findAll();
  }

  @Post()
  async createRequest(@Body() body: RequestMessage) {
    return this.requestService.sendMessages(body);
  }

  // Options reference: https://pulsar.apache.org/reference/#/3.0.x/client/client-configuration-consumer
  @Pulsar.Consumer({
    topic: TOPIC(),
    consumerName: 'Testing', // Name
    subscriptionType: 'Shared', // 'Exclusive' | 'Shared' | 'KeyShared' | 'Failover'
    subscriptionInitialPosition: 'Latest', // Process Earliest or Latest
  })
  async requestConsumer(data: ReceiveMessage) {
    return this.requestService.handleMessage(data);
  }
}
