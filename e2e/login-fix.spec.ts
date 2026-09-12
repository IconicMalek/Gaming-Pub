import { test, expect } from "@playwright/test";

test("login route is a real OAuth launcher, not the 404 page", async ({ page }) => {
  await page.route("**/app-auth**", (route) => route.abort());
  const oauthRequest = page.waitForRequest((request) => request.url().includes("/app-auth"));
  await page.goto("/login", { waitUntil: "domcontentloaded" }).catch(() => undefined);
  await expect(oauthRequest).resolves.toBeTruthy();
});

test("header account control is a button when signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.locator('a[href="/login"]')).toHaveCount(0);
});
