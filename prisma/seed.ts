import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIAS = ["música", "teatro", "exposição", "feira", "dança", "festival", "standup"];

async function main() {
  await prisma.category.createMany({
    data: CATEGORIAS.map((nome) => ({ nome })),
    skipDuplicates: true,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
