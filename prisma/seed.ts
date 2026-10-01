import { PrismaClient } from "@prisma/client";
import { semearCategorias } from "../src/lib/categorias-dados";

const prisma = new PrismaClient();

async function main() {
  const { maes, filhas } = await semearCategorias(prisma);
  console.log(`Categorias: ${maes} mães e ${filhas} subcategorias.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
