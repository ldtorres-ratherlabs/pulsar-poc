import { Logger } from '@Common//logger';
import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { pid } from 'process';
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
        producerName: `producer-${TOPIC()}-${pid}`,
        initialSequenceId: 1,
        sendTimeoutMs: 1000,
        blockIfQueueFull: true, // to avoid errors when we send the message,
        properties: {
          schemaVersion: 'v1',
        },
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

        const res = await producer.send({
          data: Buffer.from(JSON.stringify(payload)),
          eventTimestamp: Date.now(),
          properties: { customId, schemaVersion: 'v1' },
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

        Logger.info(`Message Sent - ID: ${res.toString()}`);

        response.push(payload);
      }

      await producer.flush();
      await producer.close();

      // Return msg
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async handleMessage({ msg, consumer }: ReceiveMessage, DLT = false) {
    const msgId = msg.getMessageId().toString();
    const properties = msg.getProperties();
    const data = JSON.parse(msg.getData().toString());

    Logger.info(`Message received - retry: ${msg.getRedeliveryCount()}`);

    console.log({
      topic: msg.getTopicName(),
      eventTime: msg.getEventTimestamp(),
      messageId: msgId,
      partitionKey: msg.getPartitionKey(),
      publishTime: msg.getPublishTimestamp(),
      properties,
      redeliveryCount: msg.getRedeliveryCount(),
      data,
    });

    const request = this.requests.find((el) => el.customId === properties['customId']);
    if (request) request.status = 'COMPLETED';

    // for testing non ack messages
    if (data.reject && !DLT) {
      consumer.negativeAcknowledge(msg);
    } else {
      await consumer.acknowledge(msg);

      Logger.info(`Message received and ACK - ID: ${msgId}`);
    }
  }

  findAll() {
    return this.requests;
  }
}
