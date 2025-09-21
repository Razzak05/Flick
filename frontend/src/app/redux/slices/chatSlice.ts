import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/app/lib/interface";

interface ChatState {
  selectedUser: User | null;
  selectedChatId: string | null;
  sidebarOpen: boolean;
  showAllUsers: boolean;
  message: string;
  isTyping: boolean;
}

const initialState: ChatState = {
  selectedUser: null,
  selectedChatId: null,
  sidebarOpen: false,
  showAllUsers: false,
  message: "",
  isTyping: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    setSelectedChatId: (state, action: PayloadAction<string | null>) => {
      state.selectedChatId = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleShowAllUsers: (state) => {
      state.showAllUsers = !state.showAllUsers;
    },
    setShowAllUsers: (state, action: PayloadAction<boolean>) => {
      state.showAllUsers = action.payload;
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
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
  toggleSidebar,
  setSidebarOpen,
  toggleShowAllUsers,
  setShowAllUsers,
  setMessage,
  setTyping,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;
