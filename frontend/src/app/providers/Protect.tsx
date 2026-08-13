"use client";

import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Protect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth
  );
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitialized) return;

    const publicRoutes = ["/login", "/register"];
    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      router.replace("/login");
    } else if (isAuthenticated && publicRoutes.includes(pathname)) {
      router.replace("/chat");
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

  return <>{children}</>;
}
