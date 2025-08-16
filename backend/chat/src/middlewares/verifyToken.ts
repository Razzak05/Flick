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
    // Get token from cookie OR Authorization header
    let token = req.cookies?.accessToken;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Verify locally so you know it’s at least correctly signed
    jwt.verify(token, process.env.JWT_SECRET!);

    // Call User Service to validate user existence
    const { data: user } = await axios.get(
      `${process.env.USER_SERVICE_URL}/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    req.user = user;
    next();
  } catch {
    return res
      .status(403)
      .json({ message: "Forbidden - Invalid or expired token" });
  }
};
