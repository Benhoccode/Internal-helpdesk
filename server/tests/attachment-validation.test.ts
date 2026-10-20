import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_FILE_SIZE, validateAttachment } from "../src/services/attachment-validation.js";

test("accepts UTF-8 logs and strips path components", () => {
  const result = validateAttachment({ originalname: "../error.log", buffer: Buffer.from("Lỗi VPN\n") });
  assert.equal(result.originalName, "error.log");
  assert.equal(result.mimeType, "text/plain");
});
test("accepts known PNG, JPEG and PDF signatures", () => {
  for (const [name, bytes] of [
    ["a.png", Buffer.from([137,80,78,71,13,10,26,10])],
    ["a.jpg", Buffer.from([255,216,255])],
    ["a.pdf", Buffer.from("%PDF-1.7")],
  ] as const) assert.ok(validateAttachment({ originalname: name, buffer: bytes }));
});
test("rejects spoofed file names and binary text", () => {
  for (const [name, bytes] of [
    ["a.png", Buffer.from("not an image")], ["a.exe", Buffer.from("exe")],
    ["a.txt", Buffer.from([0,1,2])], ["a.log", Buffer.from([255,255])],
  ] as const) assert.throws(() => validateAttachment({ originalname: name, buffer: bytes }));
});
test("rejects empty or oversized attachments", () => {
  for (const size of [0, MAX_FILE_SIZE + 1]) assert.throws(() =>
    validateAttachment({ originalname: "a.log", buffer: Buffer.alloc(size) }));
});
