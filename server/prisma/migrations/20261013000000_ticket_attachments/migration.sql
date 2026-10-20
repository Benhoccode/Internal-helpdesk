CREATE TABLE "ticket_attachments" (
  "id" SERIAL PRIMARY KEY,
  "ticket_id" INTEGER NOT NULL,
  "uploaded_by_id" INTEGER NOT NULL,
  "original_name" VARCHAR(255) NOT NULL,
  "public_id" TEXT NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "size" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ticket_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ticket_attachments_public_id_key" ON "ticket_attachments"("public_id");
CREATE INDEX "ticket_attachments_ticket_id_created_at_idx" ON "ticket_attachments"("ticket_id", "created_at");
