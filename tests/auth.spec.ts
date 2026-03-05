import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show validation errors on empty login", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    // Check for validation messages (Thai)
    await expect(page.getByText("รูปแบบอีเมลไม่ถูกต้อง")).toBeVisible();
    await expect(page.getByText("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("wrong@example.com");
    await page.locator('input[name="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    // Should show error message from server
    // Since we don't have a specific mock, it will fail 401/500
    // We just check if a message appears
    await expect(page.locator(".bg-destructive\\/10")).toBeVisible();
  });

  test("should navigate between login and register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "สมัครสมาชิก" }).click();
    await expect(page).toHaveURL(/\/register/);

    await page.getByRole("link", { name: "เข้าสู่ระบบ" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
