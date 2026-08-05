import type { RequestHandler } from "express";
import type { UserRole } from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user) {
      return next(new AppError(401, "Authentication is required"));
    }

    if (!allowedRoles.includes(request.user.role)) {
      return next(new AppError(403, "You do not have permission for this action"));
    }

    return next();
  };
}
