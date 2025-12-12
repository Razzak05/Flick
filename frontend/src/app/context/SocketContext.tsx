/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useQueryClient } from "@tanstack/react-query";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  typingMap: Record<string, string | null>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  typingMap: {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingMap, setTypingMap] = useState<Record<string, string | null>>({});
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedChatId } = useSelector((state: RootState) => state.chat);
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Get token function
  const getToken = () => {
    // Try to get token from localStorage first
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) return storedToken;

    // Fallback to cookies
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("accessToken=")
    );
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  };

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id) return;

    const token = getToken();
    if (!token) {
      console.error("No token available for socket connection");
      return;
    }

    // Store token for socket to use
    localStorage.setItem("accessToken", token);

    const socketUrl = process.env
      .NEXT_PUBLIC_BACKEND_URL_CHAT_SERVICE!.replace("/api/v1", "")
      .replace(/^https?:\/\//, "");

    const newSocket = io(`wss://${socketUrl}`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      auth: {
        token: token,
      },
      query: {
        token: token,
        userId: user._id,
      },
      withCredentials: true,
      path: "/socket.io/",
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    setSocket(newSocket);

    // Socket event handlers
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      reconnectAttempts.current = 0;

      // Join user's personal room
      newSocket.emit("join", user._id);

      // If a chat is selected, join that room
      if (selectedChatId) {
        newSocket.emit("joinRoom", selectedChatId);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);

      // Increment reconnect attempts
      reconnectAttempts.current += 1;

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log("Max reconnection attempts reached");
        // Don't disconnect - let it keep trying in background
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    // Online users
    newSocket.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on("user-online", (data: { userId: string }) => {
      setOnlineUsers((prev) =>
        prev.includes(data.userId) ? prev : [...prev, data.userId]
      );
    });

    newSocket.on("user-offline", (data: { userId: string }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    // Typing indicator
    newSocket.on(
      "userTyping",
      (data: { userId: string; isTyping: boolean; roomId: string }) => {
        setTypingMap((prev) => {
          const newMap = { ...prev };
          if (data.isTyping) {
            newMap[data.roomId] = data.userId;
          } else if (newMap[data.roomId] === data.userId) {
            delete newMap[data.roomId];
          }
          return newMap;
        });
      }
    );

    // New message
    newSocket.on("newMessage", (msg: any) => {
      const chatId = msg.chatId;
      queryClient.setQueryData(["messages", chatId], (old: any) => {
        if (!old) return { messages: [msg] };
        const exists = old.messages?.some((m: any) => m._id === msg._id);
        if (exists) return old;
        return {
          ...old,
          messages: [...(old.messages || []), msg],
        };
      });
    });

    // Chat updated
    newSocket.on(
      "chatUpdated",
      (data: { chatId: string; latestMessage: any; unseenCount: number }) => {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      }
    );

    return () => {
      newSocket.off("userTyping");
      newSocket.off("newMessage");
      newSocket.off("chatUpdated");
      newSocket.disconnect();
    };
  }, [user?._id, queryClient]);

  // Handle chat room joining/leaving
  useEffect(() => {
    if (!socket || !user?._id) return;

    // Join selected chat room
    if (selectedChatId) {
      socket.emit("joinRoom", selectedChatId);
    }

    return () => {
      if (selectedChatId) {
        socket.emit("leaveRoom", selectedChatId);
      }
    };
  }, [socket, selectedChatId, user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingMap }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
