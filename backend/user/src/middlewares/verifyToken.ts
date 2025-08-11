import jwt from "jsonwebtoken";
import User from "../model/User.js";
import type { Request, Response, NextFunction } from "express";
import type { IUser } from "../model/User.js";

// Extend Express Request interface to include user property
declare module "express" {
  interface Request {
    user?: IUser;
  }
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Verify token and assert type
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Assign user to request object
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Forbidden - Invalid or expired token" });
  }
};
