# PRD — FleetOps

## Problema

Las empresas de transporte, logística, distribución y última milla en
Latinoamérica operan flotillas de decenas o cientos de camiones con
visibilidad fragmentada: hojas de cálculo para mantenimiento, WhatsApp
para coordinar rutas, y sistemas de rastreo GPS aislados que no se
conectan con la operación (conductores, combustible, alertas). El
resultado es reacción tardía ante exceso de velocidad, desvíos de ruta,
combustible bajo o mantenimientos vencidos, y falta de métricas
consolidadas para tomar decisiones operativas.

## Usuarios

| Rol | Necesidad principal |
|---|---|
| **Propietario / Director de operaciones** (`owner`) | Visibilidad total, control de usuarios y configuración de la empresa. |
| **Administrador** (`admin`) | Gestión operativa completa (flota, conductores, usuarios) sin control total de la cuenta. |
| **Despachador** (`dispatcher`) | Crear y asignar rutas, supervisar el estado de la operación del día. |
| **Operador / Monitorista** (`operator`) | Vigilar el centro de control, reconocer y resolver alertas, registrar combustible. |
| **Consulta** (`viewer`) | Acceso de solo lectura (clientes internos, auditoría, dirección). |

## Propuesta de valor

Un centro de control único, en español de México, que unifica telemetría
GPS en tiempo real, alertas automáticas, gestión de rutas, mantenimiento y
combustible — con seguridad multiempresa real (RLS a nivel de base de
datos, no solo de aplicación) para operar como SaaS con múltiples
clientes sin riesgo de fuga de datos entre organizaciones.

## Funcionalidades (MVP entregado)

- Autenticación completa (registro, login, recuperación/restablecimiento
  de contraseña, confirmación de correo) con sesión en cookies seguras.
- Multiempresa: organizaciones, membresías, 5 roles, selector de
  organización activa.
- Flota: CRUD de unidades, cambio de estado, asignación de conductor,
  vista de detalle con telemetría, historial, rutas, combustible,
  mantenimiento y alertas relacionadas.
- Conductores: CRUD, suspender/reactivar, tarjetas con estado de
  licencia, rutas asignadas.
- Rutas: CRUD con waypoints, máquina de estados completa
  (programar/iniciar/pausar/reanudar/completar/cancelar) con reglas de
  negocio (no iniciar sin unidad+conductor, no asignar conductor
  suspendido ni unidad en mantenimiento, no dos rutas activas por
  unidad/conductor), historial de eventos.
- Ingestión de telemetría GPS real vía API con autenticación por API key
  de dispositivo, rate limiting y motor de alertas automático.
- Alertas: 7 tipos, 3 severidades, ciclo abierta→reconocida→resuelta con
  notas de resolución.
- Mantenimiento: preventivo/correctivo/inspección, KPIs de costos y
  pendientes, sincronización con el estado de la unidad.
- Combustible: registro de cargas, cálculo de rendimiento (km/L) y costo
  por km por unidad, detección de consumo atípico.
- Analítica: distancia, combustible, entregas a tiempo, alertas por tipo,
  utilización de flota, rendimiento por conductor/unidad, filtros de
  fecha.
- Configuración: perfil de empresa, usuarios y roles, umbrales de
  alertas/telemetría, API keys de dispositivos.
- Simulador GPS visual (demo, sin backend) y con persistencia opcional
  (pruebas end-to-end del pipeline real).
- Realtime: posiciones, alertas, rutas y conductores se actualizan sin
  recargar la página.

## Flujos clave

1. **Onboarding**: registro → creación automática de organización +
   membresía `owner` + configuración por defecto → dashboard.
2. **Operación diaria**: el despachador crea y asigna rutas → el
   dispositivo GPS de la unidad envía telemetría → el motor de alertas
   detecta anomalías → el operador reconoce/resuelve desde el centro de
   control → el despachador cierra la ruta al completarse.
3. **Mantenimiento preventivo**: se programa un servicio con
   kilometraje/fecha objetivo → el sistema puede alertar cuando se acerca
   o vence (regla implementada, disparo periódico pendiente de un cron
   externo — ver `ARCHITECTURE.md`).

## Requisitos no funcionales

- **Seguridad**: RLS en toda tabla privada, Service Role Key nunca en
  cliente, API keys de dispositivo solo como hash, protección contra
  redirecciones abiertas, rate limiting en ingestión de telemetría.
- **Rendimiento**: índices en las consultas de mayor volumen
  (`truck_locations`), paginación donde aplica, sin problemas N+1
  conocidos en las consultas implementadas.
- **Disponibilidad**: arquitectura 100% serverless (Vercel + Supabase),
  sin procesos persistentes que puedan caerse silenciosamente.
- **Usabilidad**: estados de carga/vacío/error/reintento en toda la UI,
  formularios validados con mensajes junto al campo, sin `window.alert`,
  navegación por teclado y foco visible, contraste alto sobre tema
  oscuro.
- **Internacionalización operativa**: interfaz 100% en español de México,
  moneda MXN, sistema métrico, zona horaria por organización
  (`America/Mexico_City` por defecto).

## KPIs de producto (a monitorear post-lanzamiento)

- Tiempo entre detección de una alerta crítica y su reconocimiento.
- % de entregas a tiempo por organización.
- % de unidades con telemetría activa (no offline) en horario operativo.
- Adopción de módulos secundarios (mantenimiento, combustible, analítica)
  más allá del dashboard.
- Tiempo de onboarding (registro → primera unidad creada).

## Roadmap futuro

No bloquea el MVP; documentado para priorización posterior:

- Aplicación móvil (Flutter) y app dedicada para conductores.
- Integración con proveedores GPS/OBD/IoT de terceros.
- Geocodificación y autocompletado de direcciones; Directions API para
  trayectos reales y optimización automática de rutas.
- Notificaciones push y WhatsApp.
- Mantenimiento predictivo e IA para detección de anomalías de consumo.
- Firma digital y evidencia fotográfica de entregas; comprobantes de
  entrega.
- Integración con ERP y facturación.
- Planes de suscripción con límites por plan.
- Portal para clientes con tracking público mediante enlace seguro.
- Geocercas.
- Control de gastos de viaje.
- Aplicación offline para conductores.
