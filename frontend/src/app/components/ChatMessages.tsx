/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef } from "react";
import { useFetchChat } from "../hooks/useChatMutations";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import type { Message } from "../lib/interface";
import Image from "next/image";
import moment from "moment";
import { Check, CheckCheck } from "lucide-react";

const ChatMessages: React.FC = () => {
  const { selectedChatId, selectedUser } = useSelector(
    (state: RootState) => state.chat
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { data } = useFetchChat(selectedChatId);

  const bottomRef = useRef<HTMLDivElement>(null);

  const uniqueMessages = useMemo<Message[]>(() => {
    if (!data?.messages) return [];
    const seen = new Set<string>();
    return data.messages.filter((msg: Message) => {
      if (seen.has(msg._id)) return false;
      seen.add(msg._id);
      return true;
    });
  }, [data]);

  useEffect(() => {
    if (uniqueMessages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedUser, uniqueMessages]);

  if (!selectedUser || !selectedChatId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">
          Please select a user to start chatting 💌
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2">
        {uniqueMessages.map((m: Message, i) => {
          const senderId =
            typeof m.sender === "string" ? m.sender : m.sender._id;
          const isSentByMe = senderId === user?._id;

          return (
            <div
              key={`${m._id}-${i}`}
              className={`flex flex-col gap-1 mt-2 ${
                isSentByMe ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-lg p-3 max-w-sm ${
                  isSentByMe
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-white"
                }`}
              >
                {m.messageType === "image" && m.image?.url && (
                  <Image
                    src={m.image.url}
                    width={300}
                    height={200}
                    alt="shared image"
                    className="max-w-full h-auto rounded-lg"
                  />
                )}

                {m.text && <p className="mt-1">{m.text}</p>}
              </div>

              <div
                className={`flex items-center gap-1 text-xs text-gray-400 ${
                  isSentByMe ? "pr-2 flex-row-reverse" : "pl-2"
                }`}
              >
                <span>{moment(m.createdAt).format("hh:mm A. MMM D")}</span>
                {isSentByMe && (
                  <div className="flex items-center ml-1">
                    {m.seen ? (
                      <div className="flex items-center gap-1 text-blue-400">
                        <CheckCheck className="w-3 h-3" />
                        {m.seenAt && (
                          <span>{moment(m.seenAt).format("hh:mm A")}</span>
                        )}
                      </div>
                    ) : (
                      <Check className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
