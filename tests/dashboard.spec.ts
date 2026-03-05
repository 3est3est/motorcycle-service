import { test, expect } from "@playwright/test";

test.describe("Dashboard and Main Features", () => {
  // Navigation for Dashboard (Requires Auth)
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated users from users page", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated users from parts page", async ({ page }) => {
    await page.goto("/parts");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated users from repair-jobs page", async ({ page }) => {
    await page.goto("/repair-jobs");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Responsive Design Check", () => {
  test("mobile navigation should be visible", async ({ page }) => {
    // Set to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Branding should always be there
    await expect(page.locator("nav")).toContainText(/ป่าโยว์เย่/);

    // Header link "จองคิวซ่อม" should be visible
    await expect(page.locator("nav").getByRole("link", { name: "จองคิวซ่อม" })).toBeVisible();
  });
});

test.describe("Static Content Integrity", () => {
  test("should have essential contact information", async ({ page }) => {
    await page.goto("/");
    // Check for Location and Contact sections
    await expect(page.getByText("Location")).toBeVisible();
    await expect(page.getByText("Contact")).toBeVisible();
  });
});
