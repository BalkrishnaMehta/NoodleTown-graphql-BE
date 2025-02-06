import { Request, Response } from "express";
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
} from "../models/error.js";
import { APIResponse } from "./APIResponse.js";

type AsyncRequestHandler = (
  req: Request,
  res: Response
) => Promise<Response | void>;

export const requestHandler = (handler: AsyncRequestHandler) => {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof AuthenticationError ||
        error instanceof NotFoundError ||
        error instanceof ConflictError
      ) {
        return res
          .status(error.statusCode)
          .json(APIResponse.error(error.message, error, error.statusCode));
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res
        .status(500)
        .json(
          APIResponse.error(
            errorMessage,
            error instanceof Error ? error : new Error(errorMessage)
          )
        );
    }
  };
};
