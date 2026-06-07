CREATE TABLE "ProviderApiKey" (
    "id" TEXT NOT NULL,
    "providerSlug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cooldownUntil" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "lastQuotaAt" TIMESTAMP(3),
    "quotaReason" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderApiKey_providerSlug_label_key" ON "ProviderApiKey"("providerSlug", "label");
CREATE INDEX "ProviderApiKey_providerSlug_idx" ON "ProviderApiKey"("providerSlug");
CREATE INDEX "ProviderApiKey_isActive_idx" ON "ProviderApiKey"("isActive");
CREATE INDEX "ProviderApiKey_cooldownUntil_idx" ON "ProviderApiKey"("cooldownUntil");
