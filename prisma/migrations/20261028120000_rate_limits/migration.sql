-- CreateTable
CREATE TABLE "rate_limits" (
    "chave" TEXT NOT NULL,
    "contagem" INTEGER NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE INDEX "rate_limits_expira_em_idx" ON "rate_limits"("expira_em");

