import { test, expect } from "@playwright/test";

/**
 * Smoke tests — prove the app boots against a real database and the critical
 * entry points render without error. Assertions use stable, copy-independent
 * selectors (hrefs, input names, metadata title) so they don't break on
 * bilingual copy changes. The full journey → submit → assign → driver flow is a
 * planned follow-up.
 */

test("homepage loads with the brand title and a journey CTA", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok(), "homepage should return a 2xx").toBeTruthy();
  await expect(page).toHaveTitle(/RTD/i);
  await expect(page.locator('a[href="/journey"]').first()).toBeVisible();
});

test("journey builder page renders", async ({ page }) => {
  const res = await page.goto("/journey");
  expect(res?.ok(), "journey page should return a 2xx").toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
});

test("admin login page shows the sign-in form", async ({ page }) => {
  const res = await page.goto("/admin/login");
  expect(res?.ok(), "admin login should return a 2xx").toBeTruthy();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.getByRole("button")).toBeVisible();
});

test("public status tracking page renders", async ({ page }) => {
  const res = await page.goto("/status");
  expect(res?.ok(), "status page should return a 2xx").toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
});
