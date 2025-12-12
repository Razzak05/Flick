import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from multiple sources
    let token: string | undefined;

    // 1. Check Authorization header first
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // 2. Check cookies
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    // 3. Check query parameter (for socket.io)
    else if (req.query?.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized - No token provided",
      });
    }

    try {
      // IMPORTANT: Use the SAME JWT_SECRET as user service
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // Set user in request
      req.user = {
        _id: decoded.id,
        id: decoded.id,
      };

      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(403).json({
        message: "Forbidden - Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      message: "Authentication error",
    });
  }
};
