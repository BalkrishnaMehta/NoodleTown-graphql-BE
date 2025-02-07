import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Response } from "express";
import { getConfig } from "./config.js";
import cookieOptions from "./cookieOptions.js";

const env = getConfig();

interface TokenPayload {
  id: string;
}

export const generateToken = (
  payload: TokenPayload,
  expiresIn: string | number,
  secret: Secret
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret, options);
};

export const generateAuthTokens = (payload: TokenPayload) => {
  return {
    accessToken: generateToken(payload, "15m", env.jwtAccessSecret!),
    refreshToken: generateToken(payload, "30d", env.jwtRefreshSecret!),
  };
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, cookieOptions);
};
