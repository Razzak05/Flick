import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { type IUser } from "../model/User.js";
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

interface RequestOtp {
  email: string;
  password: string;
}

interface VerifyOtp {
  email: string;
  otp: string;
}

interface UpdatePasswordBody {
  currentPassword: string;
  newPassword: string;
}

// Extend Request to include user property
interface AuthenticatedRequest extends Request {
  user?: IUser;
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

export const requestOtp = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { email, password }: RequestOtp = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
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
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp }: VerifyOtp = req.body;

    const redisClient = getRedisClient();
    const storedOtp = await redisClient.get(`otp:${email}`);

    console.log("storedOtp:", storedOtp, "incomingOtp:", otp);

    if (!storedOtp || storedOtp.trim() !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await redisClient.del(`otp:${email}`);
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.setHeader("Authorization", `Bearer ${token}`);

    const { password: pwd, ...userData } = user.toObject();

    return res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const UpdatePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response | void> => {
  try {
    const { currentPassword, newPassword }: UpdatePasswordBody = req.body;

    // userId from middleware (req.user injected after JWT verification)
    const userId = req.user?._id;
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

export const myProfile = (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Return user data without password
    const userData = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    };

    return res.json(userData);
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
