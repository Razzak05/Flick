/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/app/redux/store";
import { MessageCircle, Plus, Search, UserCircle, X } from "lucide-react";
import {
  toggleSidebar,
  toggleShowAllUsers,
  setSelectedUser,
} from "@/app/redux/slices/chatSlice";
import { useHandleLogout } from "../hooks/useAuth";
import { useGetAllUsers } from "../hooks/useUser";

const ChatSidebar = () => {
  const { sidebarOpen, showAllUsers } = useSelector(
    (state: RootState) => state.chat
  );
  const { user: loggedInUser } = useSelector((state: RootState) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const logout = useHandleLogout();
  const { data: users } = useGetAllUsers();

  return (
    <aside
      className={`fixed z-100 top-0 left-0 h-screen w-80 bg-gray-900 border-r border-gray-700 shadow-sm shadow-blue-900 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:static sm:translate-x-0 transition-transform duration-300 flex flex-col`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-700 shadow-xs shadow-blue-900">
        <div className="sm:hidden flex justify-end mb-0">
          <button
            onClick={() => dispatch(toggleSidebar(false))}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <button
          className="text-white mb-4"
          onClick={() => {
            logout.mutate();
          }}
        >
          Logout
        </button>

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

            {/* Users List */}
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
                    onClick={() => dispatch(setSelectedUser(u))}
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
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No chats yet
          </div>
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
