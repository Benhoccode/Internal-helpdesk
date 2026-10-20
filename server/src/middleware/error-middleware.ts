import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { AppError } from "../utils/app-error.js";
import { Prisma } from "../generated/prisma/client.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, `Route ${request.method} ${request.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const codes: Record<string, [number, string]> = {
      P2002: [409, "Dữ liệu đã tồn tại (ví dụ email đã được sử dụng)."],
      P2025: [404, "Không tìm thấy dữ liệu."],
      P2034: [409, "Dữ liệu vừa thay đổi bởi thao tác khác. Hãy tải lại và thử lại."],
    };
    if (codes[error.code]) {
      const [status, message] = codes[error.code];
      response.status(status).json({ message });
      return;
    }
  }
  if (error instanceof MulterError) {
    response.status(400).json({ message: "Tệp không hợp lệ: tối đa 5 tệp, mỗi tệp 10 MB; trường upload phải là files." });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Request data is invalid",
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Internal server error" });
};
