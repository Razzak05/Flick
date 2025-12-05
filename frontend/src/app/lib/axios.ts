import axios from "axios";
import { store } from "../redux/store";
import { logout } from "../redux/slices/userSlice";

export const createApi = (baseURL: string) => {
  const api = axios.create({
    baseURL,
    withCredentials: true,
  });

  // In your axios interceptor
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log("Interceptor caught error:", {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });

      if (error.response?.status === 401) {
        console.log("401 detected, triggering logout");
        store.dispatch(logout());
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return api;
};
