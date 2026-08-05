import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-middleware.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(
  cors({
    origin: env.clientUrl,
  }),
);

app.use(express.json());

app.get("/api/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.json({
      status: "ok",
      database: "connected",
      message: "Internal Helpdesk API is running",
    });
  } catch (error) {
    console.error("Database health check failed", error);
    response.status(503).json({
      status: "error",
      database: "disconnected",
      message: "Database is unavailable",
    });
  }
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
