import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient, UserRole } from "../src/generated/prisma/client.js";

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

  await prisma.user.upsert({
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

  for (const category of [
    { name: "Hardware", description: "Thiết bị và phần cứng" },
    { name: "Software", description: "Phần mềm và ứng dụng" },
    { name: "Network", description: "Mạng nội bộ, Internet và VPN" },
    { name: "Account", description: "Tài khoản và quyền truy cập" },
  ]) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
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
