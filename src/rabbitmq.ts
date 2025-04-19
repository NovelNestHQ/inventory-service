import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;
if (!RABBITMQ_URL) {
  throw new Error("❌ RABBITMQ_URL is not set!");
}

const QUEUE_NAME = "messages";

export async function pushToQueue(event: object) {
  try {
    const connection = await amqp.connect(RABBITMQ_URL as string);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(event)), {
      persistent: true,
    });

    console.log("📤 Pushed event to queue:", event);

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("❌ Error publishing message:", error);
  }
}
