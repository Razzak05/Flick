"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";

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
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL_USER_SERVICE}/request-otp`,
        data,
        { withCredentials: true }
      );
      return res.data;
    },
  });
};

// Verify OTP
export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (data: VerifyOtpPayload) => {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL_USER_SERVICE}/verify-otp`,
        data,
        { withCredentials: true }
      );
      return res.data;
    },
  });
};
