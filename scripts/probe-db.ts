import { PrismaClient } from "@prisma/client";

function passwordFromEnvUrl(): string {
  const raw = process.env.DATABASE_URL ?? "";
  const match = raw.match(/postgres(?:\.[^:]+)?:([^@]+)@/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

const password = passwordFromEnvUrl();
const ref = "qvwejrfmjvsuwfrqvgdb";
const hosts = ["aws-0-sa-east-1", "aws-1-sa-east-1", "aws-2-sa-east-1"];

async function tryUrl(name: string, url: string) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const n = await prisma.user.count();
    console.log(`${name}: ok users=${n}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const compact = message.replace(/\s+/g, " ").slice(0, 160);
    console.log(`${name}: fail ${compact}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!password) {
    console.log("sem senha no DATABASE_URL");
    return;
  }
  const encoded = encodeURIComponent(password);
  await tryUrl("env", process.env.DATABASE_URL ?? "");
  await tryUrl("direct-db", `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`);
  for (const host of hosts) {
    const ok = await tryUrl(
      `${host}:6543`,
      `postgresql://postgres.${ref}:${encoded}@${host}.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    );
    if (ok) return;
    await tryUrl(
      `${host}:5432`,
      `postgresql://postgres.${ref}:${encoded}@${host}.pooler.supabase.com:5432/postgres`,
    );
  }
}

main();
