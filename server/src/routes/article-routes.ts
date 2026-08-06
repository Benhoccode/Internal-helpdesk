import { Router } from "express";
import {
  createArticle,
  getArticle,
  listArticles,
  updateArticle,
} from "../controllers/article-controller.js";
import { UserRole } from "../generated/prisma/client.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { authorize } from "../middleware/role-middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const articleRouter = Router();

articleRouter.use(authenticate);
articleRouter.get("/", asyncHandler(listArticles));
articleRouter.get("/:slug", asyncHandler(getArticle));
articleRouter.post(
  "/",
  authorize(UserRole.ADMIN),
  asyncHandler(createArticle),
);
articleRouter.patch(
  "/:slug",
  authorize(UserRole.ADMIN),
  asyncHandler(updateArticle),
);
