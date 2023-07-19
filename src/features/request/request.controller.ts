import { Body, Controller, Get, Post } from '@nestjs/common';
import { pid } from 'process';
import { Pulsar } from '../../pulsar/pulsar.decorator';
import { TOPIC } from './constant';
import { ReceiveMessage, RequestMessage } from './dto/request.dto';
import { RequestService } from './request.service';

const topicName = TOPIC();
const topicNameDLT = `${topicName}-DLT`;

const consumerName = `consumer-${topicName}-${pid}`;
const consumerNameDLT = `consumer-${topicName}-${pid}-DLT`;

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
    topic: topicName,
    consumerName: consumerName, // Name
    subscriptionType: 'Shared', // 'Exclusive' | 'Shared' | 'KeyShared' | 'Failover'
    subscriptionInitialPosition: 'Earliest', // Process Earliest or Latest
    nAckRedeliverTimeoutMs: 5000, // Time to retry again is its rejected
    deadLetterPolicy: {
      deadLetterTopic: topicNameDLT,
      initialSubscriptionName: consumerNameDLT,
      maxRedeliverCount: 1,
    },
  })
  async requestConsumer(data: ReceiveMessage) {
    return this.requestService.handleMessage(data);
  }

  // This consumer is used to process messages that did not received an ACK
  @Pulsar.Consumer({
    topic: topicNameDLT,
    consumerName: consumerNameDLT, // Name
    subscriptionType: 'Shared', // 'Exclusive' | 'Shared' | 'KeyShared' | 'Failover'
    subscriptionInitialPosition: 'Latest', // Process Earliest or Latest
  })
  async deadLetterConsumer(data: ReceiveMessage) {
    return this.requestService.handleMessage(data, true);
  }
}
