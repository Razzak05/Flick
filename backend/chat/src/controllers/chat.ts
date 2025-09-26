// controllers/chat.ts
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/verifyToken.js";
import Chat from "../models/chat.js";
import Message from "../models/message.js";
import axios from "axios";
import { io } from "../config/socket.js"; // <--- used to emit socket events

export const createNewChat = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      res.status(400).json({
        message: "Other userid is required",
      });
      return;
    }

    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });

    if (existingChat) {
      res.json({
        message: "Chat already exists",
        chatId: existingChat._id,
      });
      return;
    }

    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });

    res.status(201).json({
      message: "New Chat created",
      chatId: newChat._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(400).json({
        message: "UserId missing",
      });
      return;
    }

    const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });

    const chatWithUserData = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.users.find((id) => id !== userId);

        const unseenCount = await Message.countDocuments({
          chatId: chat._id,
          sender: { $ne: userId },
          seen: false,
        });

        try {
          const { data } = await axios.get(
            `${process.env.USER_SERVICE_URL}/user/${otherUserId}`
          );

          return {
            user: data,
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unseenCount,
            },
          };
        } catch (error) {
          console.error(error);
          return {
            user: { _id: otherUserId, name: "Unknown User" },
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unseenCount,
            },
          };
        }
      })
    );

    return res.status(200).json({
      chats: chatWithUserData,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching chats",
    });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const senderId = req.user?._id;
    const { chatId, text } = req.body;
    const imageFile = req.file;

    if (!senderId) {
      res.status(401).json({
        message: "unauthorized",
      });
      return;
    }

    if (!chatId) {
      res.status(400).json({
        message: "ChatId is required",
      });
      return;
    }

    if (!text && !imageFile) {
      res.status(400).json({
        message: "Either text or image is required",
      });
      return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      res.status(404).json({
        message: "Chat not found",
      });
      return;
    }

    const isUserInChat = chat.users.some(
      (userId) => userId.toString() === senderId.toString()
    );

    if (!isUserInChat) {
      res.status(403).json({
        message: "You are not a participant of this chat",
      });
      return;
    }

    const otherUserId = chat.users.find(
      (userId) => userId.toString() !== senderId.toString()
    );

    if (!otherUserId) {
      res.status(401).json({
        message: "no other user",
      });
      return;
    }

    // construct message
    let messageData: any = {
      chatId: chatId,
      sender: senderId,
      seen: false,
      seenAt: undefined,
    };

    if (imageFile) {
      messageData.image = {
        url: imageFile.path,
        publicId: imageFile.filename,
      };
      messageData.messageType = "image";
      messageData.text = text || "";
    } else {
      messageData.text = text;
      messageData.messageType = "text";
    }

    const message = new Message(messageData);
    const savedMessage = await message.save();

    const latestMessageText = imageFile ? "📷" : text;

    // update chat latestMessage and updatedAt
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        latestMessage: {
          text: latestMessageText,
          sender: senderId,
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    // compute unseen counts for both participants (each user's perspective)
    const unseenCountForOther = await Message.countDocuments({
      chatId: chatId,
      sender: { $ne: otherUserId },
      seen: false,
    });

    const unseenCountForSender = await Message.countDocuments({
      chatId: chatId,
      sender: { $ne: senderId },
      seen: false,
    });

    // Emit the saved message to the chat room (so open chat windows receive it)
    io.to(chatId).emit("newMessage", savedMessage);

    // Emit chat metadata update to the recipient's personal room
    io.to(String(otherUserId)).emit("chatUpdated", {
      chatId,
      latestMessage: {
        text: latestMessageText,
        sender: senderId,
      },
      unseenCount: unseenCountForOther,
      updatedAt: updatedChat?.updatedAt || new Date(),
    });

    // Emit chat metadata update to the sender's personal room (their unseen count may differ)
    io.to(String(senderId)).emit("chatUpdated", {
      chatId,
      latestMessage: {
        text: latestMessageText,
        sender: senderId,
      },
      unseenCount: unseenCountForSender,
      updatedAt: updatedChat?.updatedAt || new Date(),
    });

    // return saved message
    res.status(201).json({
      message: savedMessage,
      sender: senderId,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while sending message",
    });
  }
};

export const getMessagesByChat = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
      res.status(400).json({
        message: "Unauthorized",
      });
      return;
    }

    if (!chatId) {
      res.status(400).json({
        message: "ChatId Required",
      });
      return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      res.status(404).json({
        message: "Chat not found",
      });
      return;
    }

    // fixed bug: correct variable names for membership check
    const isUserInChat = chat.users.some(
      (uid) => uid.toString() === userId.toString()
    );

    if (!isUserInChat) {
      res.status(403).json({
        message: "You are not a participant of this chat",
      });
      return;
    }

    // Mark messages (sent by other user) as seen for this user
    await Message.updateMany(
      {
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      }
    );

    const messages = await Message.find({ chatId }).sort({
      createdAt: 1,
    });

    const otherUserId = chat?.users.find((id) => id !== userId);

    // compute updated unseen counts for both participants
    const unseenCountForCurrent = await Message.countDocuments({
      chatId: chatId,
      sender: { $ne: userId },
      seen: false,
    });

    const unseenCountForOther = otherUserId
      ? await Message.countDocuments({
          chatId: chatId,
          sender: { $ne: otherUserId },
          seen: false,
        })
      : 0;

    // Emit chatUpdated to both participants (so their sidebars update unread counts)
    if (otherUserId) {
      io.to(String(userId)).emit("chatUpdated", {
        chatId,
        latestMessage: chat.latestMessage || null,
        unseenCount: unseenCountForCurrent,
        updatedAt: chat.updatedAt || new Date(),
      });

      io.to(String(otherUserId)).emit("chatUpdated", {
        chatId,
        latestMessage: chat.latestMessage || null,
        unseenCount: unseenCountForOther,
        updatedAt: chat.updatedAt || new Date(),
      });
    } else {
      // only current user if other not present
      io.to(String(userId)).emit("chatUpdated", {
        chatId,
        latestMessage: chat.latestMessage || null,
        unseenCount: unseenCountForCurrent,
        updatedAt: chat.updatedAt || new Date(),
      });
    }

    try {
      if (!otherUserId) {
        res.status(400).json({
          message: "No other user",
        });
        return;
      }

      const { data } = await axios.get(
        `${process.env.USER_SERVICE_URL}/user/${otherUserId}`
      );

      res.json({
        messages,
        user: data,
      });
    } catch (error) {
      console.log(error);
      res.json({
        messages,
        user: { _id: otherUserId, name: "Unknown User" },
      });
    }
  } catch (error) {
    console.error("Error fetching message:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching message",
    });
  }
};
