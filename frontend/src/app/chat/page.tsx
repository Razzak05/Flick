"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useGetAllChats } from "../hooks/useChat";
import { useGetAllUsers } from "../hooks/useAuth";

const ChatApp = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);
  useGetAllChats();
  useGetAllUsers();
  return <div>ChatApp</div>;
};

export default ChatApp;
