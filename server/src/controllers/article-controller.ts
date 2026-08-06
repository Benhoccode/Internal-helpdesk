import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import {
  ArticleStatus,
  UserRole,
  type Prisma,
} from "../generated/prisma/client.js";
import {
  articleInclude,
  createUniqueSlug,
  ensureCategoriesExist,
  findAccessibleArticle,
} from "../services/article-service.js";
import {
  articleQuerySchema,
  articleSlugParamsSchema,
  createArticleSchema,
  updateArticleSchema,
} from "../validators/article-validator.js";

export async function listArticles(request: Request, response: Response) {
  const filters = articleQuerySchema.parse(request.query);
  const where: Prisma.ArticleWhereInput = {
    ...(request.user!.role === UserRole.EMPLOYEE
      ? { status: ArticleStatus.PUBLISHED }
      : filters.status
        ? { status: filters.status }
        : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { content: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.categoryId
      ? { categoryLinks: { some: { categoryId: filters.categoryId } } }
      : {}),
  };

  const [articles, total] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: articleInclude,
    }),
    prisma.article.count({ where }),
  ]);

  response.json({
    articles,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  });
}

export async function getArticle(request: Request, response: Response) {
  const { slug } = articleSlugParamsSchema.parse(request.params);
  const article = await findAccessibleArticle(slug, request.user!.role);
  response.json({ article });
}

export async function createArticle(request: Request, response: Response) {
  const input = createArticleSchema.parse(request.body);
  await ensureCategoriesExist(input.categoryIds);
  const slug = await createUniqueSlug(input.title);

  const article = await prisma.article.create({
    data: {
      title: input.title,
      content: input.content,
      status: input.status,
      slug,
      authorId: request.user!.id,
      publishedAt:
        input.status === ArticleStatus.PUBLISHED ? new Date() : null,
      categoryLinks: {
        create: input.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
    include: articleInclude,
  });

  response.status(201).json({ article });
}

export async function updateArticle(request: Request, response: Response) {
  const { slug } = articleSlugParamsSchema.parse(request.params);
  const input = updateArticleSchema.parse(request.body);
  const currentArticle = await findAccessibleArticle(slug, UserRole.ADMIN);

  if (input.categoryIds) await ensureCategoriesExist(input.categoryIds);
  const { categoryIds, ...articleFields } = input;

  const article = await prisma.$transaction(async (transaction) => {
    if (categoryIds) {
      await transaction.articleCategory.deleteMany({
        where: { articleId: currentArticle.id },
      });
      await transaction.articleCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          articleId: currentArticle.id,
          categoryId,
        })),
      });
    }

    return transaction.article.update({
      where: { id: currentArticle.id },
      data: {
        ...articleFields,
        ...(input.status === ArticleStatus.PUBLISHED &&
        !currentArticle.publishedAt
          ? { publishedAt: new Date() }
          : {}),
      },
      include: articleInclude,
    });
  });

  response.json({ article });
}
