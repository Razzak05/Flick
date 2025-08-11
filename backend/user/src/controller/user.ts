import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../model/User.js";
import bcrypt from "bcryptjs";
import { getRedisClient } from "../config/redis.js";
import { publishToQueue } from "../config/rabbitmq.js";
import dotenv from "dotenv";

dotenv.config();

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
  otp: string;
}

interface UpdatePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export const Register = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { name, email, password }: RegisterBody = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required!",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered!",
      });
    }

    const newUser = await User.create({ name, email, password });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const Login = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { email, password, otp }: LoginBody = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If OTP is NOT provided → Step 1: Password check & send OTP
    if (!otp) {
      const isMatch = await bcrypt.compare(password!, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const redisClient = getRedisClient();
      const rateLimitKey = `otp:ratelimit:${email}`;
      const rateLimit = await redisClient.get(rateLimitKey);

      if (rateLimit) {
        return res.status(429).json({
          message: "Too many requests. Please wait before requesting new OTP",
        });
      }

      const generatedOtp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const otpKey = `otp:${email}`;
      await redisClient.set(otpKey, generatedOtp, { EX: 300 }); // 5 min expiry
      await redisClient.set(rateLimitKey, "true", { EX: 60 }); // 1 min limit

      const message = {
        to: email,
        subject: "Your OTP Code",
        body: `Your OTP is ${generatedOtp}. It's valid for 5 minutes.`,
      };

      await publishToQueue("send-otp", message);

      return res.status(200).json({
        message: "OTP sent to your email. Please verify to continue.",
      });
    }

    // If OTP is provided → Step 2: Verify OTP & login
    const redisClient = getRedisClient();
    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);

    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP is valid → remove it from Redis
    await redisClient.del(otpKey);

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    // Set HTTP-only cookie
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const UpdatePassword = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { currentPassword, newPassword }: UpdatePasswordBody = req.body;

    // userId from middleware (req.user injected after JWT verification)
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const Logout = (req: Request, res: Response): Response => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({ message: "Logged out successfully" });
};

export const myProfile = (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json(req.user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
