import axios from "axios";
import { store } from "../redux/store";
import { logout } from "../redux/slices/userSlice";

// Helper to get token from localStorage or cookie
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;

  // Try localStorage first
  const storedToken = localStorage.getItem("accessToken");
  if (storedToken) return storedToken;

  // Fallback to cookies
  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("accessToken=")
  );
  return tokenCookie ? tokenCookie.split("=")[1] : null;
};

export const createApi = (baseURL: string) => {
  const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to add token
  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log("API Error:", {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });

      if (error.response?.status === 401) {
        // Clear stored token
        localStorage.removeItem("accessToken");
        // Dispatch logout
        store.dispatch(logout());
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
};

// For chat service
export const apiChat = createApi(
  process.env.NEXT_PUBLIC_BACKEND_URL_CHAT_SERVICE!
);

// For user service
export const apiUser = createApi(
  process.env.NEXT_PUBLIC_BACKEND_URL_USER_SERVICE!
);
