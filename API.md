# API — FleetOps

Además de Server Actions internas (usadas por la propia UI y no
documentadas aquí como "API pública"), FleetOps expone tres Route
Handlers HTTP bajo `src/app/api/`.

## Formato de respuesta estándar

Todos los endpoints devuelven uno de estos dos formatos:

```ts
type ApiSuccess<T> = { success: true; data: T };
type ApiError = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};
```

Nunca se devuelven stack traces ni detalles internos al cliente en caso de
error 500.

---

## `POST /api/telemetry/ingest`

Recibe telemetría GPS de dispositivos o proveedores externos. Este es el
endpoint de **producción real** — el simulador con persistencia
(`/api/simulator/tick`) internamente reutiliza la misma lógica pero es
exclusivo de desarrollo/demo.

### Autenticación

- Header `Authorization: Bearer <api_key>`.
- La API key se compara por **hash SHA-256** contra `device_api_keys`
  (nunca se guarda en texto plano).
- **Nunca se acepta la clave por query params.**
- Si la clave está asociada a una unidad específica (`truck_id` en
  `device_api_keys`), el `unitNumber` del body debe coincidir; si no,
  responde `403 TRUCK_MISMATCH`.

### Body

```json
{
  "unitNumber": "TRK-001",
  "latitude": 20.101,
  "longitude": -98.759,
  "speedKmh": 72,
  "heading": 135,
  "fuelPct": 64,
  "odometerKm": 148250.4,
  "recordedAt": "2026-07-29T06:00:00.000Z",
  "accuracyMeters": 8,
  "idempotencyKey": "opcional-para-evitar-duplicados",
  "metadata": {}
}
```

Validación (Zod, `src/lib/validations/telemetry.ts`):

| Campo | Regla |
|---|---|
| `unitNumber` | string no vacío, máx. 64 caracteres |
| `latitude` | -90 a 90 |
| `longitude` | -180 a 180 |
| `speedKmh` | 0 a 400 |
| `heading` | 0 a 359 |
| `fuelPct` | 0 a 100 |
| `odometerKm` | 0 a 10,000,000 |
| `recordedAt` | ISO 8601, opcional; rechazado si es > 24h en el pasado o > 5 min en el futuro |
| `accuracyMeters` | opcional, 0 a 10,000 |

### Respuesta exitosa (200)

```json
{
  "success": true,
  "data": { "truckId": "uuid", "locationId": "uuid", "alertsCreated": 0 }
}
```

### Errores

| Código HTTP | `error.code` | Causa |
|---|---|---|
| 400 | `INVALID_JSON` | El body no es JSON válido |
| 401 | `UNAUTHORIZED` | Falta el header o la API key es inválida/revocada/expirada |
| 403 | `TRUCK_MISMATCH` | La API key está restringida a otra unidad |
| 404 | `TRUCK_NOT_FOUND` | No existe una unidad con ese `unitNumber` en la organización de la key |
| 413 | `PAYLOAD_TOO_LARGE` | Body mayor a 16 KB |
| 422 | `INVALID_TELEMETRY` | Falla de validación Zod (incluye `error.details`) |
| 429 | `RATE_LIMITED` | Se superó `TELEMETRY_RATE_LIMIT_MAX` solicitudes por `TELEMETRY_RATE_LIMIT_WINDOW_SECONDS` para esa unidad |
| 500 | `INTERNAL_ERROR` | Error inesperado del servidor |

### Rate limiting

Sin estado en memoria (Vercel es serverless): se cuenta cuántas filas
insertó esta unidad en `truck_locations` dentro de la ventana configurada
(`TELEMETRY_RATE_LIMIT_WINDOW_SECONDS`, default 60s) y se compara contra
`TELEMETRY_RATE_LIMIT_MAX` (default 120). Ante un error al contar, la
solicitud se permite (fail-open) para no bloquear ingestión real por un
problema transitorio de la base.

### Seguridad de dispositivos

- Las API keys se generan desde **Configuración → API y dispositivos**
  (rol `owner`/`admin`). La clave completa se muestra **una sola vez**
  al crearla; después solo se ve el prefijo (`fops_ab12cd…`).
- `key_hash` (SHA-256) es lo único persistido; la comparación en
  `verifyApiKey`/`timingSafeEqual` es en tiempo constante.
- Revocar una key (`status = 'revoked'`) la invalida de inmediato para
  futuras solicitudes.
- `last_used_at` se actualiza de forma best-effort en cada verificación
  exitosa.

### Ejemplo

```bash
curl -X POST https://tu-app.vercel.app/api/telemetry/ingest \
  -H "Authorization: Bearer fops_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "unitNumber": "TRK-001",
    "latitude": 20.101,
    "longitude": -98.759,
    "speedKmh": 72,
    "heading": 135,
    "fuelPct": 64,
    "odometerKm": 148250.4
  }'
```

---

## `POST /api/simulator/tick`

Endpoint de **persistencia opcional** del simulador GPS, exclusivo de
desarrollo/demo. Mueve las unidades con una ruta `in_progress` hacia su
destino y llama internamente a la misma lógica de `/api/telemetry/ingest`
(con `source: "simulator"`), por lo que también evalúa el motor de
alertas y actualiza el progreso de la ruta.

### Restricciones

- Responde `403 DISABLED_IN_PRODUCTION` si `NODE_ENV === "production"`.
- Responde `403 SIMULATOR_DISABLED` si
  `NEXT_PUBLIC_ENABLE_GPS_SIMULATOR` no es `"true"`.
- Requiere `Authorization: Bearer <SIMULATOR_SECRET>` — nunca debe
  exponerse públicamente ni llamarse desde el cliente.

### Body

```json
{ "organizationId": "uuid-de-la-organizacion" }
```

### Respuesta

```json
{ "success": true, "data": { "ticked": 3 } }
```

`ticked` es el número de unidades cuya posición se actualizó (solo se
mueven unidades con una ruta en estado `in_progress`).

---

## `GET /api/health`

Endpoint de salud, sin autenticación.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "supabaseConfigured": true,
    "timestamp": "2026-07-29T06:00:00.000Z"
  }
}
```

---

## Diferencia entre Realtime visual, datos simulados, GPS real y persistencia histórica

| Fuente | ¿Dónde vive? | ¿Persiste en Supabase? | ¿Dispara alertas reales? |
|---|---|---|---|
| **Realtime visual** (`GpsSimulatorProvider`) | Cliente (navegador) | No | No — es puramente de demostración |
| **Simulador con persistencia** (`/api/simulator/tick`) | Servidor, invocado manualmente | Sí | Sí, vía el mismo motor que producción |
| **GPS real** (`/api/telemetry/ingest`) | Servidor, invocado por el dispositivo/proveedor | Sí | Sí |
| **Historial** (`truck_locations`) | Postgres | — | — (es el resultado de las dos rutas anteriores que sí persisten) |

Todas las rutas que persisten datos (simulador con persistencia y GPS
real) pasan por el mismo `ingestTelemetry()`, así que el comportamiento de
alertas, actualización de posición y Realtime es idéntico entre ambas —
la única diferencia es el campo `source` (`device` vs `simulator`) y la
autenticación (API key de dispositivo vs. `SIMULATOR_SECRET`).
