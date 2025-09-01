// useGetAllChats.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiChat } from "../lib/apiServices";
import type { Chats } from "../lib/interface";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

export const useGetAllChats = () => {
  const fetchAllChats = async (): Promise<Chats[]> => {
    const res = await apiChat.get(`/chat/all`, {
      withCredentials: true,
    });
    return res.data;
  };

  return useQuery<Chats[], Error>({
    queryKey: ["chats"],
    queryFn: fetchAllChats,
    staleTime: 1000 * 60 * 1,
    retry: 1,
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const res = await apiChat.post("/chat/new", {
        userId: user?._id,
        otherUserId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
