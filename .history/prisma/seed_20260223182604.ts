import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@inventory.com" },
    update: { role: "SUPERUSER", status: "ACTIVE" },
    create: {
      email:        "admin@inventory.com",
      name:         "Super Admin",
      passwordHash,
      role:         "SUPERUSER",
      status:       "ACTIVE",
    },
  });

  console.log("✅ Superuser created: admin@inventory.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());