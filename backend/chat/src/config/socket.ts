import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store user ID to socket ID mapping
const userSocketMap: Record<string, string> = {};
// Store socket ID to user ID mapping
const socketUserMap: Record<string, string> = {};

io.on("connection", (socket: Socket) => {
  console.log("✅ User connected:", socket.id);

  // User joins with their userId
  socket.on("join", (userId: string) => {
    socket.join(userId);
    userSocketMap[userId] = socket.id;
    socketUserMap[socket.id] = userId;
    console.log(`User ${userId} joined with socket ${socket.id}`);

    // Broadcast updated online users list
    io.emit("onlineUsers", Object.keys(userSocketMap));
  });

  // Handle typing events
  socket.on("typing", (data: { roomId: string; isTyping: boolean }) => {
    const userId = socketUserMap[socket.id];
    socket.to(data.roomId).emit("userTyping", {
      userId,
      isTyping: data.isTyping,
    });
  });

  // Handle messages
  socket.on(
    "sendMessage",
    ({ roomId, message }: { roomId: string; message: string }) => {
      const userId = socketUserMap[socket.id];
      io.to(roomId).emit("receiveMessage", {
        message,
        senderId: userId,
        timestamp: new Date(),
      });
    }
  );

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    const userId = socketUserMap[socket.id];

    if (userId) {
      delete userSocketMap[userId];
      delete socketUserMap[socket.id];
      io.emit("onlineUsers", Object.keys(userSocketMap));
    }
  });

  socket.on("connect_error", (error) => {
    console.error("⚠️ Socket connection error:", error.message);
  });
});

export { app, server, io };
