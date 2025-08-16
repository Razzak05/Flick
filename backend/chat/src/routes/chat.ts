import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createNewChat } from "../controllers/chat.js";

const router = express.Router();

router.post("/chat/new", verifyToken, createNewChat);

export default router;
