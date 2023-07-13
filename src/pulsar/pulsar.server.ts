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

          console.log(
            `Message received on [Consumer Name: ${
              payload.consumerName || '-'
            }, Topic: ${msg.getTopicName()}]: Msg Id: ${msgId}`,
          );
          await value({ msg, consumer });
        },
      });

      this.consumers.set(payload.consumerName, consumer);
    }

    callback();
  }

  /**
   * This method is triggered on application shutdown.
   */
  async close() {
    this.consumers.forEach(async (consumer, key) => {
      await consumer.unsubscribe();
      console.log('Consumer closed: ' + key);
    });

    await this.client.close();
  }
}
