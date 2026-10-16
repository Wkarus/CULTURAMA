import { PrismaClient } from "@prisma/client";
import { garantirOrganizadorAdmin } from "../src/lib/admin-email";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error("Defina ADMIN_EMAIL no .env com o e-mail da sua conta já cadastrada.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Nenhuma conta com o e-mail de ADMIN_EMAIL. Cadastre-se no site e rode de novo: npm run db:admin");
  }

  await prisma.user.update({ where: { email }, data: { tipo: "admin" } });
  await garantirOrganizadorAdmin(prisma, user.id, user.nome);
  console.log("A conta de ADMIN_EMAIL agora é admin e organizador aprovado. Saia e entre de novo no site.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
