import { test, expect, login } from "./fixtures";

test.describe("Alertas", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/alertas");
  });

  test("16. se reconoce una alerta", async ({ page }) => {
    const ackButton = page.getByRole("button", { name: /reconocer/i }).first();
    if (!(await ackButton.isVisible().catch(() => false))) {
      test.skip(true, "No hay alertas abiertas para reconocer (ejecuta `pnpm seed`).");
    }
    await ackButton.click();
    await expect(page.getByText(/alerta reconocida/i)).toBeVisible();
  });

  test("17. se resuelve una alerta", async ({ page }) => {
    await page.getByRole("tab", { name: /reconocidas/i }).click();
    const resolveButton = page.getByRole("button", { name: /resolver/i }).first();
    if (!(await resolveButton.isVisible().catch(() => false))) {
      test.skip(true, "No hay alertas reconocidas para resolver.");
    }
    await resolveButton.click();
    await page.getByRole("button", { name: /confirmar resolución/i }).click();
    await expect(page.getByText(/alerta resuelta/i)).toBeVisible();
  });
});
