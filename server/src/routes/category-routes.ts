import { Router } from "express";
import {
  createCategory,
  listCategories,
} from "../controllers/category-controller.js";
import { UserRole } from "../generated/prisma/client.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { authorize } from "../middleware/role-middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const categoryRouter = Router();

categoryRouter.use(authenticate);
categoryRouter.get("/", asyncHandler(listCategories));
categoryRouter.post("/", authorize(UserRole.ADMIN), asyncHandler(createCategory));
