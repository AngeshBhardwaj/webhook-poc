import { CloudEvent } from 'cloudevents';
import * as amqp from 'amqplib';
import { sendWebhook } from '../webhooks/webhook.service';

const queue = 'events';
let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

async function getAmqpChannel(): Promise<amqp.Channel> {
  if (!connection) {
    connection = await amqp.connect({
      protocol: 'amqp',
      hostname: 'localhost',
      port: 5672,
      username: 'guest',
      password: 'guest',
    });
    console.log('Connection created to RabbitMQ');
  }
  if (!channel) {
    channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
    console.log('Channel created to RabbitMQ');
  }
  return channel;
}

export async function sendToQueue(event: CloudEvent<unknown>) {
  console.log(`Sending event to queue: ${JSON.stringify(event)}`);
  const mqChannel = await getAmqpChannel();
  mqChannel.sendToQueue(queue, Buffer.from(JSON.stringify(event)));

  // Send webhook
  await sendWebhook(event);
}