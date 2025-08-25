"use client";

import { useQuery } from "@tanstack/react-query";
import { apiChat } from "../lib/apiServices";

export const useGetAllChats = () => {
  const fetchAllChats = async () => {
    const res = await apiChat.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL_CHAT_SERVICE}/chat/all`,
      {
        withCredentials: true,
      }
    );
    return res.data;
  };

  return useQuery({
    queryKey: ["chats"],
    queryFn: fetchAllChats,
  });
};
