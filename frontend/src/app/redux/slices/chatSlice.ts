/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/app/lib/interface";
import { Message } from "@/app/chat/page";

interface ChatState {
  users: User[] | null;
  chats: any[] | null;
  selectedUser: User | null;
  sidebarOpen: boolean;
  showAllUsers: boolean;
  messages: Message[] | null;
  isTyping: boolean;
}

const initialState: ChatState = {
  users: null,
  chats: null,
  selectedUser: null,
  sidebarOpen: false,
  showAllUsers: false,
  messages: null,
  isTyping: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    toggleSidebar: (state, action: PayloadAction<boolean | undefined>) => {
      state.sidebarOpen = action.payload ?? !state.sidebarOpen;
    },
    toggleShowAllUsers: (state, action: PayloadAction<boolean | undefined>) => {
      state.showAllUsers = action.payload ?? !state.showAllUsers;
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    resetChat: () => initialState,
  },
});

export const {
  setSelectedUser,
  toggleSidebar,
  toggleShowAllUsers,
  setTyping,
  resetChat,
} = chatSlice.actions;
export default chatSlice.reducer;
