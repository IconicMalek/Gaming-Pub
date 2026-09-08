import { test, expect } from "@playwright/test";

test.describe("Gaming Pub storefront", () => {
  test("renders the cinematic home experience and core navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Gaming Pub/i);
    await expect(page.locator("h1").filter({ hasText: "THE STORE" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "GAMES" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "REQUEST" })).toBeVisible();
  });

  test("loads the seeded catalog with a safe price state", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByRole("heading", { name: "Games" })).toBeVisible();
    await page.getByPlaceholder(/Search games/i).fill("Half-Life 2");
    const product = page.locator("article").filter({ hasText: "Half-Life 2" });
    await expect(product).toBeVisible();
    await expect(product).toContainText(/(EGP|Price not configured)/);
    await expect(product).not.toContainText("NaN");
  });

  test("searches the catalog through the live route", async ({ page }) => {
    await page.goto("/search");
    const input = page.getByPlaceholder(/Try Cyberpunk/i);
    await input.fill("Cyberpunk");
    await expect(page.getByText("Cyberpunk 2077")).toBeVisible();
  });

  test("request center exposes separate request paths", async ({ page }) => {
    await page.goto("/request");
    await expect(page.getByRole("heading", { name: /send a signal/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Request a game/i })).toHaveAttribute("href", "/request/game");
    await expect(page.getByRole("link", { name: /Request a movie/i })).toHaveAttribute("href", "/request/movie");
    await expect(page.getByRole("link", { name: /Request a series/i })).toHaveAttribute("href", "/request/series");
  });

  test("protects private account routes when unauthenticated", async ({ page }) => {
    await page.goto("/account/orders");
    await expect(page.getByText("Sign in securely")).toBeVisible();
  });

  test("protects the dedicated admin account route", async ({ page }) => {
    await page.goto("/admin/account");
    await expect(page.getByText("Admin access required")).toBeVisible();
    await expect(page.getByText(/authorized administrator identity/i)).toBeVisible();
  });

  test("protects admin settings and checkout until sign-in", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.getByText("Admin access required")).toBeVisible();
    await page.goto("/checkout");
    await expect(page.getByText("Sign in securely")).toBeVisible();
  });

  test("does not expose owner editing on public product details", async ({ page }) => {
    await page.goto("/products/half-life-2");
    await expect(page.getByRole("heading", { name: "Half-Life 2" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Edit full listing/i })).toHaveCount(0);
  });
});
