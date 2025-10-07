import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const rabbitUrl = process.env.RABBITMQ_URL!;

export const startSentOtpConsumer = async () => {
  try {
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();

    const queueName = "send-otp";
    await channel.assertQueue(queueName, {
      durable: true,
    });

    console.log("Mail service consumer started, listening for otp emails");
    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const { to, subject, body } = JSON.parse(msg.content.toString());
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            auth: {
              user: process.env.USER,
              pass: process.env.PASSWORD,
            },
          });

          await transporter.sendMail({
            from: "Flick",
            to,
            subject,
            text: body,
          });

          console.log(`OTP mail sent to ${to}`);
          channel.ack(msg);
        } catch (error) {
          console.log("Failed to send otp: ", error);
        }
      }
    });
  } catch (error) {
    console.log("Failed to start rabbitmq consumer", error);
  }
};
