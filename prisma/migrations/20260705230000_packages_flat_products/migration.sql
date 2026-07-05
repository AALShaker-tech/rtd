-- Packages become standalone priced products (name + description + price),
-- fully admin-managed (add/delete). Drop the PackageType enum dependency.

-- ServicePackage: drop the enum key + step bundle, add a flat price.
ALTER TABLE "ServicePackage" DROP COLUMN "type";
ALTER TABLE "ServicePackage" DROP COLUMN "includedSteps";
ALTER TABLE "ServicePackage" ADD COLUMN "price" INTEGER NOT NULL DEFAULT 0;

-- Request.selectedPackage becomes a free-text package-name snapshot.
ALTER TABLE "Request" ALTER COLUMN "selectedPackage" TYPE TEXT USING "selectedPackage"::text;

DROP TYPE "PackageType";
