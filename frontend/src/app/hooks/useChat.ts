"use client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setMessage } from "../redux/slices/chatSlice";
import { useSendMessage } from "./useChatMutations";
import { useCallback } from "react";

export const useChat = () => {
  const dispatch = useDispatch();

  const selectedUser = useSelector(
    (state: RootState) => state.chat.selectedUser
  );
  const selectedChatId = useSelector(
    (state: RootState) => state.chat.selectedChatId
  );

  const message: string =
    useSelector((state: RootState) => state.chat.message) ?? "";

  const { mutate: sendMessage, isPending } = useSendMessage();

  const handleMessageSend = useCallback(
    (e: React.FormEvent, imageFile?: File | null) => {
      e.preventDefault();
      if (!selectedUser || !selectedChatId) return;

      if (!(message ?? "").trim() && !imageFile) return;

      // ✅ Use selectedChatId from state
      sendMessage({
        chatId: selectedChatId,
        text: message,
        imageFile,
      });

      dispatch(setMessage("")); // reset input
    },
    [dispatch, message, selectedUser, selectedChatId, sendMessage]
  );

  const handleTyping = useCallback(
    (value: string) => dispatch(setMessage(value)),
    [dispatch]
  );

  return {
    selectedUser,
    selectedChatId,
    message,
    handleMessageSend,
    handleTyping,
    sending: isPending,
  };
};
