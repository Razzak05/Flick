"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiChat } from "../lib/apiServices";
import type { Chats } from "../lib/interface";

export const useGetAllChats = () => {
  const fetchAllChats = async (): Promise<Chats[]> => {
    const res = await apiChat.get(`/chat/all`, {
      withCredentials: true,
    });
    return res.data.chats; // Return the chats array directly
  };

  return useQuery<Chats[], Error>({
    queryKey: ["chats"],
    queryFn: fetchAllChats,
    retry: 1,
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const res = await apiChat.post("/chat/new", { otherUserId });
      return res.data;
    },
    onSuccess: () => {
      // Force refresh of chats list
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useFetchChat = (chatId: string | null) => {
  const fetchChat = async () => {
    const res = await apiChat.get(`/message/${chatId}`, {
      withCredentials: true,
    });
    return res.data;
  };

  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: fetchChat,
    retry: 1,
  });
};
