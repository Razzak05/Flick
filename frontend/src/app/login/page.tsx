/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Mail } from "lucide-react";
import React, { useState } from "react";
import OtpInput from "../components/OtpInput";
import { useRequestOtp, useVerifyOtp } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/slices/userSlice";

// Define Zod schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

// Infer types from Zod schemas
type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

const Login = () => {
  const router = useRouter();
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const dispatch = useDispatch();

  // Setup React Hook Form for login
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Setup React Hook Form for OTP
  const {
    setValue,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const handleSendOtp = (data: LoginFormData) => {
    setEmail(data.email);
    requestOtp.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          setOtpSent(true);
          toast.success("OTP sent successfully!");
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to send OTP");
        },
      }
    );
  };

  const handleOtpComplete = (otpValue: string) => {
    setValue("otp", otpValue, { shouldValidate: true });
  };

  const handleVerifyOtp = (data: OtpFormData) => {
    verifyOtp.mutate(
      { email, otp: data.otp },
      {
        onSuccess: (response) => {
          dispatch(loginSuccess(response?.data?.user));
          toast.success("Login successful!");
          router.push("/chat");
        },
        onError: (error: any) => {
          toast.error(error.message || "Invalid OTP");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {!otpSent ? (
        <div className="max-w-md w-full">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Mail size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">
                Welcome to Flick
              </h1>
              <p className="text-gray-300 text-lg">
                Start Your Journey, Enter your email!
              </p>
            </div>

            <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-4 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="example@gmail.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-4 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={requestOtp.isPending}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {requestOtp.isPending ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </div>
        </div>
      ) : (
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
                We've sent a 6-digit code to {email}
              </p>
            </div>

            <form onSubmit={handleOtpSubmit(handleVerifyOtp)}>
              <div className="mb-6">
                <OtpInput length={6} onComplete={handleOtpComplete} />
                {otpErrors.otp && (
                  <p className="mt-2 text-sm text-red-400 text-center">
                    {otpErrors.otp.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyOtp.isPending}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {verifyOtp.isPending ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full mt-4 py-2 text-gray-300 font-medium rounded-lg hover:text-white"
              >
                Back to login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
