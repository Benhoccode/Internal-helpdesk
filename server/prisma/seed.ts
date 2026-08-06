import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import {
  ArticleStatus,
  PrismaClient,
  UserRole,
} from "../src/generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  const [adminPasswordHash, employeePasswordHash] = await Promise.all([
    hash("Admin@123", 12),
    hash("Employee@123", 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@helpdesk.local" },
    update: {
      fullName: "Helpdesk Admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      fullName: "Helpdesk Admin",
      email: "admin@helpdesk.local",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "employee@helpdesk.local" },
    update: {
      fullName: "Demo Employee",
      passwordHash: employeePasswordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
    },
    create: {
      fullName: "Demo Employee",
      email: "employee@helpdesk.local",
      passwordHash: employeePasswordHash,
      role: UserRole.EMPLOYEE,
    },
  });

  const categories = new Map<string, number>();
  for (const category of [
    { name: "Hardware", description: "Thiết bị và phần cứng" },
    { name: "Software", description: "Phần mềm và ứng dụng" },
    { name: "Network", description: "Mạng nội bộ, Internet và VPN" },
    { name: "Account", description: "Tài khoản và quyền truy cập" },
  ]) {
    const savedCategory = await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });
    categories.set(savedCategory.name, savedCategory.id);
  }

  for (const article of [
    {
      title: "Hướng dẫn xử lý lỗi kết nối VPN",
      slug: "huong-dan-xu-ly-loi-ket-noi-vpn",
      content:
        "Khi không thể kết nối VPN, hãy kiểm tra kết nối Internet và xác nhận tài khoản chưa bị khóa.\n\n1. Thoát hoàn toàn ứng dụng VPN.\n2. Khởi động lại máy tính.\n3. Mở lại ứng dụng và đăng nhập bằng tài khoản công ty.\n4. Nếu vẫn gặp lỗi, chụp lại thông báo và tạo yêu cầu hỗ trợ.",
      categoryNames: ["Network", "Account"],
    },
    {
      title: "Cách yêu cầu cài đặt phần mềm công ty",
      slug: "cach-yeu-cau-cai-dat-phan-mem-cong-ty",
      content:
        "Trước khi gửi yêu cầu cài đặt phần mềm, hãy chuẩn bị tên phần mềm, phiên bản cần dùng và lý do công việc.\n\nTạo yêu cầu mới, chọn danh mục Software, mô tả máy tính đang sử dụng và cung cấp thông tin bản quyền nếu có.",
      categoryNames: ["Software"],
    },
  ]) {
    const categoryIds = article.categoryNames.map((name) => {
      const categoryId = categories.get(name);
      if (!categoryId) throw new Error(`Seed category ${name} is missing`);
      return categoryId;
    });

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        content: article.content,
        status: ArticleStatus.PUBLISHED,
        authorId: admin.id,
        publishedAt: new Date(),
        categoryLinks: {
          deleteMany: {},
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
      create: {
        title: article.title,
        slug: article.slug,
        content: article.content,
        status: ArticleStatus.PUBLISHED,
        authorId: admin.id,
        publishedAt: new Date(),
        categoryLinks: {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      },
    });
  }

  console.log("Database seed completed.");
  console.log("Admin: admin@helpdesk.local / Admin@123");
  console.log("Employee: employee@helpdesk.local / Employee@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
