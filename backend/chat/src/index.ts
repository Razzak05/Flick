import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import chatRoutes from "./routes/chat.js";
import cookieParser from "cookie-parser";
import http from "http";
import connectDB from "./config/db.js";
import { initializeSocket } from "./config/socket.js";

dotenv.config();
connectDB();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", chatRoutes);
const server = http.createServer(app);
initializeSocket(server);

const port = process.env.PORT || 5001;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
