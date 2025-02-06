import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { AuthenticationError } from "../models/error.js";

export const getUserIdFromToken = (req: Request): string => {
  const user = req.user as JwtPayload | undefined;

  if (!user || !user.id) {
    throw new AuthenticationError("User authentication required");
  }

  return user.id;
};
