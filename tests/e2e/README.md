# Pruebas E2E (Playwright)

Estas pruebas ejercitan la aplicación completa en un navegador real contra
una instancia de Supabase con datos de seed. **Requieren:**

1. Supabase corriendo (local con `npx supabase start`, o un proyecto
   cloud) con las migraciones aplicadas.
2. `.env.local` configurado con las credenciales de Supabase.
3. El seed ejecutado: `pnpm seed` (crea `admin@fleetops.demo` /
   `FleetOps2026!` y la organización "Transportes Horizonte").
4. La app construida y sirviendo: Playwright la levanta automáticamente
   vía `webServer` en `playwright.config.ts` (`pnpm build && pnpm start`).

```bash
pnpm test:e2e
```

## Nota sobre este entorno

Estos archivos se escribieron cubriendo los 25 escenarios del documento de
requerimientos, pero **no se ejecutaron contra un backend real** en la
sesión que generó este proyecto: el sandbox bloquea las descargas de
imágenes de Docker Hub necesarias para levantar Supabase local (ver
`tests/integration/README.md` para el detalle). Sin una sesión autenticada
real, los flujos de login/CRUD no pueden verificarse aquí.

Ejecuta esta suite en tu máquina local o en CI con acceso a Docker Hub (o
contra un proyecto Supabase Cloud de pruebas) para verificarla de punta a
punta antes de considerar el proyecto completamente probado.
