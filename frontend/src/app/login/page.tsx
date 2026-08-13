"use client";

import React, { useState } from "react";
import LoginForm from "./login-form/page";
import VerifyOtp from "./verify-otp/page";

const Login = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");

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
