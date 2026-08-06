import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { app } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

type JsonObject = Record<string, unknown>;

interface ApiResponse<T> {
  readonly status: number;
  readonly data: T;
}

const server = app.listen(0);
const address = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${address.port}/api`;
let testTicketId: number | undefined;
let testArticleId: number | undefined;

async function request<T>(
  method: string,
  path: string,
  options: { token?: string; body?: JsonObject } = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(options.token
        ? { Authorization: `Bearer ${options.token}` }
        : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  return {
    status: response.status,
    data: (await response.json()) as T,
  };
}

async function login(email: string, password: string) {
  const response = await request<{
    token: string;
    user: { id: number; role: string };
  }>("POST", "/auth/login", { body: { email, password } });
  assert.equal(response.status, 200);
  return response.data;
}

function passed(label: string) {
  console.log(`✓ ${label}`);
}

async function run() {
  const unique = randomUUID().slice(0, 8);

  const health = await request<{ status: string }>("GET", "/health");
  assert.equal(health.status, 200);
  assert.equal(health.data.status, "ok");
  passed("health check and database connection");

  const invalidLogin = await request("POST", "/auth/login", {
    body: { email: "employee@helpdesk.local", password: "wrong-password" },
  });
  assert.equal(invalidLogin.status, 401);
  passed("invalid credentials are rejected");

  const employee = await login("employee@helpdesk.local", "Employee@123");
  const admin = await login("admin@helpdesk.local", "Admin@123");
  assert.equal(employee.user.role, "EMPLOYEE");
  assert.equal(admin.user.role, "ADMIN");
  passed("employee and admin can sign in");

  const me = await request<{ user: { id: number } }>("GET", "/auth/me", {
    token: employee.token,
  });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.id, employee.user.id);
  passed("authenticated profile is returned");

  const categories = await request<{
    categories: Array<{ id: number }>;
  }>("GET", "/categories", { token: employee.token });
  assert.equal(categories.status, 200);
  assert.ok(categories.data.categories.length > 0);
  const categoryId = categories.data.categories[0].id;

  const createdTicket = await request<{
    ticket: { id: number; status: string; statusHistory: unknown[] };
  }>("POST", "/tickets", {
    token: employee.token,
    body: {
      title: `Automated smoke ticket ${unique}`,
      description: "Temporary ticket created by the repeatable smoke test.",
      priority: "HIGH",
      categoryId,
    },
  });
  assert.equal(createdTicket.status, 201);
  testTicketId = createdTicket.data.ticket.id;
  assert.equal(createdTicket.data.ticket.status, "OPEN");
  assert.equal(createdTicket.data.ticket.statusHistory.length, 1);
  passed("employee creates a ticket with initial history");

  const forbiddenUpdate = await request("PATCH", `/tickets/${testTicketId}`, {
    token: employee.token,
    body: { status: "CLOSED" },
  });
  assert.equal(forbiddenUpdate.status, 403);
  passed("employee cannot update ticket workflow fields");

  const updatedTicket = await request<{
    ticket: { status: string; assigneeId: number; statusHistory: unknown[] };
  }>("PATCH", `/tickets/${testTicketId}`, {
    token: admin.token,
    body: {
      status: "IN_PROGRESS",
      assigneeId: admin.user.id,
      note: "Assigned during automated smoke test",
    },
  });
  assert.equal(updatedTicket.status, 200);
  assert.equal(updatedTicket.data.ticket.status, "IN_PROGRESS");
  assert.equal(updatedTicket.data.ticket.assigneeId, admin.user.id);
  assert.equal(updatedTicket.data.ticket.statusHistory.length, 2);
  passed("admin assigns and advances ticket with audit history");

  const comment = await request("POST", `/tickets/${testTicketId}/comments`, {
    token: employee.token,
    body: { content: "Automated smoke test comment" },
  });
  assert.equal(comment.status, 201);
  passed("ticket owner can add a comment");

  const dashboard = await request<{
    statistics: { total: number; inProgress: number };
  }>("GET", "/dashboard/statistics", { token: employee.token });
  assert.equal(dashboard.status, 200);
  assert.ok(dashboard.data.statistics.total >= 1);
  assert.ok(dashboard.data.statistics.inProgress >= 1);
  passed("dashboard statistics respect the authenticated scope");

  const draftArticle = await request<{
    article: { id: number; slug: string; status: string };
  }>("POST", "/articles", {
    token: admin.token,
    body: {
      title: `Automated knowledge article ${unique}`,
      content:
        "Temporary article content used to verify draft and publishing permissions.",
      status: "DRAFT",
      categoryIds: [categoryId],
    },
  });
  assert.equal(draftArticle.status, 201);
  testArticleId = draftArticle.data.article.id;
  const articleSlug = draftArticle.data.article.slug;

  const hiddenDraft = await request<{ pagination: { total: number } }>(
    "GET",
    `/articles?search=${unique}`,
    { token: employee.token },
  );
  assert.equal(hiddenDraft.data.pagination.total, 0);
  const hiddenDetail = await request("GET", `/articles/${articleSlug}`, {
    token: employee.token,
  });
  assert.equal(hiddenDetail.status, 404);
  passed("employee cannot discover or read draft articles");

  const employeeCreateArticle = await request("POST", "/articles", {
    token: employee.token,
    body: {
      title: `Forbidden article ${unique}`,
      content: "This article must never be created by an employee account.",
      status: "PUBLISHED",
      categoryIds: [categoryId],
    },
  });
  assert.equal(employeeCreateArticle.status, 403);
  passed("employee cannot create knowledge articles");

  const publishedArticle = await request<{
    article: { status: string };
  }>("PATCH", `/articles/${articleSlug}`, {
    token: admin.token,
    body: { status: "PUBLISHED" },
  });
  assert.equal(publishedArticle.status, 200);
  assert.equal(publishedArticle.data.article.status, "PUBLISHED");
  const visibleDetail = await request("GET", `/articles/${articleSlug}`, {
    token: employee.token,
  });
  assert.equal(visibleDetail.status, 200);
  passed("published article becomes visible to employees");
}

try {
  await run();
  console.log("\nAll API smoke tests passed.");
} finally {
  if (testArticleId) {
    await prisma.article.deleteMany({ where: { id: testArticleId } });
  }
  if (testTicketId) {
    await prisma.ticket.deleteMany({ where: { id: testTicketId } });
  }
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await prisma.$disconnect();
}
