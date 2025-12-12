/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "../redux/slices/userSlice";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Helper to get token from cookie
const getTokenFromCookie = (): string | null => {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("accessToken=")
  );
  return tokenCookie ? tokenCookie.split("=")[1] : null;
};

export function useAuthInit() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  // Store token in localStorage when available
  useEffect(() => {
    const token = getTokenFromCookie();
    if (token) {
      localStorage.setItem("accessToken", token);
    }
  }, []);

  const query = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/me`,
          {
            withCredentials: true,
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );
        return res.data.user;
      } catch (error: any) {
        // If unauthorized, clear localStorage
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle query state changes
  useEffect(() => {
    if (query.data) {
      dispatch(loginSuccess(query.data));

      // Store token if available
      const token = getTokenFromCookie();
      if (token) {
        localStorage.setItem("accessToken", token);
      }

      if (pathname === "/login" || pathname === "/register") {
        router.replace("/chat");
      }
    }
  }, [query.data, dispatch, pathname, router]);

  useEffect(() => {
    if (query.isError) {
      dispatch(logout());
      localStorage.removeItem("accessToken");

      if (pathname !== "/login" && pathname !== "/register") {
        router.replace("/login");
      }
    }
  }, [query.isError, dispatch, pathname, router]);

  return { isLoading: query.isLoading };
}
