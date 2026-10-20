// Uses a NEW, disposable local database. Never migrates or seeds the configured database.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { Client } from "pg";
import { hash } from "bcryptjs";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

const originalUrl = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1", "[::1]"].includes(originalUrl.hostname)) {
  throw new Error("Integration tests require LOCAL PostgreSQL; remote databases are refused.");
}
const databaseName = `helpdesk_test_${randomUUID().replaceAll("-", "")}`;
const admin = new Client({ connectionString: originalUrl.toString() });
let databaseCreated = false;
let server: Server | undefined;
let prisma: typeof import("../src/config/prisma.js").prisma | undefined;
let checks = 0;
try {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  databaseCreated = true;
  const isolatedUrl = new URL(originalUrl);
  isolatedUrl.pathname = `/${databaseName}`;
  process.env.DATABASE_URL = isolatedUrl.toString();
  process.env.JWT_SECRET = "integration-only-not-for-real-accounts-123456789";
  process.env.CLIENT_URL = "http://127.0.0.1:5191";
  const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    cwd: process.cwd(), env: process.env, encoding: "utf8",
  });
  assert.equal(migration.status, 0, `Migration failed: ${migration.stderr}`);
  console.log("PASS: all migrations applied to disposable local database");
  const imported = await import("../src/config/prisma.js");
  prisma = imported.prisma;
  const { app } = await import("../src/app.js");
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server!.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const password = "Integration-Password-123!";
  const owner = await prisma.user.create({ data: { fullName: "Admin One", email: "admin1@test.invalid", passwordHash: await hash(password, 4), role: "ADMIN" } });
  const category = await prisma.category.create({ data: { name: "Integration network" } });
  async function request(method: string, path: string, token?: string, body?: unknown, expected = 200) {
    const response = await fetch(base + path, {
      method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
    checks++;
    return data;
  }
  async function login(email: string, pwd = password) { return (await request("POST", "/auth/login", undefined, { email, password: pwd })).token as string; }
  const a = await login(owner.email);
  const staff = (await request("POST", "/users", a, { fullName: "Admin Two", email: "admin2@test.invalid", password, role: "ADMIN" }, 201)).user;
  const employee = (await request("POST", "/users", a, { fullName: "Employee One", email: "employee1@test.invalid", password }, 201)).user;
  await request("POST", "/users", a, { fullName: "Employee Two", email: "employee2@test.invalid", password }, 201);
  const b = await login(staff.email);
  let e = await login(employee.email);
  const other = await login("employee2@test.invalid");
  const users = await request("GET", "/users", a);
  assert.equal(users.total, 4);
  assert.ok(users.users.every((u: Record<string, unknown>) => !("passwordHash" in u) && !("tokenVersion" in u)));
  assert.equal((await request("GET", "/users/assignees", a)).users.length, 2);
  await request("GET", "/users", e, undefined, 403);
  await request("GET", "/users", undefined, undefined, 401);
  await request("POST", "/users", a, { fullName: "Duplicate", email: employee.email.toUpperCase(), password }, 409);
  await request("PATCH", `/users/${owner.id}/active`, a, { isActive: false }, 400);
  console.log("PASS: account creation, duplicate email, role restrictions, public fields, assignee listing");

  const ticket = (await request("POST", "/tickets", e, { title: "VPN cannot connect", description: "VPN connection is failing today.", categoryId: category.id }, 201)).ticket;
  assert.equal((await request("GET", "/notifications", a)).unreadCount, 1);
  assert.equal((await request("GET", "/notifications", e)).unreadCount, 0);
  await request("PATCH", `/tickets/${ticket.id}`, e, { status: "IN_PROGRESS" }, 403);
  await request("PATCH", `/tickets/${ticket.id}`, a, { status: "CLOSED" }, 409);
  await request("PATCH", `/tickets/${ticket.id}`, a, { status: "IN_PROGRESS", assigneeId: staff.id });
  const assignedNotice = (await request("GET", "/notifications", b)).notifications.find((n: { message: string }) => n.message.includes("người xử lý"));
  assert.ok(assignedNotice);
  await request("POST", `/tickets/${ticket.id}/comments`, b, { content: "Please try again." }, 201);
  const employeeNotices = await request("GET", "/notifications", e);
  assert.equal(employeeNotices.unreadCount, 2);
  assert.equal((await request("GET", "/notifications", other)).total, 0);
  await request("PATCH", `/notifications/${employeeNotices.notifications[0].id}/read`, other, undefined, 404);
  await request("PATCH", `/notifications/${employeeNotices.notifications[0].id}/read`, e);
  assert.equal((await request("GET", "/notifications", e)).unreadCount, 1);
  await request("PATCH", "/notifications/read-all", e);
  assert.equal((await request("GET", "/notifications", e)).unreadCount, 0);
  assert.ok((await request("GET", "/notifications", b)).unreadCount > 0);
  const resolved = (await request("PATCH", `/tickets/${ticket.id}`, b, { status: "RESOLVED" })).ticket;
  const closed = (await request("PATCH", `/tickets/${ticket.id}`, b, { status: "CLOSED" })).ticket;
  assert.ok(resolved.resolvedAt);
  assert.equal(closed.resolvedAt, resolved.resolvedAt);
  const reopened = (await request("PATCH", `/tickets/${ticket.id}`, b, { status: "IN_PROGRESS" })).ticket;
  assert.equal(reopened.resolvedAt, null);
  assert.equal(reopened.statusHistory.length, 5);
  console.log("PASS: workflow, history, resolvedAt, assignment/comment notifications, recipient isolation, read/unread");

  await request("PATCH", `/users/${employee.id}/active`, a, { isActive: false });
  await request("GET", "/auth/me", e, undefined, 401);
  await request("POST", "/auth/login", undefined, { email: employee.email, password }, 403);
  await request("PATCH", `/users/${employee.id}/active`, a, { isActive: true });
  await request("GET", "/auth/me", e, undefined, 401);
  e = await login(employee.email);
  const newPassword = "New-Integration-Password-456!";
  await request("POST", `/users/${employee.id}/reset-password`, a, { password: newPassword });
  await request("GET", "/auth/me", e, undefined, 401);
  await request("POST", "/auth/login", undefined, { email: employee.email, password }, 401);
  e = await login(employee.email, newPassword);
  await request("POST", "/auth/change-password", e, { currentPassword: "wrong", newPassword: password }, 400);
  await request("POST", "/auth/change-password", e, { currentPassword: newPassword, newPassword: password });
  await request("GET", "/auth/me", e, undefined, 401);
  await login(employee.email);
  await request("PATCH", `/users/${staff.id}/active`, a, { isActive: false });
  await request("PATCH", `/tickets/${ticket.id}`, a, { assigneeId: staff.id }, 400);
  assert.equal((await request("GET", "/users/assignees", a)).users.length, 1);
  console.log("PASS: locking/unlocking, resetting/changing password, old session revocation, inactive assignee rejection");
  console.log(`PASS: ${checks} HTTP assertions against real isolated PostgreSQL`);
  if (process.env.BROWSER_TESTS === "1") {
    const { checkOperationsInBrowser } = await import("./operations-browser.js");
    await checkOperationsInBrowser(base, a, await login(employee.email), category.id, password);
  }
} finally {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server!.close(() => resolve()));
  }
  await prisma?.$disconnect();
  if (databaseCreated) {
    // Only the unique database created by this process may be dropped.
    assert.match(databaseName, /^helpdesk_test_[a-f0-9]{32}$/);
    assert.notEqual(originalUrl.pathname, `/${databaseName}`);
    await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    console.log("Removed only the disposable test database; application database unchanged.");
  }
  await admin.end();
}
