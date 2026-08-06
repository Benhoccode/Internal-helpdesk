import { Router } from "express";
import { articleRouter } from "./article-routes.js";
import { authRouter } from "./auth-routes.js";
import { categoryRouter } from "./category-routes.js";
import { dashboardRouter } from "./dashboard-routes.js";
import { ticketRouter } from "./ticket-routes.js";

export const apiRouter = Router();

apiRouter.use("/articles", articleRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/tickets", ticketRouter);
