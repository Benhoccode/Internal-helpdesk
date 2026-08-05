import { Router } from "express";
import { login, me } from "../controllers/auth-controller.js";
import { authenticate } from "../middleware/auth-middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(login));
authRouter.get("/me", authenticate, asyncHandler(me));
