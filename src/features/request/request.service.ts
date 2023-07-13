import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { PulsarClient } from 'src/pulsar/pulsar.client';
import { v4 } from 'uuid';
import { TOPIC } from './constant';
import { ReceiveMessage, RequestMessage } from './dto/request.dto';

@Injectable()
export class RequestService {
  private readonly requests: RequestMessage[] = [];

  constructor(@Inject('PULSAR_CLIENT') private readonly pulsarClient: PulsarClient) {}

  async sendMessages({
    value,
    partitionKey,
    deliverAfter,
    times = 1,
    ...properties
  }: RequestMessage) {
    try {
      const client = await this.pulsarClient.connect();

      // Create new producer
      // Options reference: https://pulsar.apache.org/reference/#/3.0.x/client/client-configuration-producer
      const producer = await client.createProducer({
        topic: TOPIC(),
        producerName: 'Request Producer',
      });

      const response = [];

      // Send message
      // Docs: https://pulsar.apache.org/docs/next/client-libraries-producers/#publish-messages
      for (let i = 0; i < times; i++) {
        const deliverTime = moment().add(deliverAfter, 'seconds').toDate().getTime();
        const customId = v4();

        const payload: RequestMessage = {
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
          data: Buffer.from(JSON.stringify(payload)),
          eventTimestamp: Date.now(),
          // sequenceId: this.requests.length + 1, // This id could be an id from the database it can be used to avoid mesagge duplication
          properties: { customId },
          ...(partitionKey
            ? {
                partitionKey,
              }
            : {}), // This can be use to send the message to an specific partition key
          ...(deliverAfter
            ? {
                deliverAt: deliverTime,
                deliverAfter,
              }
            : {}),
          disableReplication: false, // This can be used to avoid replication on other clusters
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

  async handleMessage({ msg, consumer }: ReceiveMessage) {
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

  findAll() {
    return this.requests;
  }
}
