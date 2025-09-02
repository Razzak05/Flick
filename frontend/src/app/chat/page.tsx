"use client";

import React from "react";
import ChatSidebar from "../components/ChatSidebar";
import { useFetchChat } from "../hooks/useChat";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const ChatApp = () => {
  const { selectedChatId } = useSelector((state: RootState) => state.chat);
  const { user: loggedInUser } = useSelector((state: RootState) => state.auth);
  const { data } = useFetchChat(selectedChatId);

  console.log(data);
  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <ChatSidebar />
    </div>
  );
};

export default ChatApp;
