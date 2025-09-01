"use client";

import React from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatInterface from "../components/ChatInterface";

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
  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <ChatSidebar />
      <ChatInterface />
    </div>
  );
};

export default ChatApp;
