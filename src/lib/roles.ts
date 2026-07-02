import type { UserRole } from "@prisma/client";

/**
 * Role helpers. SUPERADMIN is a strict superset of ADMIN: it can do everything
 * an admin can, plus manage admin accounts themselves. Anywhere that gates on
 * "admin access", use `isAdmin` so superadmins pass too; reserve `isSuperAdmin`
 * for the admin-management surface.
 */

/** Roles with full access to the admin dashboard. */
export const ADMIN_ROLES = ["ADMIN", "SUPERADMIN"] as const;

export function isAdmin(role: UserRole | string): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export function isSuperAdmin(role: UserRole | string): boolean {
  return role === "SUPERADMIN";
}
