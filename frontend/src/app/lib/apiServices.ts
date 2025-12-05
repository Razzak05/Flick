import axios from "axios";
import { createApi } from "./axios";

// For user service
export const apiUser = createApi(
  process.env.NEXT_PUBLIC_BACKEND_URL_USER_SERVICE!
);

// For chat service - WITHOUT auto-logout interceptor
export const apiChat = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL_CHAT_SERVICE!,
  withCredentials: true,
});
