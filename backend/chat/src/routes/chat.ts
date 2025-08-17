import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  createNewChat,
  getAllChats,
  sendMessage,
} from "../controllers/chat.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/chat/new", verifyToken, createNewChat);
router.get("/chat/all", verifyToken, getAllChats);
router.post("/message", verifyToken, upload.single("image"), sendMessage);

export default router;
