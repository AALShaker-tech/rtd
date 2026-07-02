import { describe, it, expect } from "vitest";
import { isAdmin, isSuperAdmin, ADMIN_ROLES } from "@/lib/roles";

describe("roles", () => {
  it("isAdmin is true for ADMIN and SUPERADMIN, false otherwise", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("SUPERADMIN")).toBe(true);
    expect(isAdmin("EMPLOYEE")).toBe(false);
    expect(isAdmin("DRIVER")).toBe(false);
  });

  it("isSuperAdmin is true only for SUPERADMIN", () => {
    expect(isSuperAdmin("SUPERADMIN")).toBe(true);
    expect(isSuperAdmin("ADMIN")).toBe(false);
    expect(isSuperAdmin("EMPLOYEE")).toBe(false);
    expect(isSuperAdmin("DRIVER")).toBe(false);
  });

  it("ADMIN_ROLES lists both admin tiers", () => {
    expect([...ADMIN_ROLES]).toEqual(["ADMIN", "SUPERADMIN"]);
  });
});
