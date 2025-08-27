"use client";

import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Protect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicRoutes = ["/login", "/register"];
    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      router.push("/login");
    }
    if (isAuthenticated && publicRoutes.includes(pathname)) {
      router.push("/chat");
    }
  }, [isAuthenticated, pathname, router]);

  return <>{children}</>;
}
