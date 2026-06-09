-- CreateEnum
CREATE TYPE "PriceStatus" AS ENUM ('ESTIMATED', 'ADJUSTED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PriceChangeType" AS ENUM ('RECALCULATED', 'OVERRIDE', 'DISCOUNT', 'SURCHARGE');

-- CreateEnum
CREATE TYPE "FlightLookupStatus" AS ENUM ('MANUAL', 'VERIFIED', 'LOOKUP_FAILED');

-- AlterTable
ALTER TABLE "JourneyStep" ADD COLUMN     "adminAdjustedPrice" INTEGER,
ADD COLUMN     "basePrice" INTEGER,
ADD COLUMN     "computedPrice" INTEGER,
ADD COLUMN     "flightData" JSONB,
ADD COLUMN     "flightLookupStatus" "FlightLookupStatus" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "vehicleMultiplier" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SAR',
ADD COLUMN     "estimatedTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "finalPrice" INTEGER,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "priceStatus" "PriceStatus" NOT NULL DEFAULT 'ESTIMATED';

-- AlterTable
ALTER TABLE "VehicleCategory" ADD COLUMN     "priceMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- CreateTable
CREATE TABLE "ServicePricing" (
    "id" TEXT NOT NULL,
    "stepType" "StepType" NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoungePricing" (
    "id" TEXT NOT NULL,
    "loungeType" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LoungePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationPricing" (
    "id" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "surcharge" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DestinationPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestPriceHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "changeType" "PriceChangeType" NOT NULL,
    "oldPrice" INTEGER,
    "newPrice" INTEGER NOT NULL,
    "reason" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServicePricing_stepType_key" ON "ServicePricing"("stepType");

-- CreateIndex
CREATE UNIQUE INDEX "LoungePricing_loungeType_key" ON "LoungePricing"("loungeType");

-- CreateIndex
CREATE UNIQUE INDEX "DestinationPricing_cityCode_key" ON "DestinationPricing"("cityCode");

-- CreateIndex
CREATE INDEX "RequestPriceHistory_requestId_idx" ON "RequestPriceHistory"("requestId");

-- AddForeignKey
ALTER TABLE "RequestPriceHistory" ADD CONSTRAINT "RequestPriceHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestPriceHistory" ADD CONSTRAINT "RequestPriceHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
