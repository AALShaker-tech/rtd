/**
 * RTD database seed.
 * Seeds reference data (cities, airports, vehicles, packages) and demo staff
 * accounts (admin / employee / driver), plus one sample request to illustrate
 * the operational dashboards.
 *
 * Run: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CITIES, PACKAGES, VEHICLES } from "../src/lib/domain";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding RTD…");

  // ── Vehicles ──
  for (const v of VEHICLES) {
    await prisma.vehicleCategory.upsert({
      where: { category: v.category },
      update: {},
      create: {
        category: v.category,
        nameEn: v.name.en,
        nameAr: v.name.ar,
        maxPassengers: v.maxPassengers,
        exampleModels: v.exampleModels,
        descriptionEn: v.description.en,
        descriptionAr: v.description.ar,
        isRecommended: v.isRecommended ?? false,
        sortOrder: v.sortOrder,
      },
    });
  }

  // ── Packages ──
  for (const p of PACKAGES) {
    await prisma.servicePackage.upsert({
      where: { type: p.type },
      update: {},
      create: {
        type: p.type,
        nameEn: p.name.en,
        nameAr: p.name.ar,
        descriptionEn: p.description.en,
        descriptionAr: p.description.ar,
        includedSteps: p.steps,
        featured: p.featured ?? false,
        sortOrder: p.sortOrder,
      },
    });
  }

  // ── Cities + airports ──
  for (const c of CITIES) {
    const city = await prisma.city.upsert({
      where: { code: c.code },
      update: {},
      create: { code: c.code, nameEn: c.name.en, nameAr: c.name.ar, country: c.country },
    });
    for (const a of c.airports) {
      await prisma.airport.upsert({
        where: { code: a.code },
        update: {},
        create: { code: a.code, nameEn: a.name.en, nameAr: a.name.ar, cityId: city.id, terminals: a.terminals },
      });
    }
  }

  // ── Staff accounts ──
  const password = await bcrypt.hash("Passw0rd!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@rtd.sa" },
    update: {},
    create: { email: "admin@rtd.sa", passwordHash: password, fullName: "RTD Admin", role: "ADMIN" },
  });
  const employee = await prisma.user.upsert({
    where: { email: "ops@rtd.sa" },
    update: {},
    create: { email: "ops@rtd.sa", passwordHash: password, fullName: "Operations Officer", role: "EMPLOYEE", phone: "+966500000001" },
  });
  const driver = await prisma.user.upsert({
    where: { email: "driver@rtd.sa" },
    update: {},
    create: { email: "driver@rtd.sa", passwordHash: password, fullName: "Khalid (Driver)", role: "DRIVER", phone: "+966500000002" },
  });

  // ── Sample request ──
  const existing = await prisma.request.findUnique({ where: { referenceNumber: "RTD-2026-00001" } });
  if (!existing) {
    const customer = await prisma.customer.create({
      data: {
        fullName: "Sample Client",
        phone: "+966551234567",
        email: "client@example.com",
        language: "EN",
        phoneVerified: true,
        emailVerified: false,
      },
    });
    const request = await prisma.request.create({
      data: {
        referenceNumber: "RTD-2026-00001",
        customerId: customer.id,
        status: "EMPLOYEE_ASSIGNED",
        selectedPackage: "DEPARTURE",
        preferredLanguage: "EN",
        carCategory: "VIP",
        passengers: 2,
        bags: 3,
        assignedEmployeeId: employee.id,
        assignedDriverId: driver.id,
        validationStatus: "VALID",
      },
    });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const step = await prisma.journeyStep.create({
      data: {
        requestId: request.id,
        stepOrder: 1,
        stepType: "HOME_TO_RIYADH_AIRPORT",
        city: "RUH",
        scheduledAt: tomorrow,
        homeAddress: "Al Olaya District, Riyadh",
        dropoffLocation: "King Khalid International Airport",
        flightNumber: "SV021",
        serviceType: "MEET_ASSIST_CAR",
        carCategory: "VIP",
        passengers: 2,
        bags: 3,
      },
    });
    await prisma.driverTask.create({
      data: { requestId: request.id, journeyStepId: step.id, driverId: driver.id, status: "ACCEPTED" },
    });
    await prisma.journeyStep.create({
      data: {
        requestId: request.id,
        stepOrder: 2,
        stepType: "DEPARTURE_ASSIST_RIYADH",
        city: "RUH",
        airport: "RUH",
        terminal: "T1",
        loungeType: "VIP_LOUNGE",
        scheduledAt: tomorrow,
        flightNumber: "SV021",
        serviceType: "MEET_ASSIST_FASTTRACK_CAR",
      },
    });
    await prisma.statusHistory.create({ data: { requestId: request.id, toStatus: "REQUEST_RECEIVED" } });
    await prisma.statusHistory.create({ data: { requestId: request.id, toStatus: "EMPLOYEE_ASSIGNED", changedById: admin.id } });
  }

  console.log("✅ Seed complete.");
  console.log("   Admin:    admin@rtd.sa  / Passw0rd!");
  console.log("   Employee: ops@rtd.sa    / Passw0rd!");
  console.log("   Driver:   driver@rtd.sa / Passw0rd!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
