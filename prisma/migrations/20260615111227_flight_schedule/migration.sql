-- AlterTable
ALTER TABLE "Airport" ADD COLUMN     "country" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "utcOffsetMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Airline" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Airline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "originAirportCode" TEXT NOT NULL,
    "destinationAirportCode" TEXT NOT NULL,
    "isDirect" BOOLEAN NOT NULL DEFAULT true,
    "approxDurationMinutes" INTEGER NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyFlightSchedule" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "airlineId" TEXT NOT NULL,
    "flightCode" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "departureTimeLocal" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceWeek" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "isStaticSchedule" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WeeklyFlightSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightSnapshot" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "leg" TEXT NOT NULL,
    "flightCode" TEXT,
    "airline" TEXT,
    "originAirport" TEXT,
    "destinationAirport" TEXT,
    "departureDate" TIMESTAMP(3),
    "departureTimeLocal" TEXT,
    "estimatedArrivalDate" TIMESTAMP(3),
    "estimatedArrivalTimeLocal" TEXT,
    "lookupSource" TEXT NOT NULL,
    "lookupStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlightSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Airline_code_key" ON "Airline"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Route_originAirportCode_destinationAirportCode_key" ON "Route"("originAirportCode", "destinationAirportCode");

-- CreateIndex
CREATE INDEX "WeeklyFlightSchedule_flightCode_idx" ON "WeeklyFlightSchedule"("flightCode");

-- CreateIndex
CREATE INDEX "WeeklyFlightSchedule_routeId_idx" ON "WeeklyFlightSchedule"("routeId");

-- CreateIndex
CREATE INDEX "WeeklyFlightSchedule_airlineId_idx" ON "WeeklyFlightSchedule"("airlineId");

-- CreateIndex
CREATE INDEX "FlightSnapshot_requestId_idx" ON "FlightSnapshot"("requestId");

-- AddForeignKey
ALTER TABLE "WeeklyFlightSchedule" ADD CONSTRAINT "WeeklyFlightSchedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyFlightSchedule" ADD CONSTRAINT "WeeklyFlightSchedule_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "Airline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightSnapshot" ADD CONSTRAINT "FlightSnapshot_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
