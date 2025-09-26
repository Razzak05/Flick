"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { Menu } from "lucide-react";
import { toggleSidebar } from "../redux/slices/chatSlice";
import { useSocket } from "../context/SocketContext";

const ChatHeader: React.FC = () => {
  const { selectedUser, selectedChatId } = useSelector(
    (state: RootState) => state.chat
  );
  const dispatch = useDispatch();
  const { onlineUsers, typingMap } = useSocket();

  const isOnline = selectedUser && onlineUsers.includes(selectedUser._id);

  // derive typing state from typingMap (set in SocketContext)
  const isTyping =
    !!selectedChatId &&
    !!typingMap[selectedChatId] &&
    typingMap[selectedChatId] === selectedUser?._id;

  return (
    <>
      {/* Mobile menu button */}
      <div className="sm:hidden fixed top-4 right-4 z-30">
        <button
          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
          onClick={() => dispatch(toggleSidebar())}
        >
          <Menu className="w-5 h-5 text-gray-200" />
        </button>
      </div>

      <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 shadow-md">
        <div className="flex items-center gap-4">
          {selectedUser ? (
            <>
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white truncate">
                    {selectedUser.name}
                  </h2>
                </div>

                {isTyping ? (
                  <div className="text-sm text-blue-400 mt-1">typing...</div>
                ) : isOnline ? (
                  <p className="text-sm text-gray-400 mt-1">Active now</p>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">
                    Last seen recently
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                <div className="w-8 h-8 text-gray-400">💬</div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-400">
                  Select a conversation
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHeader;
