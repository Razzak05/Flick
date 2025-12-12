/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Mail } from "lucide-react";
import OtpInput from "../../components/OtpInput";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useVerifyOtp } from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/slices/userSlice";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

type OtpFormData = z.infer<typeof otpSchema>;

interface VerifyOtpProps {
  email: string;
  onBack: () => void;
}

const VerifyOtp: React.FC<VerifyOtpProps> = ({ email, onBack }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const verifyOtp = useVerifyOtp();

  const {
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({ resolver: zodResolver(otpSchema) });

  const handleOtpComplete = (otpValue: string) => {
    setValue("otp", otpValue, { shouldValidate: true });
  };

  const handleVerifyOtp = (data: OtpFormData) => {
    verifyOtp.mutate(
      { email, otp: data.otp },
      {
        onSuccess: (user) => {
          dispatch(loginSuccess(user));

          // Store token for chat service
          const getTokenFromCookie = () => {
            const cookies = document.cookie.split(";");
            const tokenCookie = cookies.find((cookie) =>
              cookie.trim().startsWith("accessToken=")
            );
            return tokenCookie ? tokenCookie.split("=")[1] : null;
          };

          const token = getTokenFromCookie();
          if (token) {
            localStorage.setItem("accessToken", token);
          }

          toast.success("Login Successful!");
          queryClient.invalidateQueries({ queryKey: ["chats"] });
          queryClient.invalidateQueries({ queryKey: ["users"] });
          router.push("/chat");
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message || error?.message || "Invalid OTP";
          toast.error(message);
        },
      }
    );
  };

  return (
    <div className="max-w-md w-full">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
            <Mail size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Enter Verification Code
          </h1>
          <p className="text-gray-300">
            We sent an OTP to <span className="text-white">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(handleVerifyOtp)}>
          <OtpInput length={6} onComplete={handleOtpComplete} />

          {errors.otp && (
            <p className="mt-2 text-sm text-red-400 text-center">
              {errors.otp.message}
            </p>
          )}

          <button
            type="submit"
            disabled={verifyOtp.isPending}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {verifyOtp.isPending ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full mt-4 py-2 text-gray-300 font-medium hover:text-white"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
