CREATE TYPE "UxMetricEventType" AS ENUM (
  'PAGE_VIEW',
  'NAVIGATION',
  'SATISFACTION',
  'NAVIGATION_ERROR'
);

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

  CONSTRAINT "UxMetricEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UxMetricEvent_durationMs_check" CHECK ("durationMs" IS NULL OR "durationMs" >= 0),
  CONSTRAINT "UxMetricEvent_satisfactionScore_check" CHECK (
    "satisfactionScore" IS NULL OR ("satisfactionScore" >= 1 AND "satisfactionScore" <= 5)
  )
);

CREATE INDEX "UxMetricEvent_userId_createdAt_idx" ON "UxMetricEvent"("userId", "createdAt");
CREATE INDEX "UxMetricEvent_eventType_idx" ON "UxMetricEvent"("eventType");
CREATE INDEX "UxMetricEvent_path_idx" ON "UxMetricEvent"("path");

ALTER TABLE "UxMetricEvent"
  ADD CONSTRAINT "UxMetricEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
