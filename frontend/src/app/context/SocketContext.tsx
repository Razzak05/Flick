"use client";

import {
  ReactNode,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { RootState } from "../redux/store";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

interface ProviderProps {
  children: ReactNode;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
});

export const SocketProvider = ({ children }: ProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedUser } = useSelector((state: RootState) => state.chat);

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
        setOnlineUsers(users);
      });

      newSocket.on("disconnect", () => console.log("❌ Socket disconnected"));
      newSocket.on("connect_error", (err) =>
        console.error("⚠️ Socket error:", err)
      );

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user]);

  useEffect(() => {
    if (socket && selectedUser?._id) {
      socket.emit("join", selectedUser._id);
    }
  }, [selectedUser, socket]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
