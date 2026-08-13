import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../lib/interface";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    authInitialized: (state) => {
      state.isInitialized = true;
    },
  },
});

export const { loginSuccess, logout, authInitialized } = authSlice.actions;
export default authSlice.reducer;
