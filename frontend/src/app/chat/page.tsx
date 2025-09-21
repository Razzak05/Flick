"use client";

import React from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatHeader from "../components/ChatHeader";
import ChatMessages from "../components/ChatMessages";
import MessageInput from "../components/MessageInput";
import { useChat } from "../hooks/useChat";

const ChatApp: React.FC = () => {
  const { selectedUser, message, handleMessageSend, handleTyping, sending } =
    useChat();

  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <ChatSidebar />
      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10">
        <ChatHeader />
        <ChatMessages />
        <MessageInput
          selectedUser={selectedUser?._id ?? null}
          message={message ?? ""} // ✅ ensure safe string
          setMessage={handleTyping}
          handleMessageSend={handleMessageSend}
          sending={sending}
        />
      </div>
    </div>
  );
};

export default ChatApp;
