"use client";

import { useMutation } from "@tanstack/react-query";
import { apiUser } from "../lib/apiServices";
import { logout } from "../redux/slices/userSlice";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginPayload) => {
      const res = await apiUser.post(`/login`, data, {
        withCredentials: true,
      });
      return res.data;
    },
  });
};

export const useHandleLogout = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async () => {
      const res = await apiUser.post("/logout", {}, { withCredentials: true });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Logout Successful !");
      dispatch(logout());
      window.location.href = "/login";
    },
    onError: (error) => {
      toast.error(error.message || "Logout failed!");
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterPayload) => {
      const res = await apiUser.post("/register", data, {
        withCredentials: true,
      });
      return res.data;
    },
  });
};
