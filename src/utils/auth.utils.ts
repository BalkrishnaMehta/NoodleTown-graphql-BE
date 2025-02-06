import jwt from "jsonwebtoken";
import { Response } from "express";
import { getConfig } from "./config.js";
import cookieOptions from "./cookieOptions.js";

const env = getConfig();

export const generateToken = (
  payload: object,
  expiresIn: string,
  secret: string
): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const generateAuthTokens = (payload: {
  id: string;
}): {
  accessToken: string;
  refreshToken: string;
} => {
  const accessToken = generateToken(payload, "1m", env.jwtAccessSecret!);
  const refreshToken = generateToken(payload, "30d", env.jwtRefreshSecret!);

  return { accessToken, refreshToken };
};

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string
): void => {
  res.cookie("refreshToken", refreshToken, cookieOptions);
};
