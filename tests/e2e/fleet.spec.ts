import { test, expect, login } from "./fixtures";

test.describe("Flota", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("6. se crea un camión", async ({ page }) => {
    await page.goto("/flota/nuevo");
    const unitNumber = `E2E-${Date.now()}`;
    await page.getByLabel(/nombre de la unidad/i).fill("Unidad E2E");
    await page.getByLabel(/número de unidad/i).fill(unitNumber);
    await page.getByLabel(/^placa/i).fill(`PLA-${Date.now() % 10000}`);
    await page.getByRole("button", { name: /crear unidad/i }).click();
    await page.waitForURL("**/flota");
    await expect(page.getByText(unitNumber)).toBeVisible();
  });

  test("7. se edita un camión", async ({ page }) => {
    await page.goto("/flota");
    await page.getByRole("row").nth(1).click();
    await page.getByRole("link", { name: /editar/i }).click();
    await page.getByLabel(/^color/i).fill("Rojo");
    await page.getByRole("button", { name: /guardar cambios/i }).click();
    await expect(page.getByText(/unidad actualizada|guardado/i)).toBeVisible();
  });
});
