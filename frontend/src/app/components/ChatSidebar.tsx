/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import {
  MessageCircle,
  Plus,
  Search,
  UserCircle,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import {
  setSidebarOpen,
  setShowAllUsers,
  setSelectedUser,
  setSelectedChatId,
} from "../redux/slices/chatSlice";
import { useHandleLogout } from "../hooks/useAuth";
import { useGetAllUsers } from "../hooks/useUser";
import { useCreateChat, useGetAllChats } from "../hooks/useChatMutations";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../context/SocketContext";

const ChatSidebar: React.FC = () => {
  const { sidebarOpen, showAllUsers, selectedChatId, selectedUser } =
    useSelector((state: RootState) => state.chat);
  const { user: loggedInUser } = useSelector((state: RootState) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const logout = useHandleLogout();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createChatMutation = useCreateChat();
  const { onlineUsers, typingMap } = useSocket();

  const { data: users, isLoading: usersLoading } = useGetAllUsers();
  const { data: chats, isLoading: chatsLoading } = useGetAllChats();

  const handleCreateChat = (otherUserId: string) => {
    createChatMutation.mutate(otherUserId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        dispatch(setShowAllUsers(false));
      },
      onError: (error: any) => console.error("Failed to create chat:", error),
    });
  };

  const handleChatClick = (chatId: string, user: any) => {
    dispatch(setSelectedChatId(chatId));
    dispatch(setSelectedUser(user));
  };

  const renderUserStatus = (userId: string) => {
    const isOnline = onlineUsers.includes(userId);
    return (
      <span
        className={`text-xs font-semibold ${
          isOnline ? "text-green-400" : "text-gray-400"
        }`}
      >
        {isOnline ? "Online" : "Offline"}
      </span>
    );
  };

  const renderAvatar = (userId: string) => {
    const isOnline = onlineUsers.includes(userId);
    return (
      <div className="relative flex-shrink-0">
        <UserCircle className="w-10 h-10 text-gray-300" />
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
            isOnline ? "bg-green-400" : "bg-gray-500"
          }`}
        />
      </div>
    );
  };

  if (usersLoading || chatsLoading) {
    return (
      <aside className="fixed z-50 top-0 left-0 h-screen w-80 bg-gray-900 border-r border-gray-700 flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </aside>
    );
  }

  return (
    <aside
      className={`fixed z-50 top-0 left-0 h-screen w-80 bg-gray-900 border-r border-gray-700 shadow-sm transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:static sm:translate-x-0 transition-transform duration-300 flex flex-col`}
    >
      {/* ---------- Header ---------- */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {showAllUsers ? "New Chat" : "Messages"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(setShowAllUsers(!showAllUsers))}
            className={`p-2 rounded-lg transition-colors ${
              showAllUsers
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            {showAllUsers ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="sm:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* ---------- Content ---------- */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {showAllUsers ? (
          <>
            {/* Search box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users"
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* User list */}
            <div className="space-y-2">
              {users
                ?.filter(
                  (u: any) =>
                    u._id !== loggedInUser?._id &&
                    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((u: any) => {
                  const isSelectedUser = selectedUser?._id === u._id;
                  return (
                    <button
                      key={u._id}
                      onClick={() => {
                        dispatch(setSelectedUser(u));
                        dispatch(setSelectedChatId(null));
                        handleCreateChat(u._id);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isSelectedUser
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "border-gray-700 hover:border-gray-600 hover:bg-gray-800 text-gray-200"
                      }`}
                    >
                      {renderAvatar(u._id)}
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{u.name}</span>
                        {renderUserStatus(u._id)}
                      </div>
                    </button>
                  );
                })}
            </div>
          </>
        ) : chats && chats.length > 0 ? (
          <div className="space-y-2">
            {chats.map((chat: any) => {
              const latestMessage = chat.chat.latestMessage;
              const unseenCount = chat.chat.unseenCount || 0;
              const isSelected = selectedChatId === chat.chat._id;

              // typing map: show 'typing...' if someone is typing in this chat
              const typingUserId = typingMap?.[chat.chat._id];
              const isOtherTyping =
                !!typingUserId && typingUserId !== loggedInUser?._id;

              return (
                <button
                  key={chat.chat._id}
                  onClick={() => handleChatClick(chat.chat._id, chat.user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors relative ${
                    isSelected
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-gray-700 hover:border-gray-600 hover:bg-gray-800 text-gray-200"
                  }`}
                >
                  {renderAvatar(chat.user._id)}
                  <div className="flex flex-col flex-1 text-left">
                    <span className="font-semibold">{chat.user.name}</span>
                    {renderUserStatus(chat.user._id)}
                    <p className="text-sm text-gray-400 truncate">
                      {isOtherTyping
                        ? "typing..."
                        : latestMessage?.text || "No messages yet"}
                    </p>
                  </div>

                  {unseenCount > 0 && (
                    <span className="absolute top-2 right-3 bg-red-600 text-white text-xs font-bold rounded-full min-w-[22px] h-5 flex items-center justify-center px-2">
                      {unseenCount > 99 ? "99+" : unseenCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No chats yet
          </div>
        )}
      </div>

      {/* ---------- Footer ---------- */}
      <div className="p-4 border-t border-gray-700 flex flex-col gap-2">
        <button
          onClick={() => logout.mutate()}
          className="flex gap-2 w-full items-center text-gray-300 hover:text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
