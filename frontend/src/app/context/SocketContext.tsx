/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ReactNode,
  useState,
  useEffect,
  createContext,
  useContext,
  useRef,
} from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "../redux/store";
import { useQueryClient } from "@tanstack/react-query";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  typingMap: Record<string, string | null>; // chatId -> userId typing (or null)
}

interface ProviderProps {
  children: ReactNode;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  typingMap: {},
});

export const SocketProvider = ({ children }: ProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingMap, setTypingMap] = useState<Record<string, string | null>>({});
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedChatId } = useSelector((state: RootState) => state.chat);

  const prevChatRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  // Connect socket when user logs in
  useEffect(() => {
    if (!user) return;

    const getToken = () => {
      const cookies = document.cookie.split(";");
      const tokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("accessToken=")
      );
      return tokenCookie ? tokenCookie.split("=")[1] : null;
    };

    const token = getToken();

    const newSocket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL_CHAT_SERVICE!.replace("/api/v1", ""),
      {
        transports: ["websocket", "polling"],
        withCredentials: true,
        auth: {
          token: token,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      }
    );

    setSocket(newSocket);

    // On connect, join user room
    newSocket.on("connect", () => {
      newSocket.emit("join", user._id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);

      // Don't logout on socket errors - just reconnect
      if (error.message.includes("Authentication")) {
        console.log("Authentication failed, will retry...");
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server intentionally disconnected, try to reconnect
        newSocket.connect();
      }
    });

    // Online users sync
    newSocket.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users || []);
    });

    newSocket.on("user-online", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    });

    newSocket.on("user-offline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Typing indicator
    const handleUserTyping = (data: {
      userId: string;
      isTyping: boolean;
      roomId: string;
    }) => {
      setTypingMap((prev) => {
        const next = { ...prev };
        if (data.isTyping) {
          next[data.roomId] = data.userId;
        } else if (next[data.roomId] === data.userId) {
          next[data.roomId] = null;
        }
        return next;
      });
    };
    newSocket.on("userTyping", handleUserTyping);

    // New message
    const handleNewMessage = (msg: any) => {
      const chatId = msg?.chatId || msg?.chat || msg?.chatId?.toString();
      if (!chatId) return;

      queryClient.setQueryData(["messages", chatId], (old: any) => {
        if (!old) return { messages: [msg] };
        const exists = (old.messages || []).some(
          (m: any) => String(m._id) === String(msg._id)
        );
        if (exists) return old;
        return { ...old, messages: [...(old.messages || []), msg] };
      });
    };
    newSocket.on("newMessage", handleNewMessage);

    // Chat updated (latestMessage + unseenCount)
    const handleChatUpdated = (data: {
      chatId: string;
      latestMessage: any;
      unseenCount: number;
      updatedAt?: string;
    }) => {
      if (!data?.chatId) return;
      queryClient.setQueryData(["chats"], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        const chatsCopy = [...old];
        const idx = chatsCopy.findIndex(
          (c: any) => String(c.chat._id) === String(data.chatId)
        );
        if (idx === -1) return old;

        const chatItem = { ...chatsCopy[idx] };
        chatItem.chat = {
          ...chatItem.chat,
          latestMessage: data.latestMessage ?? chatItem.chat.latestMessage,
          unseenCount:
            typeof data.unseenCount === "number"
              ? data.unseenCount
              : chatItem.chat.unseenCount ?? 0,
          updatedAt: data.updatedAt ?? chatItem.chat.updatedAt,
        };

        chatsCopy.splice(idx, 1);
        chatsCopy.unshift(chatItem);
        return chatsCopy;
      });
    };
    newSocket.on("chatUpdated", handleChatUpdated);

    // ✅ Cleanup
    return () => {
      newSocket.off("userTyping", handleUserTyping);
      newSocket.off("newMessage", handleNewMessage);
      newSocket.off("chatUpdated", handleChatUpdated);
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, queryClient]);

  // Join / leave chat rooms on selection change
  useEffect(() => {
    if (!socket) return;
    const prev = prevChatRef.current;

    if (prev && prev !== selectedChatId) {
      socket.emit("leaveRoom", prev);
    }
    if (selectedChatId) {
      socket.emit("joinRoom", selectedChatId);
    }

    prevChatRef.current = selectedChatId;

    return () => {
      if (selectedChatId) {
        socket.emit("leaveRoom", selectedChatId);
      }
    };
  }, [socket, selectedChatId]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingMap }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
