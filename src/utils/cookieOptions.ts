import { CookieOptions } from "express";
import { getConfig } from "./config";

const env = getConfig();

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "none",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export default cookieOptions;
