-- CreateEnum
CREATE TYPE "TravailStatus" AS ENUM ('DRAFT', 'QUESTIONING', 'ANALYZING', 'READY_FOR_PROMPT', 'PROMPT_READY', 'GENERATING', 'GENERATED', 'FAILED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UxMetricEventType" AS ENUM ('PAGE_VIEW', 'NAVIGATION', 'SATISFACTION', 'NAVIGATION_ERROR');

-- CreateEnum
CREATE TYPE "MemoryScope" AS ENUM ('PROJECT', 'USER', 'GLOBAL');

-- CreateEnum
CREATE TYPE "AgentMemoryUsageType" AS ENUM ('INPUT', 'OUTPUT', 'BOTH');

-- CreateEnum
CREATE TYPE "FileUsageType" AS ENUM ('LOGO', 'MODEL', 'REFERENCE_IMAGE', 'PRODUCT_IMAGE', 'PERSON_IMAGE', 'OTHER', 'BRAND_GUIDELINE', 'GENERATED_POSTER');

-- CreateEnum
CREATE TYPE "ArtisticResourceType" AS ENUM ('MODEL', 'TEXTURE', 'FONT', 'PALETTE', 'STYLE', 'REFERENCE', 'FORBIDDEN_RULE');

-- CreateEnum
CREATE TYPE "GeneratedPosterStatus" AS ENUM ('PENDING', 'GENERATING', 'GENERATED', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ForbiddenRuleCategory" AS ENUM ('TYPOGRAPHY', 'COLORS', 'COMPOSITION', 'LOGO', 'IMAGE_QUALITY', 'TEXT_CONTENT', 'BRAND_IDENTITY', 'CONTACT_INFO', 'EFFECTS', 'TEXTURES', 'SOCIAL_MEDIA', 'PRINT', 'AI_GENERATION', 'LEGAL_SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ForbiddenRuleSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ForbiddenRuleScope" AS ENUM ('GLOBAL', 'CATEGORY', 'STYLE', 'PROJECT_TYPE');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stackUserId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'free',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',
    "subscriptionCurrentPeriodEnd" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brandDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Travail" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TravailStatus" NOT NULL DEFAULT 'DRAFT',
    "posterType" TEXT,
    "category" TEXT,
    "format" TEXT,
    "style" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Travail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "MemoryScope" NOT NULL DEFAULT 'PROJECT',
    "schema" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "model" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "expectedOutputSchema" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMemoryLink" (
    "id" TEXT NOT NULL,
    "agentDefinitionId" TEXT NOT NULL,
    "memoryDefinitionId" TEXT NOT NULL,
    "usageType" "AgentMemoryUsageType" NOT NULL DEFAULT 'INPUT',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMemoryLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryEntry" (
    "id" TEXT NOT NULL,
    "memoryDefinitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "travailId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "travailId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "usageType" "FileUsageType" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileSizeBytes" INTEGER,
    "format" TEXT,
    "height" INTEGER,
    "publicId" TEXT,
    "width" INTEGER,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtisticResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "resourceType" "ArtisticResourceType" NOT NULL,
    "url" TEXT,
    "description" TEXT,
    "tags" JSONB,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtisticResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedPoster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "travailId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "promptUsed" TEXT NOT NULL,
    "variationNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "GeneratedPosterStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isExample" BOOLEAN NOT NULL DEFAULT false,
    "qualityScore" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedPoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "travailId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "provider" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "planName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForbiddenRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ForbiddenRuleCategory" NOT NULL,
    "severity" "ForbiddenRuleSeverity" NOT NULL DEFAULT 'MEDIUM',
    "scope" "ForbiddenRuleScope" NOT NULL DEFAULT 'GLOBAL',
    "appliesTo" JSONB,
    "examples" JSONB,
    "correctionTips" JSONB,
    "negativePrompt" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForbiddenRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UxMetricEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "UxMetricEventType" NOT NULL,
    "path" TEXT NOT NULL,
    "fromPath" TEXT,
    "toPath" TEXT,
    "durationMs" INTEGER,
    "satisfactionScore" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UxMetricEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "travailId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreationOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "formatPreset" TEXT,
    "dimensions" TEXT,
    "orientation" TEXT,
    "usage" TEXT,
    "contextPrompt" TEXT NOT NULL,
    "recommendedQuestions" JSONB NOT NULL DEFAULT '[]',
    "constraints" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreationOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stackUserId_key" ON "User"("stackUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Travail_projectId_idx" ON "Travail"("projectId");

-- CreateIndex
CREATE INDEX "Travail_userId_idx" ON "Travail"("userId");

-- CreateIndex
CREATE INDEX "Travail_status_idx" ON "Travail"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryDefinition_key_key" ON "MemoryDefinition"("key");

-- CreateIndex
CREATE INDEX "MemoryDefinition_key_idx" ON "MemoryDefinition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AgentDefinition_key_key" ON "AgentDefinition"("key");

-- CreateIndex
CREATE INDEX "AgentDefinition_key_idx" ON "AgentDefinition"("key");

-- CreateIndex
CREATE INDEX "AgentMemoryLink_agentDefinitionId_idx" ON "AgentMemoryLink"("agentDefinitionId");

-- CreateIndex
CREATE INDEX "AgentMemoryLink_memoryDefinitionId_idx" ON "AgentMemoryLink"("memoryDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMemoryLink_agentDefinitionId_memoryDefinitionId_key" ON "AgentMemoryLink"("agentDefinitionId", "memoryDefinitionId");

-- CreateIndex
CREATE INDEX "MemoryEntry_userId_idx" ON "MemoryEntry"("userId");

-- CreateIndex
CREATE INDEX "MemoryEntry_travailId_idx" ON "MemoryEntry"("travailId");

-- CreateIndex
CREATE INDEX "MemoryEntry_memoryDefinitionId_idx" ON "MemoryEntry"("memoryDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryEntry_travailId_memoryDefinitionId_key" ON "MemoryEntry"("travailId", "memoryDefinitionId");

-- CreateIndex
CREATE INDEX "FileAsset_userId_idx" ON "FileAsset"("userId");

-- CreateIndex
CREATE INDEX "FileAsset_projectId_idx" ON "FileAsset"("projectId");

-- CreateIndex
CREATE INDEX "FileAsset_travailId_idx" ON "FileAsset"("travailId");

-- CreateIndex
CREATE INDEX "FileAsset_usageType_idx" ON "FileAsset"("usageType");

-- CreateIndex
CREATE INDEX "ArtisticResource_category_idx" ON "ArtisticResource"("category");

-- CreateIndex
CREATE INDEX "ArtisticResource_resourceType_idx" ON "ArtisticResource"("resourceType");

-- CreateIndex
CREATE INDEX "GeneratedPoster_userId_idx" ON "GeneratedPoster"("userId");

-- CreateIndex
CREATE INDEX "GeneratedPoster_travailId_idx" ON "GeneratedPoster"("travailId");

-- CreateIndex
CREATE INDEX "GeneratedPoster_status_idx" ON "GeneratedPoster"("status");

-- CreateIndex
CREATE INDEX "AgentRun_travailId_idx" ON "AgentRun"("travailId");

-- CreateIndex
CREATE INDEX "AgentRun_agentName_idx" ON "AgentRun"("agentName");

-- CreateIndex
CREATE INDEX "AgentRun_status_idx" ON "AgentRun"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE INDEX "AppSetting_category_idx" ON "AppSetting"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ForbiddenRule_key_key" ON "ForbiddenRule"("key");

-- CreateIndex
CREATE INDEX "ForbiddenRule_category_idx" ON "ForbiddenRule"("category");

-- CreateIndex
CREATE INDEX "ForbiddenRule_severity_idx" ON "ForbiddenRule"("severity");

-- CreateIndex
CREATE INDEX "ForbiddenRule_isActive_idx" ON "ForbiddenRule"("isActive");

-- CreateIndex
CREATE INDEX "ForbiddenRule_scope_idx" ON "ForbiddenRule"("scope");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "UxMetricEvent_userId_createdAt_idx" ON "UxMetricEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UxMetricEvent_eventType_idx" ON "UxMetricEvent"("eventType");

-- CreateIndex
CREATE INDEX "UxMetricEvent_path_idx" ON "UxMetricEvent"("path");

-- CreateIndex
CREATE INDEX "Message_travailId_idx" ON "Message"("travailId");

-- CreateIndex
CREATE UNIQUE INDEX "CreationOption_slug_key" ON "CreationOption"("slug");

-- CreateIndex
CREATE INDEX "CreationOption_category_idx" ON "CreationOption"("category");

-- CreateIndex
CREATE INDEX "CreationOption_isActive_idx" ON "CreationOption"("isActive");

-- CreateIndex
CREATE INDEX "CreationOption_sortOrder_idx" ON "CreationOption"("sortOrder");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Travail" ADD CONSTRAINT "Travail_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Travail" ADD CONSTRAINT "Travail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMemoryLink" ADD CONSTRAINT "AgentMemoryLink_agentDefinitionId_fkey" FOREIGN KEY ("agentDefinitionId") REFERENCES "AgentDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMemoryLink" ADD CONSTRAINT "AgentMemoryLink_memoryDefinitionId_fkey" FOREIGN KEY ("memoryDefinitionId") REFERENCES "MemoryDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEntry" ADD CONSTRAINT "MemoryEntry_memoryDefinitionId_fkey" FOREIGN KEY ("memoryDefinitionId") REFERENCES "MemoryDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEntry" ADD CONSTRAINT "MemoryEntry_travailId_fkey" FOREIGN KEY ("travailId") REFERENCES "Travail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEntry" ADD CONSTRAINT "MemoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_travailId_fkey" FOREIGN KEY ("travailId") REFERENCES "Travail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPoster" ADD CONSTRAINT "GeneratedPoster_travailId_fkey" FOREIGN KEY ("travailId") REFERENCES "Travail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPoster" ADD CONSTRAINT "GeneratedPoster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_travailId_fkey" FOREIGN KEY ("travailId") REFERENCES "Travail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForbiddenRule" ADD CONSTRAINT "ForbiddenRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UxMetricEvent" ADD CONSTRAINT "UxMetricEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_travailId_fkey" FOREIGN KEY ("travailId") REFERENCES "Travail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

