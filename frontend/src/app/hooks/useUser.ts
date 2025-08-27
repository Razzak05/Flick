"use client";
import { useQuery } from "@tanstack/react-query";
import { apiUser } from "../lib/apiServices";

export const useGetAllUsers = () => {
  const fetchAllUsers = async () => {
    const res = await apiUser.get(`/user/all`, {
      withCredentials: true,
    });
    return res.data;
  };

  return useQuery({
    queryKey: ["users"],
    queryFn: fetchAllUsers,
  });
};
