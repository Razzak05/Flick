import axios from "axios";
import { store } from "../redux/store";
import { logout } from "../redux/slices/userSlice";

export const createApi = (baseURL: string) => {
  const api = axios.create({
    baseURL,
    withCredentials: true,
  });

  api.interceptors.response.use(
    (response) => {
      return Promise.resolve(response);
    },
    (error) => {
      if (error.response?.status === 401) {
        store.dispatch(logout());
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return api;
};
