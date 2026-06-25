import { test, expect } from "@playwright/test";

test.describe("Playwright skeleton", () => {
  test("loads the app root", async ({ page }) => {
    // Adjust URL if your dev server runs on a different port
    await page.goto("http://localhost:5173");
    await expect(page).toHaveTitle(/aidSprint/i);
  });
});
