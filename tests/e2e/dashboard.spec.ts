import { test, expect, login } from "./fixtures";

test.describe("Centro de control (dashboard)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("2-3. el dashboard carga y muestra KPIs", async ({ page }) => {
    await expect(page.getByText(/unidades totales/i)).toBeVisible();
    await expect(page.getByText(/alertas abiertas/i)).toBeVisible();
    await expect(page.getByText(/rutas en progreso/i)).toBeVisible();
  });

  test("4. el mapa renderiza unidades", async ({ page }) => {
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    await expect(page.locator(".fleet-marker").first()).toBeVisible({ timeout: 10_000 });
  });

  test("5. las posiciones simuladas cambian con el tiempo (si el simulador está activo)", async ({ page }) => {
    const simBadge = page.getByText(/modo simulación/i);
    if (!(await simBadge.isVisible().catch(() => false))) {
      test.skip(true, "El simulador GPS no está habilitado en este entorno (NEXT_PUBLIC_ENABLE_GPS_SIMULATOR).");
    }
    const marker = page.locator(".fleet-marker").first();
    const initialTransform = await marker.evaluate((el) => el.getAttribute("style"));
    await page.waitForTimeout(3000);
    const laterTransform = await marker.evaluate((el) => el.getAttribute("style"));
    expect(laterTransform).not.toBe(initialTransform);
  });
});
