import { Router } from "express";
import { getDashboardStatistics } from "../controllers/dashboard-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/statistics",
  authenticate,
  asyncHandler(getDashboardStatistics),
);
