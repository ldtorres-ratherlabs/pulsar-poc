import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { Client, ClientConfig, ProducerConfig, ReaderConfig } from 'pulsar-client';

export class PulsarClient extends ClientProxy {
  private client: Client;
  constructor(private options: ClientConfig) {
    super();
  }

  async connect() {
    if (this.client) return this.client;
    this.client = new Client(this.options);
    return this.client;
  }

  async createProducer(config: ProducerConfig) {
    return this.client.createProducer(config);
  }

  async createReader(config: ReaderConfig) {
    return this.client.createReader(config);
  }

  async close() {
    try {
      if (this.client) await this.client.close();
    } catch (error) {
      console.log(error);
    }
  }

  protected publish(
    packet: ReadPacket<unknown>,
    callback: (packet: WritePacket<unknown>) => void,
  ): () => void {
    this.dispatchEvent(packet).then(() => callback({}));
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }

  protected async dispatchEvent<T = unknown>(packet: ReadPacket<unknown>): Promise<T> {
    console.log('event to dispatch: ', packet);
    const producer = await this.client.createProducer({
      topic: packet.pattern,
    });
    await producer.send({
      data: Buffer.from(packet.data),
    });
    await producer.close();
    return;
  }
}