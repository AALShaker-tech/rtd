-- Bootstrap the superadmin account. Ships no password: the owner sets one on
-- first login (mustSetPassword = true) at /admin/set-password.
-- Idempotent — leaves any existing account with this email untouched.
-- Separate migration from the enum change so 'SUPERADMIN' is committed and usable.
INSERT INTO "User" ("id", "email", "passwordHash", "fullName", "role", "isActive", "mustSetPassword", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'cto@ratbli.sa', '', 'CTO', 'SUPERADMIN', true, true, now(), now())
ON CONFLICT ("email") DO NOTHING;
