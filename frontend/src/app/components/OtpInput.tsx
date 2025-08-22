"use client";
import React, { useState, useRef, ChangeEvent, KeyboardEvent } from "react";

interface OtpInputProps {
  length: number;
  onComplete: (otp: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ length, onComplete }) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    const newOtp = [...otp];

    // allow only single digit number
    newOtp[index] = value.length > 1 ? value.charAt(0) : value;

    setOtp(newOtp);

    // Auto-focus to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all digits filled → trigger callback
    if (newOtp.every((digit) => digit !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move back on Backspace if empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex space-x-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          maxLength={1}
          className="w-12 h-12 text-center text-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      ))}
    </div>
  );
};

export default OtpInput;
