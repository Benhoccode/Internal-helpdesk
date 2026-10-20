import { Router } from "express";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { authorize } from "../middleware/role-middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { createUserSchema, passwordSchema, userQuerySchema } from "../validators/user-validator.js";

export const userRouter = Router();
userRouter.use(authenticate, authorize("ADMIN"));
const publicFields = { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true } as const;
const idSchema = z.coerce.number().int().positive();

userRouter.get("/assignees", asyncHandler(async (_req, res) => {
  res.json({ users: await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true, fullName: true, email: true }, orderBy: { fullName: "asc" },
  }) });
}));

userRouter.get("/", asyncHandler(async (req, res) => {
  const { search, page } = userQuerySchema.parse(req.query);
  const where = search ? { OR: [
    { fullName: { contains: search, mode: "insensitive" as const } },
    { email: { contains: search, mode: "insensitive" as const } },
  ] } : {};
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: publicFields, orderBy: { id: "desc" }, skip: (page - 1) * 20, take: 20 }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, total, page });
}));

userRouter.post("/", asyncHandler(async (req, res) => {
  const { password, ...input } = createUserSchema.parse(req.body);
  const user = await prisma.user.create({
    data: { ...input, passwordHash: await hash(password, 12) }, select: publicFields,
  });
  res.status(201).json({ user });
}));

userRouter.patch("/:id/active", asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const { isActive } = z.object({ isActive: z.boolean() }).strict().parse(req.body);
  if (id === req.user!.id) throw new AppError(400, "Không thể khóa/mở khóa tài khoản của chính mình.");
  const user = await prisma.$transaction(async tx => {
    const target = await tx.user.findUnique({ where: { id } });
    if (!target) throw new AppError(404, "Không tìm thấy tài khoản.");
    if (!isActive && target.role === "ADMIN" && target.isActive) {
      const count = await tx.user.count({ where: { role: "ADMIN", isActive: true } });
      if (count <= 1) throw new AppError(409, "Phải giữ ít nhất một quản trị viên hoạt động.");
    }
    return tx.user.update({ where: { id }, data: { isActive, tokenVersion: { increment: 1 } }, select: publicFields });
  }, { isolationLevel: "Serializable" });
  res.json({ user });
}));

userRouter.post("/:id/reset-password", asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const { password } = z.object({ password: passwordSchema }).strict().parse(req.body);
  if (id === req.user!.id) throw new AppError(400, "Hãy dùng chức năng Đổi mật khẩu cá nhân.");
  await prisma.user.update({ where: { id }, data: {
    passwordHash: await hash(password, 12), tokenVersion: { increment: 1 },
  } });
  res.json({ message: "Đã đặt lại mật khẩu và thu hồi các phiên đăng nhập cũ." });
}));
