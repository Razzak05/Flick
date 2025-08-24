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
import {
  validateRegister,
  validateRequestOtp,
  validateUpdatePassword,
  validateVerifyOtp,
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.post("/register", validateRegister, Register);
router.post("/request-otp", validateRequestOtp, requestOtp);
router.post("/verify-otp", validateVerifyOtp, verifyOtp);
router.put(
  "/update-password",
  validateUpdatePassword,
  verifyToken,
  UpdatePassword
);
router.post("/logout", verifyToken, Logout);
router.get("/me", verifyToken, myProfile);
router.get("/user/all", getAllUsers);
router.get("/user/:id", getUserById);

export default router;
