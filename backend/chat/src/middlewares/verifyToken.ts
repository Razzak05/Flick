import jwt, { type JwtPayload } from "jsonwebtoken";
import axios from "axios";
import type { Request, Response, NextFunction } from "express";

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Verify locally first
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    try {
      // Call User Service to validate user existence
      const { data } = await axios.get(`${process.env.USER_SERVICE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      req.user = data.user;
      next();
    } catch (userServiceError) {
      console.error("User service error:", userServiceError);
      // Don't logout if user service is temporarily unavailable
      // Just fail this request
      return res.status(503).json({
        message: "User service unavailable",
      });
    }
  } catch (jwtError) {
    console.error("JWT verification error:", jwtError);
    return res.status(403).json({
      message: "Forbidden - Invalid or expired token",
    });
  }
};
