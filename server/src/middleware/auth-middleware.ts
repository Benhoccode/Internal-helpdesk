import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

interface AuthTokenPayload {
  sub: string;
}

export const authenticate: RequestHandler = async (request, _response, next) => {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication token is required"));
  }

  let payload: AuthTokenPayload;
  try {
    payload = jwt.verify(
      authorization.slice(7),
      env.jwtSecret,
    ) as AuthTokenPayload;
  } catch {
    return next(new AppError(401, "Authentication token is invalid or expired"));
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId)) {
    return next(new AppError(401, "Authentication token is invalid"));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return next(new AppError(401, "The authenticated user is unavailable"));
  }

  request.user = { id: user.id, role: user.role };
  return next();
};
