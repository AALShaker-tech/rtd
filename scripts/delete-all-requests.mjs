/**
 * One-off: permanently delete EVERY concierge request (test data cleanup).
 *
 * Removes all `Request` rows and, via `onDelete: Cascade`, their dependent
 * records — journey steps, driver tasks, status history, internal notes,
 * price history and flight snapshots. Customers left with no remaining
 * request are deleted too (customers only ever attach to requests). AuditLog
 * rows survive: their `requestId` is set to null, so the deletion stays
 * traceable. This mirrors `deleteRequest()` in request.service.ts, applied to
 * the whole table.
 *
 * DESTRUCTIVE and NON-RECOVERABLE. Runs a DRY RUN by default (counts only);
 * set CONFIRM_DELETE_ALL=yes to actually delete.
 *
 * Runtime-only deps (@prisma/client) so it runs in the production container
 * without devDependencies — e.g. Railway's Console tab, where DATABASE_URL is
 * already set:
 *
 *   node scripts/delete-all-requests.mjs                    # dry run — shows what would go
 *   CONFIRM_DELETE_ALL=yes node scripts/delete-all-requests.mjs   # actually delete
 */
import { PrismaClient } from "@prisma/client";

const confirmed = process.env.CONFIRM_DELETE_ALL === "yes";
const prisma = new PrismaClient();

try {
  const [requests, customers, journeySteps, driverTasks] = await Promise.all([
    prisma.request.count(),
    prisma.customer.count(),
    prisma.journeyStep.count(),
    prisma.driverTask.count(),
  ]);

  console.log("Current data:");
  console.log(`   requests:     ${requests}`);
  console.log(`   journeySteps: ${journeySteps}`);
  console.log(`   driverTasks:  ${driverTasks}`);
  console.log(`   customers:    ${customers}`);

  if (requests === 0) {
    console.log("\n✔ No requests to delete. Nothing to do.");
    process.exit(0);
  }

  if (!confirmed) {
    console.log(
      `\n⚠ DRY RUN. Would delete all ${requests} request(s), their cascaded ` +
        `children, and ${customers} orphaned customer(s).`,
    );
    console.log("   Re-run with CONFIRM_DELETE_ALL=yes to apply.");
    process.exit(0);
  }

  const result = await prisma.$transaction(async (tx) => {
    // Cascades remove journeySteps, driverTasks, statusHistory, internalNotes,
    // priceHistory and flightSnapshots; auditLogs are detached (requestId null).
    const deletedRequests = await tx.request.deleteMany({});
    // Every customer is now orphaned (customers only attach to requests).
    const deletedCustomers = await tx.customer.deleteMany({});
    return { deletedRequests, deletedCustomers };
  });

  console.log(
    `\n✔ Deleted ${result.deletedRequests.count} request(s) and ` +
      `${result.deletedCustomers.count} customer(s), plus all cascaded children.`,
  );
} catch (e) {
  console.error("✖ Failed to delete requests:", e && e.message ? e.message : e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
