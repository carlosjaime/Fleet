import { test, expect, login } from "./fixtures";

const VIEWER_EMAIL = process.env.E2E_VIEWER_EMAIL;
const VIEWER_PASSWORD = process.env.E2E_VIEWER_PASSWORD;

test.describe("Permisos y aislamiento multiempresa", () => {
  test("23. un usuario viewer no puede ejecutar acciones administrativas", async ({ page }) => {
    test.skip(
      !VIEWER_EMAIL || !VIEWER_PASSWORD,
      "Requiere E2E_VIEWER_EMAIL/E2E_VIEWER_PASSWORD de un usuario con rol viewer (ver TESTING.md).",
    );
    await login(page, VIEWER_EMAIL, VIEWER_PASSWORD);
    await page.goto("/flota");
    await expect(page.getByRole("button", { name: /nueva unidad/i })).not.toBeVisible();
  });

  test("24. un usuario no puede leer datos de otra organización", async ({ page }) => {
    await login(page);
    // Intento directo de navegar a un id de organización/recurso ajeno
    // debe resultar en "no encontrado" gracias a RLS, nunca en los datos.
    await page.goto("/flota/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText(/no encontrada|404|no encontrado/i)).toBeVisible();
  });
});

test.describe("Simulador GPS", () => {
  test("25. el simulador no aparece cuando está deshabilitado", async ({ page }) => {
    test.skip(
      process.env.NEXT_PUBLIC_ENABLE_GPS_SIMULATOR === "true",
      "Este entorno tiene el simulador habilitado; ejecuta con NEXT_PUBLIC_ENABLE_GPS_SIMULATOR=false para validar este caso.",
    );
    await login(page);
    await expect(page.getByText(/modo simulación/i)).not.toBeVisible();
  });
});
