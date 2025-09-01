/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/app/lib/interface";
import { Message } from "@/app/chat/page";

interface ChatState {
  selectedUser: User | null;
  selectedChatId: string | null;
  sidebarOpen: boolean;
  showAllUsers: boolean;
  messages: Message[] | null;
  isTyping: boolean;
}

const initialState: ChatState = {
  selectedUser: null,
  selectedChatId: null,
  sidebarOpen: false,
  showAllUsers: false,
  messages: null,
  isTyping: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // selection
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    setSelectedChatId: (state, action: PayloadAction<string | null>) => {
      state.selectedChatId = action.payload;
    },

    // messages (keep in redux if multiple components require instant access)
    setMessages: (state, action: PayloadAction<Message[] | null>) => {
      state.messages = action.payload;
    },

    // sidebar toggles / explicit setters (both provided)
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    // show all users toggle / explicit setter
    toggleShowAllUsers: (state) => {
      state.showAllUsers = !state.showAllUsers;
    },
    setShowAllUsers: (state, action: PayloadAction<boolean>) => {
      state.showAllUsers = action.payload;
    },

    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },

    resetChat: () => initialState,
  },
});

export const {
  setSelectedUser,
  setSelectedChatId,
  setMessages,
  toggleSidebar,
  setSidebarOpen,
  toggleShowAllUsers,
  setShowAllUsers,
  setTyping,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
