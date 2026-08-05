import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "../generated/prisma/client.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}

export const authenticate: RequestHandler = (request, _response, next) => {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication token is required"));
  }

  try {
    const token = authorization.slice(7);
    const payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    const userId = Number(payload.sub);

    if (!Number.isInteger(userId) || !payload.role) {
      return next(new AppError(401, "Authentication token is invalid"));
    }

    request.user = { id: userId, role: payload.role };
    return next();
  } catch {
    return next(new AppError(401, "Authentication token is invalid or expired"));
  }
};
