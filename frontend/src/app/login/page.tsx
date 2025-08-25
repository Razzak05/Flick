"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import LoginForm from "./login-form/page";
import VerifyOtp from "./verify-otp/page";

const Login = () => {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {!otpSent ? (
        <LoginForm
          onOtpSent={(userEmail) => {
            setEmail(userEmail);
            setOtpSent(true);
          }}
        />
      ) : (
        <VerifyOtp email={email} onBack={() => setOtpSent(false)} />
      )}
    </div>
  );
};

export default Login;
