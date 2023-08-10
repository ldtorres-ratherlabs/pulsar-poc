import { Logger } from '@nestjs/common';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { Client, ClientConfig, Consumer } from 'pulsar-client';

export class PulsarServer extends Server implements CustomTransportStrategy {
  private consumers = new Map<string, Consumer>();
  private client: Client;

  constructor(private options: ClientConfig) {
    super();
  }

  /**
   * This method is triggered when you run "app.listen()".
   */
  async listen(callback: (...args: unknown[]) => void) {
    this.client = new Client(this.options);
    for (const [key, value] of this.messageHandlers.entries()) {
      if (value?.extras?.type !== 'pulsar') continue;
      if (!value.isEventHandler) continue;
      const payload = JSON.parse(key);
      const consumer = await this.client.subscribe({
        ...payload,
        listener: async (msg, consumer) => {
          const msgId = msg.getMessageId().toString();

          Logger.log(
            `Pulsar Server - Message received on [Consumer Name: ${
              payload.consumerName || '-'
            }, Topic: ${msg.getTopicName()}]: Msg Id: ${msgId}`,
          );

          await value({ msg, consumer });
        },
      });

      if (consumer.isConnected) {
        Logger.log(
          `Pulsar Server - Connected To Topic [${
            payload.topic || payload.topics
          }] - [Consumer Name: ${payload.consumerName || '-'}`,
        );
      }

      this.consumers.set(payload.consumerName, consumer);
    }

    callback();
  }

  /**
   * This method is triggered on application shutdown.
   */
  async close() {
    Logger.log('Pulsar Server Close Consumers');

    const activeConsumers = Array.from(this.consumers.values());

    for (const consumer of activeConsumers) {
      if (consumer.isConnected()) await consumer.close();
    }

    await this.client.close();
  }
}
