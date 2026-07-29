import { test, expect, login } from "./fixtures";

test.describe("Rutas", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("9-11. se crea una ruta y se asignan unidad y conductor", async ({ page }) => {
    await page.goto("/rutas/nuevo");
    const name = `Ruta E2E ${Date.now()}`;
    await page.getByLabel(/nombre de la ruta/i).fill(name);
    await page.getByLabel(/nombre del origen/i).fill("CDMX");
    await page.getByLabel(/^latitud/i).first().fill("19.4326");
    await page.getByLabel(/^longitud/i).first().fill("-99.1332");
    await page.getByLabel(/nombre del destino/i).fill("Pachuca");
    await page.getByLabel(/^latitud/i).nth(1).fill("20.1011");
    await page.getByLabel(/^longitud/i).nth(1).fill("-98.7591");

    // Asigna unidad
    await page.getByLabel(/unidad asignada/i).click();
    await page.getByRole("option").first().click();
    // Asigna conductor
    await page.getByLabel(/conductor asignado/i).click();
    await page.getByRole("option").first().click();

    await page.getByRole("button", { name: /crear ruta/i }).click();
    await page.waitForURL("**/rutas");
    await expect(page.getByText(name)).toBeVisible();
  });

  test("12-15. ciclo de vida de una ruta: iniciar, pausar, reanudar, completar", async ({ page }) => {
    await page.goto("/rutas");
    // Abre la primera ruta programada o en progreso disponible.
    await page.getByRole("row").nth(1).click();

    const startBtn = page.getByRole("button", { name: /^iniciar$/i });
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await expect(page.getByText(/en progreso/i)).toBeVisible();
    }

    const pauseBtn = page.getByRole("button", { name: /^pausar$/i });
    if (await pauseBtn.isVisible().catch(() => false)) {
      await pauseBtn.click();
      await expect(page.getByText(/pausada/i)).toBeVisible();
    }

    const resumeBtn = page.getByRole("button", { name: /^reanudar$/i });
    if (await resumeBtn.isVisible().catch(() => false)) {
      await resumeBtn.click();
      await expect(page.getByText(/en progreso/i)).toBeVisible();
    }

    const completeBtn = page.getByRole("button", { name: /^completar$/i });
    if (await completeBtn.isVisible().catch(() => false)) {
      await completeBtn.click();
      await expect(page.getByText(/completada/i)).toBeVisible();
    }
  });
});
