import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiChat } from "../lib/apiServices";
import type { Chats } from "../lib/interface";

export const useGetAllChats = () =>
  useQuery<Chats[], Error>({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await apiChat.get(`/chat/all`, { withCredentials: true });
      return res.data.chats;
    },
    retry: 1,
  });

export const useFetchChat = (chatId: string | null) =>
  useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const res = await apiChat.get(`/message/${chatId}`, {
        withCredentials: true,
      });
      return res.data;
    },
    enabled: !!chatId,
    retry: 1,
  });

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const res = await apiChat.post("/chat/new", { otherUserId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chatId,
      text,
      imageFile,
    }: {
      chatId: string;
      text?: string;
      imageFile?: File | null;
    }) => {
      const formData = new FormData();
      formData.append("chatId", chatId);
      if (text?.trim()) formData.append("text", text.trim());
      if (imageFile) formData.append("image", imageFile);
      const res = await apiChat.post("/message", formData, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.chatId],
      });
    },
  });
};
