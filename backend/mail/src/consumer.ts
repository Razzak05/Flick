import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const rabbitUrl = process.env.RABBITMQ_URL!;
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASS;

if (!smtpUser || !smtpPassword) {
  throw new Error("Missing SMTP_USER or SMTP_PASS environment variable");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});

export const startSentOtpConsumer = async () => {
  try {
    await transporter.verify();

    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();
    channel.prefetch(1);

    const queueName = "send-otp";
    await channel.assertQueue(queueName, {
      durable: true,
    });

    console.log("Mail service consumer started, listening for otp emails");
    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const { to, subject, body } = JSON.parse(msg.content.toString());
          await transporter.sendMail({
            from: process.env.MAIL_FROM || smtpUser,
            to,
            subject,
            text: body,
          });

          console.log(`OTP mail sent to ${to}`);
          channel.ack(msg);
        } catch (error) {
          console.log("Failed to send otp: ", error);
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (error) {
    console.log("Failed to start rabbitmq consumer", error);
  }
};
