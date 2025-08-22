"use client";

import { Mail } from "lucide-react";
import React, { ChangeEvent, useState } from "react";
import OtpInput from "../components/OtpInput";
import { useRequestOtp, useVerifyOtp } from "../hooks/useAuth";
import toast from "react-hot-toast";

interface FormData {
  email: string;
  password: string;
  otp: string;
}

const Login = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState<boolean>(false);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendOtp = async () => {
    requestOtp.mutate(
      { email: formData.email, password: formData.password },
      {
        onSuccess: () => {
          setOtpSent(true);
        },
      }
    );
  };

  const handleOtpComplete = (otpValue: string) => {
    setFormData((prev) => ({ ...prev, otp: otpValue }));
  };

  const handleVerifyOtp = async () => {
    console.log("Sending verify payload:", {
      email: formData.email,
      otp: formData.otp,
    });
    verifyOtp.mutate(
      { email: formData.email, otp: formData.otp },
      {
        onSuccess: () => {
          toast.success("Login successful !");
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
                Start Your Journey, Enter your email !
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="space-y-6"
            >
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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-4 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                  placeholder="example@gmail.com"
                  required
                />
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-4 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                  required
                />
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
        <div className="bg-gray-800 p-8 rounded-lg flex flex-col">
          <h2 className="items-center text-2xl font-semibold mb-4 text-white">
            Enter OTP
          </h2>
          <OtpInput length={6} onComplete={handleOtpComplete} />
          <button
            onClick={handleVerifyOtp}
            disabled={verifyOtp.isPending}
            className="w-full mt-3 items-center text-white font-medium bg-green-500 hover:bg-green-600 p-2 disabled:opacity-50"
          >
            {verifyOtp.isPending ? "Verifying..." : "Verify Otp"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
