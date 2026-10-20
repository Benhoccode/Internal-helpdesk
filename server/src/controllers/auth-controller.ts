import type { Request, Response } from "express";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { passwordSchema } from "../validators/user-validator.js";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { loginSchema } from "../validators/auth-validator.js";

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function login(request: Request, response: Response) {
  const credentials = loginSchema.parse(request.body);
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user || !(await compare(credentials.password, user.passwordHash))) {
    throw new AppError(401, "Email or password is incorrect");
  }

  if (!user.isActive) {
    throw new AppError(403, "This account has been disabled");
  }

  const signOptions: SignOptions = {
    subject: String(user.id),
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };
  const token = jwt.sign({ role: user.role, version: user.tokenVersion }, env.jwtSecret, signOptions);

  response.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
}

export async function me(request: Request, response: Response) {
  const user = await prisma.user.findUnique({
    where: { id: request.user!.id },
    select: publicUserSelect,
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "The authenticated user is unavailable");
  }

  response.json({ user });
}

export async function changePassword(request: Request, response: Response) {
  const input = z.object({
    currentPassword: z.string().min(1).max(256),
    newPassword: passwordSchema,
  }).strict().parse(request.body);
  const user = await prisma.user.findUnique({ where: { id: request.user!.id } });
  if (!user || !await compare(input.currentPassword, user.passwordHash)) {
    throw new AppError(400, "Mật khẩu hiện tại không đúng.");
  }
  if (await compare(input.newPassword, user.passwordHash)) throw new AppError(400, "Mật khẩu mới phải khác mật khẩu hiện tại.");
  const result = await prisma.user.updateMany({
    where: { id: user.id, tokenVersion: user.tokenVersion },
    data: { passwordHash: await hash(input.newPassword, 12), tokenVersion: { increment: 1 } },
  });
  if (result.count !== 1) throw new AppError(409, "Tài khoản vừa thay đổi. Hãy đăng nhập lại.");
  response.json({ message: "Đã đổi mật khẩu. Vui lòng đăng nhập lại." });
}
