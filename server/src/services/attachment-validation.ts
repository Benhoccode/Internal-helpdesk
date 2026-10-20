import { extname } from "node:path";
import { AppError } from "../utils/app-error.js";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILES = 5;

// Check content as well as the extension; the browser MIME type is not trusted.
export function validateAttachment(file: { originalname: string; buffer: Buffer }) {
  const name = file.originalname.split(/[\\/]/).pop()!.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (!name || name.length > 255 || !file.buffer.length || file.buffer.length > MAX_FILE_SIZE) {
    throw new AppError(400, "Tên hoặc kích thước tệp không hợp lệ (tối đa 10 MB).");
  }
  const extension = extname(name).toLowerCase();
  const bytes = file.buffer;
  let mimeType: string | undefined;
  if (extension === ".png" && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) mimeType = "image/png";
  if ([".jpg", ".jpeg"].includes(extension) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) mimeType = "image/jpeg";
  if (extension === ".pdf" && bytes.subarray(0, 5).toString() === "%PDF-") mimeType = "application/pdf";
  if ([".txt", ".log"].includes(extension)) {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) mimeType = "text/plain";
    } catch { /* Reject binary files disguised as text. */ }
  }
  if (!mimeType) throw new AppError(400, "Chỉ chấp nhận PNG, JPG, PDF, TXT hoặc LOG đúng định dạng.");
  return { originalName: name, extension, mimeType, size: bytes.length };
}
