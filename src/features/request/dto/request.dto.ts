import { Consumer, Message } from 'pulsar-client';

export interface RequestMessage {
  value: string;
  partitionKey: string;
  deliverAfter: number;
  times: number;
  type: string;
  reject: boolean;
  customId: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface ReceiveMessage {
  msg: Message;
  consumer: Consumer;
}
