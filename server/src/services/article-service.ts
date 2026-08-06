import { prisma } from "../config/prisma.js";
import { ArticleStatus, UserRole } from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";

export const articleInclude = {
  author: { select: { id: true, fullName: true } },
  categoryLinks: {
    include: { category: true },
    orderBy: { category: { name: "asc" as const } },
  },
} as const;

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 250);
}

export async function createUniqueSlug(title: string) {
  const base = slugify(title) || "article";
  let candidate = base;
  let suffix = 2;

  while (await prisma.article.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function ensureCategoriesExist(categoryIds: number[]) {
  const count = await prisma.category.count({
    where: { id: { in: categoryIds } },
  });
  if (count !== categoryIds.length) {
    throw new AppError(400, "One or more categories do not exist");
  }
}

export async function findAccessibleArticle(
  slug: string,
  role: UserRole,
) {
  const article = await prisma.article.findFirst({
    where: {
      slug,
      ...(role === UserRole.EMPLOYEE
        ? { status: ArticleStatus.PUBLISHED }
        : {}),
    },
    include: articleInclude,
  });

  if (!article) throw new AppError(404, "Article not found");
  return article;
}
