# Pulsar Research PoC

## Pulsar concepts

### [Concepts](https://pulsar.apache.org/docs/3.0.x/reference-terminology)

Main terminology for pulsar

### [Geo replication](https://pulsar.apache.org/docs/3.0.x/concepts-replication/)

This will allow us to understand how messages are replicated on Pulsar brokers and how they can be backed up in the event of a broker restart or shutdown.

### [Messaging Flow](https://pulsar.apache.org/docs/3.0.x/concepts-messaging/)

How messaging flow flow works

Limitation: 

As we know pulsar messages are byte arrays that we send to the consumer but also we can use schemas to set types of those byte arrays.

Right now it is not currently available for NodeJs implementation

More info: https://pulsar.apache.org/docs/next/schema-overview/

### [Pultar Consumer Docs](https://pulsar.apache.org/docs/next/concepts-messaging/#subscription-types)

Understanding the type of consumer is crucial when determining the appropriate server architecture, as it directly impacts how messages are handled.

**Consumer type:**

- Exclusive: The first consumer registered to the topic will handle all messages in the same order as they were sent.
- Failover: Multiple consumers can attach to the same subscription, yet only the first consumer is active, and others are standby. When the active consumer is disconnected, messages will be dispatched to one of standby consumers, and the standby consumer then becomes the active consumer.
- Shared: In Shared subscription type, multiple consumers can attach to the same subscription and messages are delivered in a round-robin distribution (A round-robin distributed table distributes table rows evenly across all distributions. The assignment of rows to distributions is random.) across consumers.
    - This option is great to have many instances of an api but it cannot provide an ordering guarantee.   
- Key shared: Just like in the Shared subscription, all consumers in the Key_Shared subscription type can attach to the same subscription. But the Key_Shared subscription type is different from the Shared subscription. In the Key_Shared subscription type, messages with the same key are delivered to only one consumer in order. The possible distribution of messages between different consumers (by default we do not know in advance which keys will be assigned to a consumer, but a key will only be assigned to a consumer at the same time).

**Consumer Topics Type:**

We can configure witch type of topics to subscribe using the **Subscription Topics Mode** when we init the consumer

Also we can subscribe to many topics if we want.

**Consumer Batch type**

We can configure the consumer to receive many messages on each call

- We need to define the amount of messages to wait and the max amount of data to receive

More info: https://pulsar.apache.org/docs/next/concepts-messaging/#batching

**Timeout**

We can set a specific time to wait beetwen each call

**Acknowledge messages**

The consumer sends an acknowledgment request to the broker after it consumes a message successfully. Then, this consumed message will be permanently stored, and deleted only after all the subscriptions have acknowledged it.

More info (https://pulsar.apache.org/docs/next/concepts-messaging/#acknowledgment)

**Negative acknowledgment redelivery backoff**

The RedeliveryBackoff introduces a redelivery backoff mechanism. You can achieve redelivery with different delays by setting the redelivery count of messages.

More info: https://pulsar.apache.org/docs/next/client-libraries-consumers/#acknowledgment-timeout-redelivery-backoff

## How pulsar works (Medium)

[Pulsar introduction](https://medium.com/streamthoughts/introduction-to-apache-pulsar-concepts-architecture-java-clients-71f1a30b75d6)


## Run pulsar standalone with docker

```
docker run -it -p 6650:6650 -p 8080:8080 --mount source=pulsardata,target=/pulsar/data --mount source=pulsarconf,target=/pulsar/conf apachepulsar/pulsar:3.0.0 bin/pulsar standalone
```

## Pulsar Admin Docs 

To interacte over pulsar server, create topics, etc

[Pulsa Admin Docs](https://pulsar.apache.org/docs/2.10.x/pulsar-admin/)

#### Create topic

You will need to attach to the pulsar console on docker

#### Persistent topic
```
bin/pulsar-admin topics create persistent://public/default/my-topic
```
#### Write and read messages

##### Write
```
bin/pulsar-client produce my-topic --messages 'Hello Pulsar!'
bin/pulsar-client produce my-topic --messages "$(seq -s, -f 'Message NO.%g' 1 10)"
```
##### Read

```
bin/pulsar-client consume my-topic -s 'my-subscription' -p Earliest -n 0
```

## Use Api to create a read messages

```
npm i 
npm run start:dev
```

## Use postman collection

[Postman collection](./Pulsar_Test.postman_collection.json)

## Create other instances of the api

You can check how the instances process the messages


