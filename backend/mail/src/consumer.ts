import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const rabbitUrl = process.env.RABBITMQ_URL!;
// Port 587 uses STARTTLS and is generally available on hosted platforms.
// Port 465 (implicit TLS) commonly times out on platform egress networks.
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASS;
const resendApiKey = process.env.RESEND_API_KEY;
const mailFrom = process.env.MAIL_FROM || smtpUser;

if (!resendApiKey && (!smtpUser || !smtpPassword)) {
  throw new Error(
    "Configure RESEND_API_KEY or both SMTP_USER and SMTP_PASS environment variables"
  );
}

if (!mailFrom) {
  throw new Error("Missing MAIL_FROM (or SMTP_USER) environment variable");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpPort === 465,
  requireTLS: smtpPort === 587,
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 30_000,
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});

const sendOtpEmail = async ({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) => {
  if (resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailFrom,
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Resend API error (${response.status}): ${await response.text()}`
      );
    }

    return;
  }

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    text: body,
  });
};

export const startSentOtpConsumer = async () => {
  try {
    if (resendApiKey) {
      console.log("Using Resend email API");
    } else {
      try {
        await transporter.verify();
        console.log("SMTP connection verified");
      } catch (error) {
        console.error("Failed to connect to SMTP server", error);
        throw error;
      }
    }

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
          await sendOtpEmail({ to, subject, body });

          console.log(`OTP mail sent to ${to}`);
          channel.ack(msg);
        } catch (error) {
          console.log("Failed to send otp: ", error);

          // A Resend 4xx response is a permanent configuration/validation
          // failure. Requeuing it causes a hot loop and floods the logs.
          const isPermanentResendError =
            error instanceof Error && /Resend API error \(4\d\d\)/.test(error.message);
          channel.nack(msg, false, !isPermanentResendError);
        }
      }
    });
  } catch (error) {
    console.error("Failed to start mail consumer", error);
  }
};
