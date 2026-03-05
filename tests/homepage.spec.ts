import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the correct shop name in Thai", async ({ page }) => {
    // Branding text might be split or have varying whitespace - use a broader match
    await expect(page.locator("nav")).toContainText(/ป่าโยว์เย่/);
    await expect(page.locator("nav")).toContainText(/การช่าง/);
  });

  test("should have a working theme toggle", async ({ page }) => {
    const html = page.locator("html");

    // Check initial state (should be light or dark based on cookies/system)
    // We can force it by clicking
    const themeToggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(themeToggle).toBeVisible();

    const initialClass = await html.getAttribute("class");
    const isInitialDark = initialClass?.includes("dark");

    await themeToggle.click();

    // Wait for transition or class change
    if (isInitialDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }
  });

  test('should navigate to registration page when clicking "จองคิวซ่อม"', async ({ page }) => {
    // There might be multiple buttons with this text, let's use the nav one
    const registerBtn = page.locator("nav").getByRole("link", { name: "จองคิวซ่อม" });
    await registerBtn.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should navigate to login page when clicking "เข้าสู่ระบบ"', async ({ page, isMobile }) => {
    const loginLink = page.locator("nav").getByRole("link", { name: "เข้าสู่ระบบ" });

    // Skip on mobile since it's hidden by className="hidden sm:block"
    if (isMobile) {
      await expect(loginLink).toBeHidden();
      return;
    }

    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
