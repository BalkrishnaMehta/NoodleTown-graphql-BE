declare module "jsonwebtoken" {
  import {
    Secret,
    SignOptions,
    VerifyOptions,
    VerifyErrors,
    JwtPayload,
  } from "jsonwebtoken";

  function verify(
    token: string,
    secretOrPublicKey: Secret,
    options?: VerifyOptions
  ): string | JwtPayload;

  function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: Secret,
    options?: SignOptions
  ): string;

  export { Secret, SignOptions, VerifyOptions, VerifyErrors, JwtPayload };
  export { verify, sign };
}

declare module "bcrypt" {
  function compare(data: string, encrypted: string): Promise<boolean>;
  function hash(data: string, saltOrRounds: string | number): Promise<string>;
  function genSalt(rounds?: number): Promise<string>;
  export { compare, hash, genSalt };
}

declare module "cookie-parser" {
  import { RequestHandler } from "express";
  function cookieParser(): RequestHandler;
  export = cookieParser;
}

declare module "cors" {
  import { RequestHandler } from "express";
  interface CorsOptions {
    origin?: string | string[] | boolean;
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }
  function cors(options?: CorsOptions): RequestHandler;
  export = cors;
}
