import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import axios from "axios";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Try multiple ways to get token
    let token = req.cookies?.accessToken;
    
    // 1. Check Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    
    // 2. Check socket token (for socket.io)
    if (!token && req.query?.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({ 
        message: "Unauthorized - No token provided" 
      });
    }

    try {
      // Verify token with user service
      const { data } = await axios.get(
        `${process.env.USER_SERVICE_URL}/me`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            Cookie: `accessToken=${token}`
          },
          withCredentials: true,
        }
      );

      if (!data.user) {
        return res.status(401).json({ 
          message: "Unauthorized - Invalid token" 
        });
      }

      req.user = data.user;
      next();
    } catch (userServiceError: any) {
      console.error("User service error:", userServiceError.response?.data || userServiceError.message);
      
      // Fallback: verify token locally
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        req.user = { _id: decoded.id };
        next();
      } catch (jwtError) {
        return res.status(401).json({
          message: "Unauthorized - Invalid token"
        });
      }
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({
      message: "Authentication error"
    });
  }
};