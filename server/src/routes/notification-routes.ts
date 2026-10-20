import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const notificationRouter = Router();
notificationRouter.use(authenticate);
const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });
const idSchema = z.coerce.number().int().positive();

notificationRouter.get("/", asyncHandler(async (req, res) => {
  const { page } = querySchema.parse(req.query);
  const where = { recipientId: req.user!.id,
    ...(req.user!.role === "EMPLOYEE" ? { ticket: { creatorId: req.user!.id } } : {}) };
  const [notifications, unreadCount, total] = await prisma.$transaction([
    prisma.notification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 20 }),
    prisma.notification.count({ where: { ...where, readAt: null } }),
    prisma.notification.count({ where }),
  ]);
  res.set("Cache-Control", "no-store").json({ notifications, unreadCount, total, page });
}));

notificationRouter.patch("/read-all", asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { recipientId: req.user!.id, readAt: null,
      ...(req.user!.role === "EMPLOYEE" ? { ticket: { creatorId: req.user!.id } } : {}) },
    data: { readAt: new Date() },
  });
  res.json({ message: "Đã đánh dấu tất cả thông báo là đã đọc." });
}));

notificationRouter.patch("/:id/read", asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const where = { id, recipientId: req.user!.id,
    ...(req.user!.role === "EMPLOYEE" ? { ticket: { creatorId: req.user!.id } } : {}) };
  const notification = await prisma.notification.findFirst({ where });
  if (!notification) throw new AppError(404, "Không tìm thấy thông báo.");
  if (!notification.readAt) await prisma.notification.updateMany({ where: { ...where, readAt: null }, data: { readAt: new Date() } });
  res.json({ message: "Đã đọc." });
}));
