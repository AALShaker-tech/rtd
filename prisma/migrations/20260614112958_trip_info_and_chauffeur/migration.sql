-- AlterTable
ALTER TABLE "JourneyStep" ADD COLUMN     "dailyUsage" TEXT;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "assistanceNotes" TEXT,
ADD COLUMN     "departureDate" TIMESTAMP(3),
ADD COLUMN     "returnDate" TIMESTAMP(3),
ADD COLUMN     "specialAssistance" BOOLEAN NOT NULL DEFAULT false;
