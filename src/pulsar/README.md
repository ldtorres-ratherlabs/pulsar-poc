# Pulsar client

## Connect microservice

We've develop a NestJS custom transport strategy to consume messages from Pulsar.
To use it, you need to add the `PulsarServer` as a transport strategy.

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { PulsarServer } from '@pulsar/nestjs-pulsar';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // add this Custom Strategy
  app.connectMicroservice<CustomStrategy>({
    strategy: new PulsarServer({ url: 'pulsar://localhost:6650' }),
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}
```

## Registering a new consumer

To register a new consumer, you need to use the `@PulsarConsumer` decorator.

```typescript
import { Controller } from '@nestjs/common';
import { PulsarConsumer } from '@pulsar/nestjs-pulsar';

@Controller('example')
export class ExampleController {
  @PulsarConsumer({ topic: 'my-topic' /*, subscription: 'myConsumer' */ })
  public async myConsumer(message: Message) {
    console.log(message);
  }
}
```

Note that the `subscription` property is optional, despide being required node client.
If not provided, the method name will be used as the subscription name.
