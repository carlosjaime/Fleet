# Arquitectura — FleetOps

## 1. Visión general

FleetOps es una aplicación Next.js 16 (App Router) desplegada en Vercel,
con Supabase como backend de datos, autenticación y tiempo real. No existe
un servidor separado: la lógica de servidor vive en Route Handlers, Server
Actions y Server Components, todos ejecutados en el runtime serverless de
Vercel.

```
┌──────────────────────────────────────────────────────────────────┐
│                           Navegador                               │
│  Client Components (mapa, formularios, realtime, simulador)       │
└───────────────┬─────────────────────────────────┬─────────────────┘
                 │ Server Actions / fetch           │ Supabase Realtime
                 ▼                                  ▼ (WebSocket)
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js 16 (Vercel, serverless)                 │
│  Server Components · Route Handlers (/api/*) · Server Actions      │
│  Middleware/Proxy (sesión) · Cliente Supabase (anon / service role)│
└───────────────┬─────────────────────────────────┬─────────────────┘
                 │ Postgres (RLS)                   │ Realtime (postgres_changes)
                 ▼                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                            Supabase                                │
│  PostgreSQL + RLS · Auth (GoTrue) · Realtime · Storage (futuro)    │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Server Components vs. Client Components

Regla general: **todo es Server Component por defecto**. Un archivo se
marca `"use client"` solo cuando necesita:

- Estado o efectos de React (formularios, mapas, realtime, simulador).
- APIs del navegador (localStorage nunca se usa para sesión, pero sí para
  preferencias de UI si se necesitaran).
- Interactividad inmediata (menús, diálogos, tabs).

Patrón usado en cada módulo (flota, conductores, rutas, alertas,
mantenimiento, combustible, analítica, configuración):

- `src/app/(dashboard)/<modulo>/page.tsx` — Server Component. Resuelve la
  sesión (`getSessionContext()`), hace `await` a `src/features/<modulo>/queries.ts`
  (funciones `server-only` que usan el cliente Supabase de servidor con
  RLS activo) y pasa los datos como props a un Client Component de
  presentación.
- `src/components/<modulo>/*.tsx` — Client Components de presentación,
  filtros, tablas, formularios.
- `src/features/<modulo>/actions.ts` — Server Actions (`"use server"`) que
  validan con Zod, verifican permisos con `assertCan()`, ejecutan la
  mutación con el cliente Supabase de servidor (RLS sigue activo — la
  Service Role Key NO se usa aquí) y registran en `activity_logs`.

Las excepciones deliberadas al patrón "RLS con la sesión del usuario" son
los servicios en `src/lib/services/` (ingestión de telemetría, rate
limiting, autenticación de dispositivos) que usan el **cliente
administrativo** (`createAdminClient()`, Service Role Key) porque no hay
sesión de navegador — la autorización ahí es la API key del dispositivo,
verificada explícitamente antes de tocar la base de datos.

## 3. Flujo de autenticación

1. `src/proxy.ts` (convención `proxy.ts` de Next.js 16, reemplazo de
   `middleware.ts`) intercepta cada request, refresca la sesión con
   `@supabase/ssr` (`src/lib/supabase/middleware.ts`) y redirige a
   `/login` si la ruta es protegida y no hay usuario, o a `/dashboard` si
   hay usuario en una ruta pública de auth.
2. Login/registro/recuperación/restablecimiento son Server Actions
   (`src/features/auth/actions.ts`) que usan `@supabase/ssr` para leer y
   escribir cookies HttpOnly — nunca se toca `localStorage`.
3. Al registrarse: `supabase.auth.signUp()` crea el usuario (el trigger
   SQL `handle_new_user` crea el `profile`), y la misma Server Action usa
   el cliente admin para crear la organización, la membresía `owner` y la
   configuración por defecto en una sola operación atómica desde el punto
   de vista del usuario.
4. `src/lib/auth/session.ts` expone `getSessionContext()` (usuario +
   organización activa + rol, cacheado por request con `React.cache`) y
   `requireRole()` para proteger páginas completas.

## 4. Modelo multi-tenant

- Toda tabla operativa tiene `organization_id`.
- La organización **activa** se guarda en una cookie HttpOnly
  (`fleetops-active-org`), pero **nunca se confía en ella sin
  verificar**: `getSessionContext()` siempre revalida que el usuario
  pertenece a esa organización con una consulta a `organization_members`
  antes de usarla (`src/lib/auth/session.ts`).
- `setActiveOrganization()` (Server Action) verifica membresía antes de
  escribir la cookie.
- Todas las consultas de servidor filtran explícitamente por
  `organization_id` **además de** RLS — defensa en profundidad: aunque
  una consulta olvidara el filtro, RLS seguiría bloqueando filas ajenas.

## 5. Row Level Security

Ver [`DATABASE.md`](./DATABASE.md#seguridad-rls) para el detalle de
políticas. Punto de diseño clave: las políticas de `organization_members`
(y las de todas las demás tablas) usan funciones `SECURITY DEFINER`
(`is_organization_member`, `has_organization_role`,
`current_user_organization_role`) para evitar la recursión infinita que
ocurriría si una política de `organization_members` tuviera que consultar
`organization_members` de nuevo bajo RLS normal.

## 6. Flujo GPS y motor de alertas

```
Dispositivo/proveedor GPS
        │  POST /api/telemetry/ingest
        │  Authorization: Bearer <api_key>
        ▼
verifyDeviceApiKey()  →  hash SHA-256, busca en device_api_keys
        │
        ▼
telemetryIngestSchema.safeParse()  (Zod: rangos de lat/lng/velocidad/
        │                            combustible/heading, timestamp razonable)
        ▼
checkTelemetryRateLimit()  →  cuenta filas recientes en truck_locations
        │                     (sin estado en memoria: serverless-safe)
        ▼
ingestTelemetry()  (src/lib/services/telemetry-ingest.ts)
   1. Resuelve el truck por unit_number + organization_id
   2. Idempotencia opcional por idempotencyKey
   3. INSERT en truck_locations
   4. UPDATE trucks (última posición conocida)
   5. INSERT telemetry_events (evento genérico)
   6. Si hay ruta activa: recalcula progress_pct (approximateProgress)
   7. evaluateRealtimeRules() → candidatos de alerta (velocidad,
      combustible bajo, desviación de ruta) usando los umbrales de
      organization_settings
   8. Por cada candidato: si no hay ya una alerta abierta del mismo tipo
      para esa unidad, INSERT en alerts
        ▼
Postgres (tablas ya en la publicación supabase_realtime)
        ▼
Supabase Realtime → hooks useTrucksRealtime / useAlertsRealtime /
                     useTruckLocationsRealtime → actualizan la caché de
                     TanStack Query → UI se re-renderiza sin recargar
```

El motor de reglas (`src/lib/telemetry/alert-rules.ts`) es un módulo puro
sin dependencias de Supabase — se prueba de forma aislada
(`tests/unit/alert-rules.test.ts`) y se reutiliza tanto en la ingestión
real como en el simulador con persistencia.

Reglas basadas en tiempo (GPS desconectado, retraso, mantenimiento
próximo/vencido) están implementadas como funciones puras
(`evaluateGpsOffline`, `evaluateDelay`, `evaluateMaintenanceDue`) listas
para ejecutarse desde un cron/Supabase Edge Function periódico — no se
conectó un disparador automático en este MVP porque Vercel no permite
procesos persistentes; la evolución natural es un cron de Vercel o una
Supabase Edge Function programada que las invoque cada N minutos.

## 7. Supabase Realtime

- Publicación `supabase_realtime` incluye `trucks`, `truck_locations`,
  `alerts`, `routes`, `drivers` (migración `0003`).
- Hooks en `src/hooks/use-*-realtime.ts`: se suscriben a
  `postgres_changes` filtrado por `organization_id=eq.<activeOrgId>`,
  actualizan la caché de TanStack Query (nunca hacen
  `location.reload()`), limpian el canal en el `return` del `useEffect`
  (`supabase.removeChannel`), y evitan suscripciones duplicadas con un
  `useRef` de guarda.
- `RealtimeProvider` centraliza el estado de conexión (`connecting` /
  `connected` / `disconnected`) mostrado en `RealtimeConnectionBadge`.

## 8. Simulador GPS

Dos modalidades completamente independientes:

1. **Visual (cliente)** — `GpsSimulatorProvider`
   (`src/components/providers/gps-simulator-provider.tsx`). Activo solo
   si `NEXT_PUBLIC_ENABLE_GPS_SIMULATOR=true`. Usa `setInterval` **en el
   navegador** (nunca en el servidor) para mover unidades demo sobre
   rutas predefinidas (`src/config/demo-routes.ts`), interpolando con
   `src/lib/telemetry/simulator-core.ts` (función pura, probada). No
   escribe en Supabase — es puramente para demostración visual sin
   backend.
2. **Con persistencia (opcional)** — `POST /api/simulator/tick`. Deshabilitado
   por completo en producción (`NODE_ENV === "production"`), requiere
   `SIMULATOR_SECRET` como Bearer token, y reutiliza el mismo
   `ingestTelemetry()` que usan los dispositivos reales (con
   `source: "simulator"`) para mover camiones con rutas `in_progress`
   hacia su destino y generar alertas reales. Pensado para invocarse
   manualmente durante pruebas, nunca como tarea programada dentro de
   Vercel.

La producción real usa exclusivamente `POST /api/telemetry/ingest` con
datos de dispositivos GPS o proveedores externos — ver
[`API.md`](./API.md).

## 9. Decisiones técnicas relevantes

- **Tipos de Supabase escritos a mano** (`src/types/database.types.ts`) en
  vez de generados, para que el proyecto compile sin una instancia de
  Supabase corriendo. Incluye el marcador `__InternalSupabase` requerido
  por versiones recientes de `@supabase/supabase-js` para la inferencia
  de tipos, y usa `type` (no `interface`) para los campos comunes
  (`Timestamps`) — una interfaz ahí rompe la comparación estructural
  contra `Record<string, unknown>` que usa el cliente tipado.
- **Permisos centralizados** (`src/lib/permissions/index.ts`): una sola
  matriz rol → permiso, usada tanto en el cliente (`PermissionGuard`,
  `usePermission`) para ocultar acciones, como en el servidor
  (`assertCan`) en cada Server Action. La autorización real y última
  siempre es RLS en Postgres — la capa de aplicación es UX, no el único
  candado.
- **Rate limiting sin estado en memoria**: dado que Vercel es serverless
  (sin memoria compartida entre invocaciones), el límite de telemetría se
  calcula contando filas recientes en `truck_locations` en vez de un
  contador en proceso.
- **React Hook Form + Zod, sin `.default()` en los schemas usados por
  formularios**: se descubrió (y se documenta en los mensajes de commit)
  que `zodResolver` produce un desajuste de tipos entre el tipo de
  entrada y salida del formulario cuando el schema usa `.default()` en
  campos que el formulario ya inicializa explícitamente vía
  `defaultValues` — se optó por mantener los campos requeridos y fijar
  el valor inicial en el propio `useForm`.
- **Parche de `@react-leaflet/core`**: `react-leaflet@5.0.0` publica
  declaraciones de tipos con imports profundos
  (`@react-leaflet/core/lib/context`) que su propio `package.json#exports`
  no expone como subpath válido — un defecto real del paquete, no de este
  proyecto. Se resolvió con un parche de pnpm (`patches/`) que amplía el
  mapa de exports, más un shim de tipos ambiente
  (`src/types/react-leaflet-shims.d.ts`) para los casos que el parche por
  sí solo no cubre. No se usó `skipLibCheck`.

## 10. Riesgos conocidos y limitaciones del MVP

- **Reglas de alerta basadas en tiempo** (GPS desconectado, retraso,
  mantenimiento) están implementadas pero no hay un disparador periódico
  automático conectado — requieren invocación externa (cron) para
  evaluarse fuera de una ingestión de telemetría.
- **Invitación de miembros** usa `auth.admin.inviteUserByEmail`, que
  requiere SMTP configurado en el proyecto Supabase para que el correo
  de invitación realmente llegue; sin eso, el usuario se crea pero no
  recibe el enlace.
- **Progreso de ruta** se aproxima con la proyección de la posición sobre
  el segmento origen→destino (`approximateProgress`), no con distancia
  real por carretera — es una aproximación razonable para el MVP;
  Directions API queda en el roadmap.
- **No se ejecutaron migraciones/seed/pruebas de integración/E2E contra
  una instancia real de Supabase** en el entorno donde se generó este
  proyecto (bloqueo de red a Docker Hub). Ver `TESTING.md` para el
  detalle exacto de qué se verificó y qué queda pendiente de correr en tu
  entorno.

## 11. Evolución futura

Ver la sección "Roadmap" de [`PRD.md`](./PRD.md).

## Despliegue

### Supabase

1. Crea un proyecto en Supabase Cloud.
2. `npx supabase link --project-ref <ref>`.
3. `npx supabase db push` para aplicar las migraciones.
4. En el dashboard de Supabase, configura el proveedor de email (SMTP) si
   quieres que funcionen las invitaciones de miembros y la recuperación
   de contraseña con envío real de correo.
5. (Opcional) `pnpm seed` apuntando a las credenciales del proyecto cloud
   para poblar datos demo.

### Vercel

1. Importa el repositorio en Vercel.
2. Configura las variables de entorno (ver README) en el proyecto de
   Vercel — usa los mismos nombres que `.env.example`. Marca
   `SUPABASE_SERVICE_ROLE_KEY` y `SIMULATOR_SECRET` como secretas.
3. Framework preset: Next.js (detectado automáticamente). Build command:
   `pnpm build`. Output: gestionado por Next.js.
4. Despliega. El dominio de Vercel debe coincidir con
   `NEXT_PUBLIC_APP_URL` para que los enlaces de los correos de Supabase
   Auth (confirmación, recuperación) apunten correctamente.
5. En Supabase, agrega la URL de producción a "Redirect URLs" en la
   configuración de Auth.
