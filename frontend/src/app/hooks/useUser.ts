"use client";
import { useQuery } from "@tanstack/react-query";
import { apiUser } from "../lib/apiServices";
import type { User } from "../lib/interface";

export const useGetAllUsers = () => {
  const fetchAllUsers = async (): Promise<User[]> => {
    const res = await apiUser.get(`/user/all`, {
      withCredentials: true,
    });
    return res.data;
  };

  return useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: fetchAllUsers,
    staleTime: 1000 * 60 * 1,
    retry: 1,
  });
};
