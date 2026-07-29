import { test as base, expect, type Page } from "@playwright/test";

export const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "admin@fleetops.demo";
export const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "FleetOps2026!";

/** Inicia sesión con las credenciales demo y espera a llegar al dashboard. */
export async function login(page: Page, email = DEMO_EMAIL, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await page.waitForURL("**/dashboard");
}

export const test = base;
export { expect };
