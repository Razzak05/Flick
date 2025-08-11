import express from "express";
import { Register, Login, UpdatePassword, Logout } from "../controller/user.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/register", Register);
router.post("/login", Login);
router.put("/update-password", verifyToken, UpdatePassword);
router.post("/logout", verifyToken, Logout);
export default router;
