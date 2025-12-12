import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import axios from "axios";

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    // Get token from handshake
    const token =
      socket.handshake.auth?.token || (socket.handshake.query?.token as string);

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify token with user service
    try {
      const { data } = await axios.get(`${process.env.USER_SERVICE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (!data.user) {
        return next(new Error("Authentication error: Invalid user"));
      }

      socket.data.user = data.user;
      next();
    } catch (error) {
      // Fallback: verify locally
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.data.user = { _id: decoded.id };
      next();
    }
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.user?._id;
  console.log(`User connected: ${userId}, Socket: ${socket.id}`);

  // Join user's personal room
  if (userId) {
    socket.join(userId);

    // Notify others this user is online
    socket.broadcast.emit("user-online", { userId });

    // Send current online users
    const onlineUsers = Array.from(io.sockets.sockets.values())
      .map((s) => s.data.user?._id)
      .filter((id) => id);
    io.emit("onlineUsers", [...new Set(onlineUsers)]);
  }

  // Join chat room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
  });

  // Leave chat room
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${userId} left room ${roomId}`);
  });

  // Typing indicator
  socket.on("typing", ({ roomId, isTyping }) => {
    socket.to(roomId).emit("userTyping", {
      userId,
      isTyping,
      roomId,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    if (userId) {
      socket.broadcast.emit("user-offline", { userId });
    }
  });
});

export { io, server };
