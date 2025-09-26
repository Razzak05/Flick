"use client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setMessage } from "../redux/slices/chatSlice";
import { useSendMessage } from "./useChatMutations";
import { useCallback, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

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

  const { socket } = useSocket();

  // typing debounce timer ref
  const typingTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const TYPING_TIMEOUT = 1500; // ms of inactivity to consider stopped typing

  // send typing state helper
  const emitTypingState = (isTyping: boolean) => {
    if (!socket || !selectedChatId) return;
    socket.emit("typing", { roomId: selectedChatId, isTyping });
  };

  const handleMessageSend = useCallback(
    (e: React.FormEvent, imageFile?: File | null) => {
      e.preventDefault();
      if (!selectedUser || !selectedChatId) return;

      if (!(message ?? "").trim() && !imageFile) return;

      // send message via API (mutation) -- server updates DB/chat.latestMessage
      sendMessage({
        chatId: selectedChatId,
        text: message,
        imageFile,
      });

      // after sending, reset input and notify stop typing
      dispatch(setMessage(""));

      if (isTypingRef.current) {
        emitTypingState(false);
        isTypingRef.current = false;
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = null;
        }
      }
    },
    [dispatch, message, selectedUser, selectedChatId, sendMessage, socket]
  );

  const handleTyping = useCallback(
    (value: string) => {
      dispatch(setMessage(value));

      if (!socket || !selectedChatId) return;

      // If not already typing, emit typing = true immediately
      if (!isTypingRef.current && value.trim().length > 0) {
        emitTypingState(true);
        isTypingRef.current = true;
      }

      // clear previous timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      // If input becomes empty, immediately emit typing=false
      if (value.trim().length === 0) {
        if (isTypingRef.current) {
          emitTypingState(false);
          isTypingRef.current = false;
        }
        typingTimerRef.current = null;
        return;
      }

      // set timer to emit typing=false after inactivity
      typingTimerRef.current = window.setTimeout(() => {
        if (isTypingRef.current) {
          emitTypingState(false);
          isTypingRef.current = false;
        }
        typingTimerRef.current = null;
      }, TYPING_TIMEOUT);
    },
    [dispatch, socket, selectedChatId]
  );

  // ensure we clear typing on unmount
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        emitTypingState(false);
        isTypingRef.current = false;
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    selectedUser,
    selectedChatId,
    message,
    handleMessageSend,
    handleTyping,
    sending: isPending,
  };
};
