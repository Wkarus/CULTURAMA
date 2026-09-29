import { prisma } from "../src/lib/prisma";

async function main() {
  const [users, events, cats] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.category.count(),
  ]);
  console.log(JSON.stringify({ ok: true, users, events, cats }));
}

main()
  .catch((error) => {
    console.error("DB_FAIL", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
