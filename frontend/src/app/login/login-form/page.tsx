/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useLogin } from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/slices/userSlice";
import { useRouter } from "next/navigation";

// Zod schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const login = useLogin();
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = (data: LoginFormData) => {
    const email = data.email.trim().toLowerCase();

    login.mutate({ ...data, email }, {
      onSuccess: ({ user, token }) => {
        localStorage.setItem("accessToken", token);
        dispatch(loginSuccess(user));
        toast.success("Login successful!");
        router.replace("/chat");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Login failed");
      },
    });
  };

  return (
    <div className="max-w-md w-full">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-4 bg-gray-600 rounded-lg text-white placeholder-gray-400"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={login.isPending}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {login.isPending ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Navigation */}
        <p className="text-gray-400 text-center mt-6">
          Don’t have an account?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
