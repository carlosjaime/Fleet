import { test, expect, login } from "./fixtures";

test.describe("Conductores", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("8. se crea un conductor", async ({ page }) => {
    await page.goto("/conductores/nuevo");
    const name = `Conductor E2E ${Date.now()}`;
    await page.getByLabel(/nombre completo/i).fill(name);
    await page.getByLabel(/^teléfono/i).fill("55 0000 0000");
    await page.getByRole("button", { name: /crear conductor/i }).click();
    await page.waitForURL("**/conductores");
    await expect(page.getByText(name)).toBeVisible();
  });
});
