import { test, expect, login } from "./fixtures";

test.describe("Autenticación", () => {
  test("1. el usuario inicia sesión correctamente", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /centro de control/i })).toBeVisible();
  });

  test("22. una ruta protegida redirige al login si no hay sesión", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**");
    await expect(page).toHaveURL(/\/login/);
  });

  test("21. el usuario cierra sesión", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: /usuario|cuenta/i }).first().click();
    await page.getByRole("menuitem", { name: /cerrar sesión/i }).click();
    await page.waitForURL("**/login**");
    await expect(page).toHaveURL(/\/login/);
  });
});
