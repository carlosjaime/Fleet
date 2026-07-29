import { test, expect, login } from "./fixtures";

test.describe("Combustible", () => {
  test("18. se registra combustible", async ({ page }) => {
    await login(page);
    await page.goto("/combustible/nuevo");
    await page.getByLabel(/^unidad/i).click();
    await page.getByRole("option").first().click();
    await page.getByLabel(/^litros/i).fill("120");
    await page.getByLabel(/precio por litro/i).fill("24.50");
    await page.getByRole("button", { name: /registrar carga/i }).click();
    await page.waitForURL("**/combustible");
    await expect(page.getByText(/\$2,940\.00|2,940\.00/)).toBeVisible();
  });
});

test.describe("Mantenimiento", () => {
  test("19. se programa mantenimiento", async ({ page }) => {
    await login(page);
    await page.goto("/mantenimiento/nuevo");
    await page.getByLabel(/^unidad/i).click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /registrar mantenimiento/i }).click();
    await page.waitForURL("**/mantenimiento");
    await expect(page.getByRole("heading", { name: /mantenimiento/i })).toBeVisible();
  });
});

test.describe("Analítica", () => {
  test("20. se consulta analítica", async ({ page }) => {
    await login(page);
    await page.goto("/analitica");
    await expect(page.getByText(/distancia total/i)).toBeVisible();
    await expect(page.getByText(/entregas a tiempo/i)).toBeVisible();
  });
});
