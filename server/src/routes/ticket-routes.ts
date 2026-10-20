import { Router } from "express";
import { attachmentRouter } from "./attachment-routes.js";
import {
  addComment,
  createTicket,
  getTicket,
  listTickets,
  updateTicket,
} from "../controllers/ticket-controller.js";
import { UserRole } from "../generated/prisma/client.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { authorize } from "../middleware/role-middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const ticketRouter = Router();

ticketRouter.use(authenticate);
ticketRouter.use("/:id/attachments", attachmentRouter);
ticketRouter.post("/", asyncHandler(createTicket));
ticketRouter.get("/", asyncHandler(listTickets));
ticketRouter.get("/:id", asyncHandler(getTicket));
ticketRouter.patch(
  "/:id",
  authorize(UserRole.ADMIN),
  asyncHandler(updateTicket),
);
ticketRouter.post("/:id/comments", asyncHandler(addComment));
