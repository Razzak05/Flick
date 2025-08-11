import express from "express";
import dotenv from "dotenv";
import { startSentOtpConsumer } from "./consumer.js";

dotenv.config();
const app = express();

startSentOtpConsumer();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
