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

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  typingMap: Record<string, string | null>; // chatId -> userId who's typing (or null)
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

  useEffect(() => {
    if (user) {
      const newSocket = io(
        process.env.NEXT_PUBLIC_BACKEND_URL_CHAT_SERVICE!.replace(
          "/api/v1",
          ""
        ),
        {
          transports: ["websocket", "polling"],
          withCredentials: true,
        }
      );

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);
        newSocket.emit("join", user._id);
      });

      newSocket.on("onlineUsers", (users: string[]) => {
        setOnlineUsers(users || []);
      });

      newSocket.on("user-online", ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => {
          if (prev.includes(userId)) return prev;
          return [...prev, userId];
        });
      });

      newSocket.on("user-offline", ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      // typing events (payload: { userId, isTyping, roomId })
      const handleUserTyping = (data: {
        userId: string;
        isTyping: boolean;
        roomId: string;
      }) => {
        setTypingMap((prev) => {
          const next = { ...prev };
          if (data.isTyping) {
            next[data.roomId] = data.userId;
          } else {
            // only clear if same user was typing
            if (next[data.roomId] === data.userId) {
              next[data.roomId] = null;
            }
          }
          return next;
        });
      };

      newSocket.on("userTyping", handleUserTyping);

      newSocket.on("disconnect", () => console.log("❌ Socket disconnected"));
      newSocket.on("connect_error", (err) =>
        console.error("⚠️ Socket error:", err)
      );

      return () => {
        newSocket.off("userTyping", handleUserTyping);
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user]);

  // join/leave chat room when selectedChatId changes
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
    // When cleaning up component (unmount), ensure leave
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
