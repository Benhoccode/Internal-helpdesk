import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { Writable } from "node:stream";
import express from "express";
import type { AddressInfo } from "node:net";

process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/test";
process.env.JWT_SECRET = "attachment-test-only-secret-over-32-characters";
process.env.CLOUDINARY_CLOUD_NAME = "test";
process.env.CLOUDINARY_API_KEY = "test";
process.env.CLOUDINARY_API_SECRET = "test";

test("attachment routes with mocked database and storage (no external writes)", async t => {
  const { prisma } = await import("../src/config/prisma.js");
  const { attachmentRouter } = await import("../src/routes/attachment-routes.js");
  const { errorHandler } = await import("../src/middleware/error-middleware.js");
  const { v2: cloud } = await import("cloudinary");
  let allowed = true;
  let failDatabase = false;
  let uploaded = 0;
  let destroyed = 0;
  let accessWhere: unknown;
  let previewMime = "image/png";
  // Prisma delegates are proxies; assign stubs instead of descriptor-based mock.method.
  const db = prisma as any;
  db.ticket.findFirst = async (args: { where: unknown }) => {
    accessWhere = args.where; return allowed ? { id: 10 } : null;
  };
  db.ticketAttachment.findMany = async () => [];
  db.ticketAttachment.create = () => ({ id: 1 });
  db.ticketAttachment.findFirst = async () => ({ publicId: "test/a.log", mimeType: previewMime });
  db.$transaction = async () => {
    if (failDatabase) throw new Error("simulated database failure");
    return [{ id: 1 }];
  };
  mock.method(cloud.uploader, "upload_stream", (_options: unknown, callback: (error: null, result: object) => void) =>
    new Writable({ write(_chunk, _encoding, done) { done(); },
      final(done) { uploaded++; callback(null, { public_id: "test" }); done(); } }));
  mock.method(cloud.uploader, "destroy", async () => { destroyed++; return { result: "ok" }; });
  const realFetch = globalThis.fetch;
  let storageFails = false;
  mock.method(globalThis, "fetch", (input: string | URL | Request, init?: RequestInit) => {
    if (String(input).startsWith("https://api.cloudinary.com/")) {
      return Promise.resolve(storageFails ? new Response("Unavailable", { status: 503 })
        : new Response(new Uint8Array([137,80,78,71,13,10,26,10])));
    }
    return realFetch(input, init);
  });

  const app = express();
  app.use((req, _res, next) => { req.user = { id: 7, role: "EMPLOYEE" }; next(); });
  app.use("/tickets/:id/attachments", attachmentRouter);
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/tickets/10/attachments`;
  function form(count = 1) {
    const data = new FormData();
    for (let i = 0; i < count; i++) data.append("files", new Blob(["VPN failed"]), `error${i}.log`);
    return data;
  }
  try {
    await t.test("employee access is scoped to owner", async () => {
      assert.equal((await fetch(base)).status, 200);
      assert.deepEqual(accessWhere, { id: 10, creatorId: 7 });
    });
    await t.test("inaccessible tickets reject upload before Cloudinary", async () => {
      allowed = false;
      assert.equal((await fetch(base, { method: "POST", body: form() })).status, 404);
      assert.equal(uploaded, 0);
      assert.equal((await fetch(base + "/1/download")).status, 404);
      assert.equal((await fetch(base + "/1/preview")).status, 404);
      allowed = true;
    });
    await t.test("upload persists metadata", async () => {
      assert.equal((await fetch(base, { method: "POST", body: form() })).status, 201);
      assert.equal(uploaded, 1);
    });
    await t.test("six files are rejected", async () => {
      assert.equal((await fetch(base, { method: "POST", body: form(6) })).status, 400);
      assert.equal(uploaded, 1);
    });
    await t.test("database failure triggers Cloudinary cleanup", async () => {
      failDatabase = true;
      assert.equal((await fetch(base, { method: "POST", body: form() })).status, 502);
      assert.equal(destroyed, 1);
    });
    await t.test("download uses short-lived authenticated signature", async () => {
      const response = await fetch(base + "/1/download");
      assert.equal(response.status, 200);
      const url = new URL((await response.json()).url);
      assert.equal(url.searchParams.get("type"), "authenticated");
      assert.ok(url.searchParams.get("signature"));
      const remaining = Number(url.searchParams.get("expires_at")) - Date.now() / 1000;
      assert.ok(remaining > 50 && remaining <= 60);
      assert.equal(response.headers.get("cache-control"), "no-store");
    });
    await t.test("preview returns private inline image bytes", async () => {
      const response = await fetch(base + "/1/preview");
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "image/png");
      assert.equal(response.headers.get("content-disposition"), "inline");
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal((await response.arrayBuffer()).byteLength, 8);
    });
    await t.test("preview rejects non-image files and invalid IDs", async () => {
      previewMime = "text/plain";
      assert.equal((await fetch(base + "/1/preview")).status, 415);
      assert.equal((await fetch(base + "/abc/preview")).status, 400);
      previewMime = "image/png";
    });
    await t.test("preview handles storage failure", async () => {
      storageFails = true;
      assert.equal((await fetch(base + "/1/preview")).status, 502);
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    mock.restoreAll();
    await prisma.$disconnect();
  }
});
