import assert from "node:assert/strict";
import { test } from "node:test";
import { assertStatusTransition, resolvedAtForStatus, statusTransitions } from "../src/services/ticket-workflow.js";
import { passwordSchema } from "../src/validators/user-validator.js";
import type { TicketStatus } from "../src/generated/prisma/client.js";

test("status transitions enforce workflow for all pairs", () => {
  const statuses = Object.keys(statusTransitions) as TicketStatus[];
  for (const from of statuses) for (const to of statuses) {
    if (from === to || statusTransitions[from].includes(to)) assert.doesNotThrow(() => assertStatusTransition(from, to));
    else assert.throws(() => assertStatusTransition(from, to));
  }
});
test("resolution date survives closure and clears on reopening", () => {
  assert.ok(resolvedAtForStatus("IN_PROGRESS", "RESOLVED") instanceof Date);
  assert.equal(resolvedAtForStatus("RESOLVED", "CLOSED"), undefined);
  assert.equal(resolvedAtForStatus("RESOLVED", "IN_PROGRESS"), null);
  assert.equal(resolvedAtForStatus("CLOSED", "IN_PROGRESS"), null);
  assert.equal(resolvedAtForStatus("RESOLVED", "RESOLVED"), undefined);
});
test("password rules enforce bcrypt byte limit", () => {
  assert.equal(passwordSchema.safeParse("short").success, false);
  assert.equal(passwordSchema.safeParse("a".repeat(72)).success, true);
  assert.equal(passwordSchema.safeParse("ộ".repeat(30)).success, false);
});
