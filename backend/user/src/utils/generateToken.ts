import jwt from "jsonwebtoken";

export interface ITokenPayload {
  id: string;
}

const generateToken = (userId: string): string => {
  const payload: ITokenPayload = { id: userId };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1d" });
};

export default generateToken;
