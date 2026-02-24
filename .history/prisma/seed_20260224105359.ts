import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where:  { email: "admin@inventory.com" },
    update: {
      role:     "SUPERUSER",
      status:   "ACTIVE",
      username: "admin",
    },
    create: {
      email:        "admin@inventory.com",
      username:     "admin",
      name:         "Super Admin",
      passwordHash,
      role:         "SUPERUSER",
      status:       "ACTIVE",
    },
  });

  console.log("✅ Superuser seeded: username=admin / password=admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Then run:
```
npx prisma db seed