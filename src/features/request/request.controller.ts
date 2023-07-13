import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import * as moment from 'moment';
import { Consumer, Message } from 'pulsar-client';
import { v4 } from 'uuid';
import { PulsarClient } from '../../pulsar/pulsar.client';
import { Pulsar } from '../../pulsar/pulsar.decorator';

@Controller('requests')
export class RequestsController {
  private requests = [];

  constructor(@Inject('PULSAR_CLIENT') private readonly pulsarClient: PulsarClient) {}

  @Get()
  findAll() {
    return this.requests;
  }

  @Post()
  async createRequest(
    @Body()
    {
      value,
      partitionKey = 'requests',
      deliverAfter = 1,
      times = 1,
      ...properties
    }: {
      value: string;
      partitionKey: string;
      deliverAfter: number;
      times: number;
      type: string;
      throwErr: string;
    },
  ) {
    try {
      const client = await this.pulsarClient.connect();

      // Create new producer
      const producer = await client.createProducer({
        topic: 'persistent://public/default/my-topic',
        producerName: 'Request Producer',
      });

      const response = [];

      // Send message
      // Docs: https://pulsar.apache.org/docs/next/client-libraries-producers/#publish-messages
      for (let i = 0; i < times; i++) {
        const deliverTime = moment().add(deliverAfter, 'seconds').toDate().getTime();
        const customId = v4();

        const payload = {
          customId,
          value,
          partitionKey,
          deliverAfter,
          times,
          ...properties,
          status: 'PENDING',
        };

        this.requests.push(payload);

        await producer.send({
          data: Buffer.from(value),
          eventTimestamp: Date.now(),
          sequenceId: this.requests.length + 1,
          properties: { ...properties, customId },
          partitionKey,
          deliverAt: deliverTime,
          // deliverAfter, not working
          disableReplication: false,
        });

        response.push(payload);
      }

      await producer.close();

      // Return msg
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  @Pulsar.Consumer({
    topic: 'persistent://public/default/my-topic',
    // topics: [ 'persistent://public/default/my-topic' ], Subscribe to many topics
    consumerName: 'Testing', // Name
    // subscriptionType: "Shared", // 'Exclusive' | 'Shared' | 'KeyShared' | 'Failover'
    subscriptionInitialPosition: 'Latest', // Process Earliest or Latest
    // If we set earliest it will get all messages since the begining
    // Retry config
    ackTimeoutMs: 10000, // Timeout to return the ack
    // nAckRedeliverTimeoutMs: 5000, // Time to wait until retry a message
  })
  async requestConsumer({ msg, consumer }: { msg: Message; consumer: Consumer }) {
    const msgId = msg.getMessageId().toString();
    const addittionalProperties = msg.getProperties();

    console.log({
      eventTime: msg.getEventTimestamp(),
      messageId: msgId,
      partitionKey: msg.getPartitionKey(),
      publishTime: msg.getPublishTimestamp(),
      addittionalProperties,
      data: msg.getData().toString(),
    });

    const request = this.requests.find((el) => el.customId === addittionalProperties['customId']);

    // for testing non ack messages
    if (addittionalProperties['throwErr']) {
      consumer.negativeAcknowledge(msg);

      throw new Error(addittionalProperties['throwErr']);
    }

    if (request) request.status = 'COMPLETED';
    await consumer.acknowledge(msg);
  }
}
