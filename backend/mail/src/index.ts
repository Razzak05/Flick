import express from "express";
import dotenv from "dotenv";
import { startSentOtpConsumer } from "./consumer.js";

dotenv.config();
const app = express();
app.set("trust proxy", 1);

startSentOtpConsumer();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
