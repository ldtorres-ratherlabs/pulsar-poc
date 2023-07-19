import { configDotenv } from 'dotenv';

configDotenv();

import moment from 'moment';

const topicName = process.env.PULSAR_TOPIC_NAME || 'persistent://public/default/testing-2';
const topicNameDLT = `${topicName}-DLT`;

const consumerName = `consumer-${topicName}`;
const consumerNameDLT = `consumer-${topicName}-DLT`;

const PulsarConfig = {
    serviceUrl: process.env.PULSAR_SERVICE_URL || 'pulsar://localhost:6650',
    authentication: undefined,
    useTls: false
}

interface RequestMessage {
    value: string;
    partitionKey?: string;
    deliverAfter?: number;
    times?: number;
    type?: string;
    reject?: boolean;
    customId?: string;
    status?: 'PENDING' | 'COMPLETED';
}

interface ReceiveMessage {
    msg: Message;
    consumer: Consumer;
}

import { Client, ClientConfig, Consumer, ConsumerConfig, Message, ProducerConfig, ReaderConfig } from 'pulsar-client';

export class PulsarClient {
    private client: Client;
    public consumers: Consumer[] = []

    constructor(private options: ClientConfig) { 
        this.client = new Client(this.options);
    }

    async connect() {
        console.log('Pulsar Client Initialized');

        if (this.client) return this.client;

        this.client = new Client(this.options);
        return this.client;
    }

    async createConsumer(config: ConsumerConfig) {
        console.log(`Pulsar Consumer ${config.consumerName} started!`);

        const consumer = await this.client.subscribe(config);

        this.consumers.push(consumer);

        let nextMessage: Message | null = null;

        do {
            nextMessage = await consumer.receive();
            await this.handleMessage({ msg: nextMessage, consumer })
        } while(nextMessage)

        console.log(`Pulsar Consumer ${config.consumerName} closed!`);
        
        return consumer;
    }

    async createProducer(config: ProducerConfig) {
        console.log('Create Pulsar Producer');
        return this.client.createProducer(config);
    }

    async createReader(config: ReaderConfig) {
        console.log('Create Pulsar Reader');
        return this.client.createReader(config);
    }

    async handleMessage({ msg, consumer }: ReceiveMessage, deadLetter = false) {
        const msgId = msg.getMessageId().toString();
        const properties = msg.getProperties();
        const data = JSON.parse(msg.getData().toString());

        console.log(`Message received - ID: ${msgId} - retry: ${msg.getRedeliveryCount()}`);

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

        // for testing non ack messages
        //consumer.negativeAcknowledge(msg);

        await consumer.acknowledge(msg);
    }

    async sendMessages({
        value,
        partitionKey,
        deliverAfter,
        times = 1,
        ...properties
    }: RequestMessage) {
        try {
            const client = await this.connect();

            // Create new producer
            // Options reference: https://pulsar.apache.org/reference/#/3.0.x/client/client-configuration-producer
            const producer = await client.createProducer({
                topic: topicName,
                producerName: `producer-${topicName}`,
                initialSequenceId: 1,
                sendTimeoutMs: 30000,
                blockIfQueueFull: true, // to avoid errors when we send the message,
                properties: {
                    schemaVersion: 'v1',
                },
            })

            const response: any = [];

            // Send message
            // Docs: https://pulsar.apache.org/docs/next/client-libraries-producers/#publish-messages

            for (let i = 0; i < times; i++) {
                const deliverTime = moment().add(deliverAfter, 'seconds').toDate().getTime();

                const payload: RequestMessage = {
                    value,
                    partitionKey,
                    deliverAfter,
                    times,
                    ...properties
                };

                const res = await producer.send({
                    data: Buffer.from(JSON.stringify(payload)),
                    eventTimestamp: Date.now(),
                    properties: { schemaVersion: 'v1' },
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

                console.log(`Message Sent - ID: ${res.toString()}`);
            }

            await producer.flush();
            await producer.close();

            // Return msg
            return response;
        } catch (error) {
            console.log(error);
        }
    }

    async close() {
        try {
            console.log('Pulsar Client Close');
            if (this.client) await this.client.close();
        } catch (error) {
            console.log(error);
        }
    }
}

const init = async () => {
    const client = new PulsarClient(PulsarConfig);

    // Main consumer
    client.createConsumer({
        subscription: "MainSubcription",
        topic: topicName,
        consumerName: consumerName, // Name
        subscriptionType: 'Shared', // 'Exclusive' | 'Shared' | 'KeyShared' | 'Failover'
        subscriptionInitialPosition: 'Earliest', // Process Earliest or Latest
    
        // nAckRedeliverTimeoutMs: 5000, // Time to retry again is its rejected
        /* deadLetterPolicy: {
          deadLetterTopic: topicNameDLT,
          initialSubscriptionName: consumerNameDLT,
          maxRedeliverCount: 1,
        }, */
    });
    
    // Dead letter consumer
    client.createConsumer({
        subscription: "DeadLetterSubcription",
        topic: topicNameDLT,
        consumerName: consumerNameDLT, // Name
        subscriptionType: 'Shared', // 'Exclusive' | 'Shared' | 'KeyShared' | 'Failover'
        subscriptionInitialPosition: 'Latest', // Process Earliest or Latest
    });
    
    // 
    /* await client.sendMessages({
        "value": "Testing Message", // Value
        // "partitionKey": "test", // Group messages by a key
        "deliverAfter": 0, // Delay seconds
        "times": 1, // Number of messages
        // Extra params
        "type": "Hi"
    }); */


    const closeConsumers = async () => {
        for (let i = 0; i < client.consumers.length; i++) {
            const consumer = client.consumers[i];
            if (consumer.isConnected()) await consumer.close();   
        }
        
        console.log(`Pulsar End process!`);
    }

    process.on('SIGINT', closeConsumers);  // CTRL+C
    process.on('SIGQUIT', closeConsumers); // Keyboard quit
    process.on('SIGTERM', closeConsumers); // `kill` command
}

init()