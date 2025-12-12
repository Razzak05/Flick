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
  const prevSelectedChatId = useRef<string | null>(null);

  // Get token from localStorage or cookie
  const getToken = (): string | null => {
    if (typeof window === "undefined") return null;

    // Try localStorage first
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
      console.warn("No token available for socket connection, will retry...");
      // Don't block - socket will reconnect when token is available
      return;
    }

    const socketUrl = process.env
      .NEXT_PUBLIC_BACKEND_URL_CHAT_SERVICE!.replace("/api/v1", "")
      .replace(/^https?:\/\//, "");

    const newSocket = io(`wss://${socketUrl}`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        token: token,
      },
      query: {
        token: token,
      },
      withCredentials: true,
      path: "/socket.io/",
      secure: true,
      rejectUnauthorized: false, // For development only
    });

    setSocket(newSocket);

    // Event handlers
    newSocket.on("connect", () => {
      console.log("Socket connected successfully");

      // Join user's personal room
      if (user?._id) {
        newSocket.emit("join", user._id);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);

      // Try to get fresh token and reconnect
      setTimeout(() => {
        const freshToken = getToken();
        if (freshToken) {
          newSocket.auth = { token: freshToken };
          newSocket.connect();
        }
      }, 2000);
    });

    newSocket.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users || []);
    });

    newSocket.on("user-online", (data: { userId: string }) => {
      setOnlineUsers((prev) =>
        prev.includes(data.userId) ? prev : [...prev, data.userId]
      );
    });

    newSocket.on("user-offline", (data: { userId: string }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

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

    newSocket.on(
      "chatUpdated",
      (data: { chatId: string; latestMessage: any; unseenCount: number }) => {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      }
    );

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id, queryClient]);

  // Handle chat room joining/leaving
  useEffect(() => {
    if (!socket || !user?._id || !selectedChatId) return;

    // Leave previous chat room
    if (
      prevSelectedChatId.current &&
      prevSelectedChatId.current !== selectedChatId
    ) {
      socket.emit("leaveRoom", prevSelectedChatId.current);
    }

    // Join new chat room
    socket.emit("joinRoom", selectedChatId);
    prevSelectedChatId.current = selectedChatId;

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
