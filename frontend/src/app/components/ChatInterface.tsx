// ChatInterface.tsx (additional component for the main chat area)
"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Send, Paperclip, Smile } from "lucide-react";

const ChatInterface = () => {
  const { selectedChatId, selectedUser } = useSelector(
    (state: RootState) => state.chat
  );

  if (!selectedChatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">No Chat Selected</h3>
          <p>Select a chat from the sidebar or start a new conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-800">
      {/* Chat Header */}
      <div className="bg-gray-700 px-6 py-4 border-b border-gray-600 flex items-center">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
          <span className="text-white font-semibold">
            {selectedUser?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-white">{selectedUser?.name}</h3>
          <p className="text-xs text-gray-400">Online</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Example messages */}
        <div className="flex justify-start">
          <div className="bg-gray-700 rounded-lg py-2 px-4 max-w-xs">
            <p className="text-white">Hey there! How are you doing?</p>
            <span className="text-xs text-gray-400 block mt-1 text-right">
              10:30 AM
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="bg-blue-600 rounded-lg py-2 px-4 max-w-xs">
            <p className="text-white">
              I'm doing great! Just working on this new chat app.
            </p>
            <span className="text-xs text-blue-200 block mt-1 text-right">
              10:32 AM
            </span>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-gray-700 p-4 border-t border-gray-600">
        <div className="flex items-center">
          <button className="p-2 text-gray-400 hover:text-white mr-1">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-gray-600 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="p-2 text-gray-400 hover:text-white mx-2">
            <Smile size={20} />
          </button>
          <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
