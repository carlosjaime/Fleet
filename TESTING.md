# Pruebas — FleetOps

## Estrategia

Tres niveles, cada uno con una responsabilidad distinta:

1. **Unitarias** (Vitest) — lógica de dominio pura, sin I/O: geometría
   GPS, motor de reglas de alertas, máquina de estados de rutas, permisos,
   formateo, validación de payloads, hashing de API keys, núcleo del
   simulador. No tocan Supabase ni React.
2. **Integración** (Vitest + Supabase real) — CRUD contra Postgres real,
   políticas RLS, restricciones de base de datos (unicidad, checks),
   ingestión de telemetría end-to-end contra la base. Requieren una
   instancia de Supabase accesible.
3. **E2E** (Playwright) — flujos de usuario completos en un navegador
   real contra la app corriendo con Supabase real.

## Comandos

```bash
pnpm test              # unitarias + integración (Vitest); las de
                        # integración se saltan automáticamente si no hay
                        # credenciales de Supabase en el entorno
pnpm test:watch         # modo watch
pnpm test:integration   # solo integración
pnpm test:e2e           # Playwright
pnpm test:e2e:ui        # Playwright con UI interactiva
pnpm clean:test         # limpia coverage/, playwright-report/, test-results/
```

## Qué se ejecutó realmente en este repositorio

Sé honesto con esta sección: no todo lo que está escrito se pudo correr
contra un backend real en el entorno donde se generó este proyecto.

| Suite | Estado | Detalle |
|---|---|---|
| Unitarias | ✅ **Ejecutadas y pasando** | `pnpm test` → 133/133 passing. Se corrigió un bug real detectado por la suite (`normalizeDegrees(-360)` devolvía `-0`). |
| Integración | ⚠️ **Escritas, no ejecutadas contra Postgres real** | 33 pruebas en `tests/integration/`. Se verificó que compilan y que se saltan limpiamente (`describe.skip`, 0 fallos) sin credenciales — pero su propósito (verificar RLS/constraints reales) solo se cumple corriéndolas contra Supabase real, lo cual no fue posible: el sandbox bloquea la descarga de imágenes de Docker Hub necesarias para `supabase start` (`403` en `production.cloudfront.docker.com`, confirmado en `curl "$HTTPS_PROXY/__agentproxy/status"`). |
| E2E | ⚠️ **Escritas, no ejecutadas contra la app real** | 19 pruebas en `tests/e2e/` cubriendo los 25 escenarios requeridos. Verificado con `npx playwright test --list` que las 19 registran correctamente (sintaxis y selectores válidos). No se ejecutaron de punta a punta porque requieren la misma instancia de Supabase que las de integración. |
| Smoke visual manual | ✅ **Ejecutado** | Se construyó la app (`pnpm build`), se sirvió (`pnpm start`) y se navegó con Chromium real (Playwright) a `/`, `/login` y `/registro` en desktop (1440px) y mobile (390px): 0 errores de consola, 0 `pageerror`, capturas de pantalla verificadas visualmente. Esto detectó y corrigió un 404 real de `/favicon.ico`. |

**Para verificar de punta a punta**: levanta Supabase (local con Docker en
una máquina/CI sin ese bloqueo de red, o un proyecto Supabase Cloud),
aplica las migraciones, corre `pnpm seed`, y ejecuta `pnpm test`,
`pnpm test:integration` y `pnpm test:e2e`.

## Fixtures y usuarios de prueba

- **Unitarias**: no requieren fixtures externos; cada test construye sus
  propios datos de entrada inline.
- **Integración** (`tests/integration/helpers.ts`): crea usuarios y
  organizaciones de prueba dinámicamente por test (`createTestUser`,
  `createTestOrganization`, `addMember`) vía la Supabase Admin API, y los
  limpia en `afterAll` (`cleanupOrganization`, `deleteTestUser`). No
  depende del seed de demo.
- **E2E** (`tests/e2e/fixtures.ts`): usa las credenciales demo
  (`admin@fleetops.demo` / `FleetOps2026!`, creadas por `pnpm seed`) para
  el login. Los escenarios de permisos por rol (`viewer` no puede
  administrar) requieren además `E2E_VIEWER_EMAIL` /
  `E2E_VIEWER_PASSWORD` apuntando a un usuario con rol `viewer` en la
  misma organización — crea uno manualmente desde Configuración →
  Usuarios antes de correr esa prueba, o el test se salta automáticamente.

## Cobertura crítica por área

| Área | Unitarias | Integración |
|---|---|---|
| Geometría GPS (Haversine, interpolación, desviación, progreso) | ✅ 25 tests | — |
| Motor de alertas (velocidad, combustible, desviación, offline, retraso, mantenimiento) | ✅ 24 tests | ✅ (vía ingestión real) |
| Máquina de estados de rutas | ✅ 13 tests | ✅ (dos rutas activas en la misma unidad) |
| Permisos por rol | ✅ 15 tests | ✅ (RLS: viewer/operator/dispatcher/owner) |
| Formateo es-MX (moneda, fechas, números) | ✅ 15 tests | — |
| Validación de telemetría (Zod) | ✅ 13 tests | ✅ (ingestión end-to-end) |
| API keys de dispositivos (generar/hash/verificar) | ✅ 12 tests | ✅ (crear/revocar) |
| Simulador GPS (núcleo puro) | ✅ 6 tests | — |
| Redirecciones abiertas (`safeRedirectPath`) | ✅ 6 tests | — |
| Aislamiento multiempresa (RLS cruzado) | — | ✅ |
| CRUD flota/conductores/rutas/combustible/mantenimiento | — | ✅ |
| Creación de organización/perfil/membresía | — | ✅ |

## Comandos de calidad adicionales

```bash
pnpm lint            # ESLint (0 errores en este repositorio)
pnpm typecheck        # tsc --noEmit (0 errores en este repositorio)
pnpm format:check     # Prettier
```

Ninguno de estos usa `skipLibCheck`, `@ts-ignore`, `any` para silenciar
errores, ni desactiva reglas de ESLint para ocultar problemas reales — los
únicos "warnings" que quedan en `pnpm lint` son informativos del React
Compiler indicando que ciertas librerías de terceros (`react-hook-form`,
`@tanstack/react-table`) no son compatibles con memoización automática,
lo cual no afecta la corrección del código.
