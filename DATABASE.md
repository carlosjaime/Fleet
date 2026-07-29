# Base de datos — FleetOps

PostgreSQL vía Supabase. Todo el esquema vive en
`supabase/migrations/*.sql`, versionado y aplicado en orden numérico.
Nunca se edita una migración ya aplicada: los cambios futuros se agregan
como una nueva migración (`0004_...sql`, etc.).

## Tablas

| Tabla | Propósito | Multi-tenant |
|---|---|---|
| `profiles` | Datos de perfil 1:1 con `auth.users` | — (por usuario) |
| `organizations` | Empresas (tenants) | — |
| `organization_members` | Membresía usuario↔organización + rol | ✓ |
| `organization_settings` | Umbrales operativos por organización | ✓ |
| `trucks` | Unidades de la flotilla | ✓ |
| `drivers` | Conductores | ✓ |
| `routes` | Rutas planeadas/en curso/completadas | ✓ |
| `route_waypoints` | Puntos intermedios de una ruta | ✓ |
| `truck_locations` | Historial de posiciones GPS | ✓ |
| `telemetry_events` | Eventos de telemetría genéricos | ✓ |
| `alerts` | Alertas operativas | ✓ |
| `maintenance_records` | Mantenimientos preventivos/correctivos | ✓ |
| `fuel_logs` | Cargas de combustible | ✓ |
| `activity_logs` | Auditoría de acciones | ✓ |
| `device_api_keys` | Credenciales de dispositivos GPS (solo hash) | ✓ |

### Relaciones principales

```
organizations 1──* organization_members *──1 auth.users (perfil en profiles)
organizations 1──1 organization_settings
organizations 1──* trucks
organizations 1──* drivers
organizations 1──* routes ──* route_waypoints
routes        *──1 trucks (truck_id, nullable)
routes        *──1 drivers (driver_id, nullable)
trucks        1──* truck_locations
trucks        1──* telemetry_events
trucks        1──* alerts (nullable)
trucks        1──* maintenance_records
trucks        1──* fuel_logs
trucks        *──1 drivers (active_driver_id, nullable)
organizations 1──* device_api_keys ──1 trucks (nullable, restringe la key a una unidad)
```

### Restricciones destacadas

- `organization_members`: `UNIQUE (organization_id, user_id)` — evita
  membresías duplicadas.
- `trucks`: `UNIQUE (organization_id, unit_number)`,
  `UNIQUE (organization_id, plate)`, `UNIQUE (organization_id, vin) WHERE vin IS NOT NULL`.
- `routes`: índices únicos parciales
  `uq_route_active_truck ON routes(truck_id) WHERE status IN ('in_progress','paused')`
  y el equivalente para `driver_id` — a nivel de base de datos, no solo de
  aplicación, se impide que una unidad o un conductor tengan dos rutas
  activas simultáneas.
- `alerts`: índice único parcial
  `uq_alert_open ON alerts(organization_id, truck_id, type) WHERE status = 'open'`
  — deduplica alertas abiertas del mismo tipo para la misma unidad.
- `fuel_logs`: `CHECK (liters > 0)`, `CHECK (price_per_liter >= 0)`,
  `CHECK (total_cost >= 0)`.
- Todos los importes monetarios usan `numeric(12,2)` (nunca `float`).
- Todas las fechas usan `timestamptz`.

### Índices de rendimiento

`truck_locations` (la tabla de mayor volumen) tiene índices por
`organization_id`, `truck_id`, `recorded_at DESC`,
`(truck_id, recorded_at DESC)` y `(organization_id, recorded_at DESC)`
para soportar tanto el historial por unidad como los reportes por
organización sin escaneos completos.

## Triggers

- `set_updated_at()` — genérico, actualiza `updated_at = now()` en cada
  `UPDATE`. Aplicado a todas las tablas con esa columna.
- `handle_new_user()` — `AFTER INSERT ON auth.users`, crea la fila en
  `profiles` automáticamente (`SECURITY DEFINER`).

## Seguridad (RLS)

RLS está **activo en todas las tablas privadas** (`alter table ... enable
row level security`). No existe ninguna política `using (true)`.

### Funciones auxiliares (`SECURITY DEFINER`)

```sql
is_organization_member(organization_uuid uuid) returns boolean
has_organization_role(organization_uuid uuid, allowed_roles text[]) returns boolean
current_user_organization_role(organization_uuid uuid) returns text
```

Son `SECURITY DEFINER` y consultan `organization_members` directamente
(saltando RLS de forma controlada dentro de la propia función) para poder
usarse **desde las políticas de `organization_members`** sin causar
recursión infinita — si la política de esa tabla tuviera que volver a
evaluar RLS sobre sí misma para resolver la membresía, entraría en un
ciclo.

### Matriz de políticas por tabla

| Tabla | SELECT | INSERT/UPDATE | DELETE |
|---|---|---|---|
| `profiles` | dueño (`id = auth.uid()`) | dueño | — |
| `organizations` | miembro | cualquier usuario autenticado (crea, se vuelve owner) / owner+admin actualiza | owner |
| `organization_members` | miembro | self o owner/admin | owner/admin |
| `organization_settings` | miembro | owner/admin | — |
| `drivers`, `trucks`, `routes`, `route_waypoints` | miembro | owner/admin/dispatcher | owner/admin (trucks/routes); drivers igual |
| `truck_locations`, `telemetry_events` | miembro | — (solo Service Role, ingestión) | — |
| `alerts` | miembro | owner/admin/dispatcher/operator | — |
| `alerts` (UPDATE — reconocer/resolver) | — | owner/admin/dispatcher/operator | — |
| `maintenance_records` | miembro | owner/admin/dispatcher | owner/admin/dispatcher |
| `fuel_logs` | miembro | owner/admin/dispatcher/operator | owner/admin |
| `activity_logs` | miembro | — (solo servidor) | — |
| `device_api_keys` | owner/admin | owner/admin | owner/admin |

`truck_locations`, `telemetry_events` y `activity_logs` no tienen política
de escritura para el rol `authenticated`: se insertan exclusivamente desde
el servidor con el cliente de Service Role, después de validar la API key
del dispositivo o la sesión del usuario en la capa de aplicación.

### Pruebas de RLS

`tests/integration/rls-policies.test.ts` verifica contra Postgres real:

- Un usuario no puede leer organizaciones ajenas.
- Un usuario no puede leer unidades de otra organización.
- Un `viewer` no puede crear unidades ni modificar/eliminar rutas.
- Un `operator` puede reconocer alertas pero no puede cambiar roles de
  miembros.
- Un `dispatcher` puede crear rutas.
- Un `owner` puede administrar miembros.

## Estrategia de migraciones

- Cada migración es un archivo `.sql` numerado secuencialmente en
  `supabase/migrations/`.
- Se aplican con `npx supabase db reset` (desde cero, local) o
  `npx supabase db push` (incremental, contra un proyecto vinculado).
- Nunca se edita una migración ya aplicada en un ambiente compartido:
  los cambios se agregan como una nueva migración.
- Los tipos TypeScript (`src/types/database.types.ts`) deben mantenerse
  en sincronía manualmente con el esquema, o regenerarse con
  `pnpm db:types` (`supabase gen types typescript --local`) contra una
  instancia local con las migraciones aplicadas.
