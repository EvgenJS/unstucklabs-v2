-- CreateTable
CREATE TABLE "fishcast_forecast_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fishcast_forecast_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fishcast_forecast_cache_cacheKey_key" ON "fishcast_forecast_cache"("cacheKey");
