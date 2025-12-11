import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import axios from "axios";

const app = express();
app.set("trust proxy", 1);
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

io.use(async (socket: Socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify JWT locally (NO external calls)
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET!);

    // Type guard to handle JWT payload properly
    const userId = typeof decoded === "string" ? decoded : decoded.id;

    if (!userId) {
      return next(new Error("Token payload missing user ID"));
    }

    // Attach minimal user info
    socket.data.user = {
      _id: userId,
    };

    next();
  } catch (error) {
    console.error("Socket JWT verification failed:", error);
    return next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket: Socket) => {
  // User joins with their userId (personal room)
  socket.on("join", () => {
    const userId = socket.data.user?._id;
    if (!userId) return;

    socket.join(userId);
    userSocketMap[userId] = socket.id;
    socketUserMap[socket.id] = userId;
    console.log(`User ${userId} joined with socket ${socket.id}`);

    // Emit aggregated online users array
    io.emit("onlineUsers", Object.keys(userSocketMap));
    io.emit("user-online", { userId });
  });

  // Join a chat room (chatId). Clients should call this when opening a chat.
  socket.on("joinRoom", (roomId: string) => {
    if (!roomId) return;
    socket.join(roomId);
  });

  // Leave a chat room when closing a chat
  socket.on("leaveRoom", (roomId: string) => {
    if (!roomId) return;
    socket.leave(roomId);
  });

  // Handle typing events (expects { roomId, isTyping })
  socket.on("typing", (data: { roomId: string; isTyping: boolean }) => {
    const userId = socketUserMap[socket.id];
    if (!data?.roomId) return;
    // Emit to the room so only other participants receive this
    // Include roomId in payload so clients can map typing to chats
    socket.to(data.roomId).emit("userTyping", {
      userId,
      isTyping: data.isTyping,
      roomId: data.roomId,
    });
  });

  // Handle messages (this implementation only forwards to room)
  socket.on(
    "sendMessage",
    ({ roomId, message }: { roomId: string; message: string }) => {
      const userId = socketUserMap[socket.id];
      if (!roomId) return;
      io.to(roomId).emit("receiveMessage", {
        message,
        senderId: userId,
        timestamp: new Date(),
      });
    }
  );

  // Handle disconnect
  socket.on("disconnect", () => {
    const userId = socketUserMap[socket.id];

    if (userId) {
      delete userSocketMap[userId];
      delete socketUserMap[socket.id];

      // Broadcast updated online users list
      io.emit("onlineUsers", Object.keys(userSocketMap));
      // Emit single user-offline event
      io.emit("user-offline", { userId });
    }
  });

  socket.on("connect_error", (error) => {
    console.error("⚠️ Socket connection error:", error.message);
  });
});

export { app, server, io };
