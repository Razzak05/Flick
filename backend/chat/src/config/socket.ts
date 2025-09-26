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
  // User joins with their userId (personal room)
  socket.on("join", (userId: string) => {
    if (!userId) return;
    socket.join(userId);
    userSocketMap[userId] = socket.id;
    socketUserMap[socket.id] = userId;
    console.log(`User ${userId} joined with socket ${socket.id}`);

    // Emit aggregated online users array (useful for presence lists)
    io.emit("onlineUsers", Object.keys(userSocketMap));

    // Emit single user-online event for convenience
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
