"use client";

import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { loginSuccess, logout } from "../redux/slices/userSlice";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

export function useAuthInit() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const query = useQuery({
    queryKey: ["me"],

    queryFn: async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/me`,
        { withCredentials: true }
      );
      return res.data.user; // return clean user object
    },

    retry: false, // prevent retries on unauthorized
  });

  // Runs whenever data changes (success scenario)
  if (query.data) {
    dispatch(loginSuccess(query.data));

    if (pathname === "/login" || pathname === "/register") {
      router.replace("/chat");
    }
  }

  // Runs when request failed (error scenario)
  if (query.isError) {
    dispatch(logout());

    if (pathname !== "/login" && pathname !== "/register") {
      router.replace("/login");
    }
  }

  return { isLoading: query.isLoading };
}
