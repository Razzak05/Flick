import express from "express";
import {
  Register,
  UpdatePassword,
  Logout,
  myProfile,
  getAllUsers,
  getUserById,
  requestOtp,
  verifyOtp,
} from "../controller/user.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/register", Register);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.put("/update-password", verifyToken, UpdatePassword);
router.post("/logout", verifyToken, Logout);
router.get("/me", verifyToken, myProfile);
router.get("/user/all", getAllUsers);
router.get("/user/:id", getUserById);

export default router;
