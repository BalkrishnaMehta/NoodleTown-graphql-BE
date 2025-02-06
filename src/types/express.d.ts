import { JwtPayload } from "jsonwebtoken";
import { User } from "../middlewares/models/user";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
