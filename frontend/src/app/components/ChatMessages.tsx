/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef } from "react";
import { useFetchChat } from "../hooks/useChat";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Message } from "../chat/page";
import Image from "next/image";

const ChatMessages = () => {
  const { selectedChatId, selectedUser } = useSelector(
    (state: RootState) => state.chat
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { data } = useFetchChat(selectedChatId);

  const bottomRef = useRef<HTMLDivElement>(null);

  //seen feature to add
  const uniqueMessages = useMemo(() => {
    if (!data || !data.messages) return [];
    const seen = new Set();
    return data.messages.filter((message: Message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [data]);

  useEffect(() => {
    if (uniqueMessages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedUser, uniqueMessages]);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2">
        {!selectedUser || !selectedChatId ? (
          <p className="text-gray-400 text-center mt-20">
            Please select a user to start chatting 💌
          </p>
        ) : (
          <>
            {uniqueMessages.map((e: any, i: number) => {
              const isSentByMe = e.sender === user?._id;
              const uniqueKey = `{e._id}-${i}`;

              return (
                <div
                  key={uniqueKey}
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
                    {e.messageType === "image" && e.image && (
                      <div className="relative">
                        <Image
                          src={e.image.url}
                          width={300}
                          height={200}
                          alt="shared image"
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    )}

                    {e.text && <p className="mt-1">{e.text}</p>}
                  </div>

                  <div
                    className={`flex items-center gap-1 text-xs text-gray-400 ${
                      isSentByMe ? "pr-2 flex-row-reverse" : "pl-2"
                    }`}
                  >
                    <span></span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
