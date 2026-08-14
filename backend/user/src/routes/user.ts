import express from "express";
import {
  Register,
  UpdatePassword,
  Logout,
  myProfile,
  getAllUsers,
  getUserById,
  Login,
} from "../controller/user.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  validateRegister,
  validateLogin,
  validateUpdatePassword,
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.post("/register", validateRegister, Register);
router.post("/login", validateLogin, Login);
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
