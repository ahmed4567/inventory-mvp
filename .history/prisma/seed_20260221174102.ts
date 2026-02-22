import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@inventory.com" },
    update: {},
    create: {
      email: "admin@inventory.com",
      passwordHash,
    },
  });
  console.log("Admin user created: admin@inventory.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());