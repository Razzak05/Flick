/* eslint-disable @typescript-eslint/no-explicit-any */
// ChatSidebar.tsx
"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/app/redux/store";
import {
  MessageCircle,
  Plus,
  Search,
  UserCircle,
  X,
  LogOut,
} from "lucide-react";
import {
  setSidebarOpen,
  toggleShowAllUsers,
  setSelectedUser,
  setSelectedChatId,
} from "@/app/redux/slices/chatSlice";
import { useHandleLogout } from "../hooks/useAuth";
import { useGetAllUsers } from "../hooks/useUser";
import { useCreateChat, useGetAllChats } from "../hooks/useChat";
import { useRouter } from "next/navigation";

const ChatSidebar = () => {
  const { sidebarOpen, showAllUsers, selectedChatId } = useSelector(
    (state: RootState) => state.chat
  );
  const { user: loggedInUser } = useSelector((state: RootState) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const logout = useHandleLogout();
  const router = useRouter();
  const createChatMutation = useCreateChat();

  // React Query is the single source of truth for users & chats
  const { data: users } = useGetAllUsers();
  const { data: chats } = useGetAllChats();

  const handleCreateChat = (otherUserId: string) => {
    createChatMutation.mutate(otherUserId, {
      onSuccess: (data) => {
        dispatch(setSelectedChatId(data._id));
        dispatch(toggleShowAllUsers());
      },
    });
  };

  return (
    <aside
      className={`fixed z-50 top-0 left-0 h-screen w-80 bg-gray-900 border-r border-gray-700 shadow-sm shadow-blue-900 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:static sm:translate-x-0 transition-transform duration-300 flex flex-col`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-700 shadow-xs shadow-blue-900">
        <div className="sm:hidden flex justify-end mb-0">
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {showAllUsers ? "New Chat" : "Messages"}
            </h2>
          </div>

          <button
            onClick={() => dispatch(toggleShowAllUsers())}
            className={`p-2.5 rounded-lg transition-colors ${
              showAllUsers
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {showAllUsers ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 py-2">
        {showAllUsers ? (
          // 🔹 All Users List
          <div className="space-y-4 h-full">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Users */}
            <div className="space-y-2 overflow-y-auto h-full pb-4">
              {users
                ?.filter(
                  (u: any) =>
                    u._id !== loggedInUser?._id &&
                    u.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((u: any) => (
                  <button
                    key={u._id}
                    onClick={() => {
                      dispatch(setSelectedUser(u));
                      dispatch(setSelectedChatId(null));
                      handleCreateChat(u._id);
                    }}
                    className="w-full flex items-center gap-3 text-left p-4 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-colors"
                  >
                    <UserCircle className="w-6 h-6 text-gray-300" />
                    <span className="font-medium text-white truncate">
                      {u.name}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ) : chats && chats.length > 0 ? (
          // 🔹 Existing Chats
          <div className="space-y-2 overflow-y-auto h-full pb-4">
            {chats.map((chat: any) => {
              const latestMessage = chat.chat.latestMessage;
              const unseenCount = chat.chat.unseenCount || 0;
              const isSelected = selectedChatId === chat.chat._id;

              return (
                <button
                  key={chat.chat._id}
                  onClick={() => {
                    dispatch(setSelectedChatId(chat.chat._id));
                    dispatch(setSelectedUser(chat.user));
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-colors flex items-center gap-3 ${
                    isSelected
                      ? "bg-blue-600 border border-blue-500 text-white"
                      : "border border-gray-700 hover:border-gray-600 hover:bg-gray-800 text-gray-200"
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <UserCircle className="w-7 h-7 text-gray-300" />
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-semibold truncate ${
                          isSelected ? "text-white" : "text-gray-200"
                        }`}
                      >
                        {chat.user.name}
                      </span>

                      {/* 🔹 Unseen Messages Badge */}
                      {unseenCount > 0 && (
                        <div className="bg-red-600 text-white text-xs font-bold rounded-full min-w-[22px] h-5 flex items-center justify-center px-2">
                          {unseenCount > 99 ? "99+" : unseenCount}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {latestMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          // 🔹 No Chats
          <div className="flex items-center justify-center h-full text-gray-500">
            No chats yet
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t  border-gray-700 flex flex-col justify-around">
        {/* Profile Button */}
        <div className="hover:bg-blue-700 p-2 rounded-lg flex">
          <button
            onClick={() => router.push("/profile")}
            className="flex gap-2 items-center text-gray-300 hover:text-white"
          >
            <UserCircle size={20} />
            <span className="text-xs">Profile</span>
          </button>
        </div>

        {/* Logout Button */}
        <div className="hover:bg-blue-700 p-2 rounded-lg flex">
          <button
            onClick={() => logout.mutate()}
            className="flex gap-2  items-center text-gray-300 hover:text-white"
          >
            <span className="text-xs">Logout</span>
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
