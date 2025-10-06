import type { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import {
  registerSchema,
  requestOtpSchema,
  verifyOtpSchema,
  updatePasswordSchema,
} from "../utils/validationSchema.js";

// Generic validation function
export const validateRequest = (schema: ZodType<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        // Use inline type instead of deprecated ZodIssue
        const errorMessages = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          message: "Validation failed",
          errors: errorMessages,
        });
      }

      console.error("Validation middleware error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Individual validation functions
export const validateRegister = validateRequest(registerSchema);
export const validateRequestOtp = validateRequest(requestOtpSchema);
export const validateVerifyOtp = validateRequest(verifyOtpSchema);
export const validateUpdatePassword = validateRequest(updatePasswordSchema);
