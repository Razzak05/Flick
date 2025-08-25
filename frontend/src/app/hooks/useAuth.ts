"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiUser } from "../lib/apiServices";

interface RequestOtpPayload {
  email: string;
  password: string;
}

interface VerifyOtpPayload {
  email: string;
  otp: string;
}

// Request OTP
export const useRequestOtp = () => {
  return useMutation({
    mutationFn: async (data: RequestOtpPayload) => {
      const res = await apiUser.post(`/request-otp`, data, {
        withCredentials: true,
      });
      return res.data;
    },
  });
};

// Verify OTP
export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (data: VerifyOtpPayload) => {
      const res = await apiUser.post(`/verify-otp`, data, {
        withCredentials: true,
      });
      return res.data;
    },
  });
};

export const useGetAllUsers = () => {
  const fetchAllUsers = async () => {
    const res = await apiUser.get(`/user/all`, {
      withCredentials: true,
    });
    return res.data;
  };

  return useQuery({
    queryKey: ["users"],
    queryFn: fetchAllUsers,
  });
};
