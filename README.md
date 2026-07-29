# FleetOps

Plataforma SaaS de administración y monitoreo de flotillas de camiones para
empresas de transporte, logística, distribución y última milla en
Latinoamérica. Interfaz en español de México, tema oscuro operativo,
multiempresa con roles y permisos, telemetría GPS en tiempo real y motor de
alertas.

> Para el detalle de arquitectura, base de datos, API y pruebas consulta
> [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DATABASE.md`](./DATABASE.md),
> [`API.md`](./API.md), [`TESTING.md`](./TESTING.md) y
> [`PRD.md`](./PRD.md).

## Stack

- **Frontend/Backend**: Next.js 16 (App Router, Turbopack), React 19,
  TypeScript estricto, Server Components por defecto.
- **UI**: Tailwind CSS v4, componentes propios estilo shadcn/ui sobre Radix
  UI, Lucide Icons, React Hook Form + Zod, Sonner, Recharts, TanStack
  Table, TanStack Query.
- **Mapas**: React Leaflet + Leaflet + OpenStreetMap, tiles CARTO Dark
  Matter, carga dinámica sin SSR.
- **Backend de datos**: Supabase (PostgreSQL, Auth, Realtime), `@supabase/ssr`,
  Row Level Security en todas las tablas privadas.
- **Calidad**: ESLint 9 (flat config), Prettier, Vitest + Testing Library,
  Playwright.
- **Despliegue**: Vercel (app) + Supabase Cloud (datos/auth/realtime).

## Requisitos

- Node.js ≥ 20.11
- pnpm ≥ 10
- Una cuenta/proyecto de [Supabase](https://supabase.com) (cloud) o
  Supabase CLI + Docker para desarrollo local
- Docker (solo si usarás Supabase local)

## Instalación

```bash
pnpm install
cp .env.example .env.local
```

Completa `.env.local` con tus credenciales de Supabase (ver la sección de
variables de entorno más abajo).

## Configuración de Supabase

### Opción A — Proyecto Supabase Cloud

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia `Project URL` y `anon public key` a `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Copia la `service_role key` a `SUPABASE_SERVICE_ROLE_KEY` (nunca la
   expongas al cliente).
4. Aplica las migraciones (ver siguiente sección).

### Opción B — Supabase local (Docker)

```bash
npx supabase start
```

Copia las credenciales que imprime el comando (`API URL`, `anon key`,
`service_role key`) a `.env.local`. Las migraciones en
`supabase/migrations/` se aplican automáticamente al iniciar.

> **Nota sobre este repositorio**: el proyecto se desarrolló en un entorno
> sandbox donde las descargas de imágenes de Docker Hub estaban bloqueadas
> por política de red, por lo que no fue posible levantar Supabase local
> ahí. El esquema, las políticas RLS y el código están escritos y
> verificados por revisión exhaustiva, pero **no se ejecutaron migraciones
> contra una instancia real** en esa sesión. Ejecútalas en tu máquina o CI
> antes de usar la app contra datos reales.

## Migraciones

Las migraciones viven en `supabase/migrations/` y se aplican en orden:

| Archivo | Contenido |
|---|---|
| `0001_schema.sql` | Extensiones, enums, tablas, restricciones, índices, triggers `updated_at` |
| `0002_rls.sql` | Funciones auxiliares y políticas de Row Level Security |
| `0003_triggers_realtime.sql` | Trigger de alta de usuario, publicación `supabase_realtime` |

```bash
# Supabase local
npx supabase db reset      # aplica todas las migraciones desde cero

# Proyecto cloud (vincula el proyecto primero con `supabase link`)
npx supabase db push
```

## Seed (datos de demostración)

Crea la organización demo "Transportes Horizonte" con 8 unidades, 5
conductores, 5 rutas y alertas de ejemplo, y el usuario
`admin@fleetops.demo` / `FleetOps2026!` vía la Supabase Admin API.

```bash
pnpm seed
```

Es idempotente: puedes ejecutarlo varias veces sin duplicar datos.

## Ejecución local

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Pruebas

```bash
pnpm test              # unitarias + integración (Vitest)
pnpm test:integration  # solo integración (requiere Supabase real)
pnpm test:e2e          # end-to-end (Playwright, requiere app + Supabase)
pnpm test:watch        # modo watch
```

Ver [`TESTING.md`](./TESTING.md) para la estrategia completa, qué se
ejecutó realmente en este repositorio y qué requiere una instancia de
Supabase para verificarse.

## Build

```bash
pnpm build
pnpm start
```

## Despliegue

Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md#despliegue) para el detalle.

Resumen:

1. Crea/usa un proyecto Supabase Cloud, aplica migraciones
   (`supabase db push`).
2. Ejecuta `pnpm seed` apuntando al proyecto cloud si quieres datos demo.
3. Importa el repositorio en Vercel.
4. Configura las variables de entorno de producción en Vercel (ver abajo).
5. Despliega. El proxy (middleware), los Route Handlers y las Server
   Actions funcionan de forma nativa en el runtime de Vercel.

## Variables de entorno

Ver `.env.example` para la lista completa con comentarios. Resumen:

**Públicas** (expuestas al navegador, prefijo `NEXT_PUBLIC_*`):

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Nombre de la app mostrado en la UI |
| `NEXT_PUBLIC_APP_URL` | URL base de la app (usada en emails de auth) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública) de Supabase |
| `NEXT_PUBLIC_DEMO_MODE` | Muestra credenciales demo en `/login` |
| `NEXT_PUBLIC_ENABLE_GPS_SIMULATOR` | Activa el simulador GPS visual |

**Privadas** (solo servidor, NUNCA con prefijo `NEXT_PUBLIC_`):

| Variable | Descripción |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio — omite RLS, solo servidor |
| `SIMULATOR_SECRET` | Secreto para `POST /api/simulator/tick` |
| `TELEMETRY_RATE_LIMIT_MAX` | Máximo de solicitudes de telemetría por unidad en la ventana |
| `TELEMETRY_RATE_LIMIT_WINDOW_SECONDS` | Ventana de tiempo del rate limit |
| `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` | Solo usadas por `pnpm seed` |

## Solución de problemas

- **`pnpm dev` arranca pero las páginas del dashboard redirigen a
  `/login` en bucle**: revisa que `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` sean correctos y que el proyecto de
  Supabase esté accesible.
- **El dashboard carga vacío (sin unidades/alertas)**: ejecuta `pnpm seed`
  o crea datos manualmente desde la UI.
- **El mapa no aparece**: React Leaflet requiere `window`; el componente
  ya se carga con `next/dynamic` y `ssr: false` — si ves un error de
  hidratación, verifica que no lo estés importando desde un Server
  Component directamente.
- **`POST /api/telemetry/ingest` devuelve 401**: confirma que envías
  `Authorization: Bearer <api_key>` (nunca como query param) con una API
  key activa creada desde Configuración → API y dispositivos.
- **`POST /api/simulator/tick` devuelve 403**: solo funciona fuera de
  producción, con `NEXT_PUBLIC_ENABLE_GPS_SIMULATOR=true` y el header
  `Authorization: Bearer <SIMULATOR_SECRET>` correcto.
- **Error de tipos con `@react-leaflet/core`**: el proyecto incluye un
  parche (`patches/@react-leaflet__core@3.0.0.patch`, aplicado
  automáticamente por pnpm) y un shim de tipos
  (`src/types/react-leaflet-shims.d.ts`) para un defecto de empaquetado
  conocido en `react-leaflet@5.0.0`. Si ves este error de todos modos,
  ejecuta `pnpm install` de nuevo para asegurar que el parche se aplicó.
- **No tengo Docker / no puedo levantar Supabase local**: usa un proyecto
  Supabase Cloud gratuito en su lugar; el flujo de migraciones y seed es
  idéntico.
