"use client";

import { Paperclip, X } from "lucide-react";
import Image from "next/image";
import React, { FormEvent, useState } from "react";

interface MessageInputProps {
  selectedUser: string | null;
  message: string;
  setMessage: (value: string) => void;
  handleMessageSend: (
    e: FormEvent<HTMLFormElement>,
    imageFile?: File | null
  ) => void;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  selectedUser,
  message,
  setMessage,
  handleMessageSend,
  sending,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    // ✅ message coerced to string before trim
    if (!(message ?? "").trim() && !imageFile) return;

    handleMessageSend(e, imageFile);
    setMessage("");
    setImageFile(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-gray-700 pt-2"
    >
      {imageFile && (
        <div className="relative w-fit">
          <Image
            src={URL.createObjectURL(imageFile)}
            alt="preview"
            width={96}
            height={96}
            className="w-24 h-24 object-cover rounded-lg border border-gray-700"
          />
          <button
            type="button"
            aria-label="Remove attached image"
            className="absolute -top-2 -right-2 bg-black rounded-full p-1"
            onClick={() => setImageFile(null)}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors">
          <Paperclip size={18} className="text-gray-300" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file?.type.startsWith("image/")) setImageFile(file);
            }}
          />
        </label>

        <input
          type="text"
          value={message ?? ""} // ✅ ensure controlled value
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <button
          type="submit"
          disabled={(!(message ?? "").trim() && !imageFile) || sending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
