export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Message {
  _id: string;
  text?: string;
  sender: string | { _id: string }; // server may return either
  messageType?: "text" | "image";
  image?: { url: string };
  createdAt: string;
  seen?: boolean;
  seenAt?: string;
}

export interface Chat {
  _id: string;
  users: string[];
  latestMessage?: {
    text?: string;
    sender: string;
  };
  createdAt: string;
  updatedAt: string;
  unseenCount?: number;
}

export interface Chats {
  _id: string;
  user: User;
  chat: Chat;
}
