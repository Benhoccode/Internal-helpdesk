import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { createCategorySchema } from "../validators/category-validator.js";

export async function listCategories(_request: Request, response: Response) {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tickets: true } } },
  });

  response.json({ categories });
}

export async function createCategory(request: Request, response: Response) {
  const data = createCategorySchema.parse(request.body);
  const existingCategory = await prisma.category.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" } },
  });

  if (existingCategory) {
    throw new AppError(409, "A category with this name already exists");
  }

  const category = await prisma.category.create({ data });
  response.status(201).json({ category });
}
