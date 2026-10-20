import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../config/prisma.js";
import { UserRole } from "../generated/prisma/client.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { MAX_FILES, MAX_FILE_SIZE, validateAttachment } from "../services/attachment-validation.js";

export const attachmentRouter = Router({ mergeParams: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES, fields: 0, parts: MAX_FILES },
}).array("files", MAX_FILES);
const publicFields = {
  id: true, originalName: true, mimeType: true, size: true, createdAt: true,
  uploadedBy: { select: { id: true, fullName: true } },
} as const;

function storage() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError(503, "Chưa cấu hình dịch vụ tệp đính kèm.");
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  return cloudinary;
}

// Runs before Multer buffers any file. Employees may access only their own tickets.
attachmentRouter.use(asyncHandler(async (req, _res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError(400, "Mã yêu cầu không hợp lệ.");
  const ticket = await prisma.ticket.findFirst({
    where: { id, ...(req.user!.role === UserRole.EMPLOYEE ? { creatorId: req.user!.id } : {}) },
    select: { id: true },
  });
  if (!ticket) throw new AppError(404, "Không tìm thấy yêu cầu.");
  next();
}));

attachmentRouter.get("/", asyncHandler(async (req, res) => {
  const attachments = await prisma.ticketAttachment.findMany({
    where: { ticketId: Number(req.params.id) }, select: publicFields, orderBy: { createdAt: "asc" },
  });
  res.json({ attachments });
}));

attachmentRouter.post("/", (_req, _res, next) => {
  try { storage(); next(); } catch (error) { next(error); }
}, upload, asyncHandler(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new AppError(400, "Hãy chọn ít nhất một tệp.");
  const validated = files.map(validateAttachment);
  const cloud = storage();
  const attemptedIds: string[] = [];
  try {
    const rows = [];
    for (const [index, file] of files.entries()) {
      const info = validated[index];
      const publicId = `helpdesk/tickets/${Number(req.params.id)}/${randomUUID()}${info.extension}`;
      attemptedIds.push(publicId);
      await new Promise<void>((resolve, reject) => {
        cloud.uploader.upload_stream({
          public_id: publicId, resource_type: "raw", type: "authenticated", overwrite: false, timeout: 60000,
        }, (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve();
        }).end(file.buffer);
      });
      rows.push({ ticketId: Number(req.params.id), uploadedById: req.user!.id,
        originalName: info.originalName, mimeType: info.mimeType, size: info.size, publicId });
    }
    const attachments = await prisma.$transaction(rows.map(data =>
      prisma.ticketAttachment.create({ data, select: publicFields })));
    res.status(201).json({ attachments });
  } catch {
    const cleanup = await Promise.allSettled(attemptedIds.map(publicId =>
      cloud.uploader.destroy(publicId, { resource_type: "raw", type: "authenticated" })));
    cleanup.forEach((result, index) => {
      if (result.status === "rejected") console.error("Attachment cleanup required:", attemptedIds[index]);
    });
    throw new AppError(502, "Không thể lưu tệp đính kèm. Vui lòng thử lại.");
  }
}));

attachmentRouter.get("/:attachmentId/download", asyncHandler(async (req, res) => {
  const id = Number(req.params.attachmentId);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError(400, "Mã tệp không hợp lệ.");
  const file = await prisma.ticketAttachment.findFirst({ where: { id, ticketId: Number(req.params.id) } });
  if (!file) throw new AppError(404, "Không tìm thấy tệp.");
  const url = storage().utils.private_download_url(file.publicId, "", {
    resource_type: "raw", type: "authenticated", attachment: true,
    expires_at: Math.floor(Date.now() / 1000) + 60,
  });
  res.set("Cache-Control", "no-store").json({ url });
}));
