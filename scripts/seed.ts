/**
 * Script de seed para FleetOps.
 *
 * Crea una organización demo ("Transportes Horizonte") con usuario admin,
 * camiones, conductores, rutas y alertas coherentes entre sí, usando la
 * Supabase Admin API (Service Role Key). Pensado para desarrollo y demo,
 * NUNCA para producción.
 *
 * Uso:
 *   pnpm seed
 *
 * Requiere en el entorno (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DEMO_USER_EMAIL (opcional, default admin@fleetops.demo)
 *   DEMO_USER_PASSWORD (opcional, default FleetOps2026!)
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { existsSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) config({ path: file });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "admin@fleetops.demo";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "FleetOps2026!";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan variables de entorno. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local antes de ejecutar `pnpm seed`.",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Ubicaciones reales alrededor del centro de México.
// ---------------------------------------------------------------------------
const CITIES = {
  cdmx: { name: "Ciudad de México", latitude: 19.4326, longitude: -99.1332 },
  pachuca: { name: "Pachuca de Soto", latitude: 20.1011, longitude: -98.7591 },
  tula: { name: "Tula de Allende", latitude: 20.0574, longitude: -99.3436 },
  queretaro: { name: "Santiago de Querétaro", latitude: 20.5888, longitude: -100.3899 },
  puebla: { name: "Puebla de Zaragoza", latitude: 19.0414, longitude: -98.2063 },
  toluca: { name: "Toluca de Lerdo", latitude: 19.2826, longitude: -99.6557 },
} as const;

async function main() {
  console.log("→ Creando organización demo…");

  // 1) Usuario demo (owner)
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  let ownerId = existingUsers.users.find((u) => u.email === DEMO_EMAIL)?.id;

  if (!ownerId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Administrador Demo" },
    });
    if (error || !created.user) throw new Error(`No se pudo crear el usuario demo: ${error?.message}`);
    ownerId = created.user.id;
    console.log(`  Usuario creado: ${DEMO_EMAIL}`);
  } else {
    console.log(`  Usuario demo ya existe: ${DEMO_EMAIL}`);
  }

  await admin.from("profiles").upsert({ id: ownerId, full_name: "Administrador Demo" });

  // 2) Organización
  const slug = "transportes-horizonte";
  const { data: existingOrg } = await admin.from("organizations").select("id").eq("slug", slug).maybeSingle();

  let organizationId = existingOrg?.id as string | undefined;
  if (!organizationId) {
    const { data: org, error } = await admin
      .from("organizations")
      .insert({
        name: "Transportes Horizonte",
        slug,
        country: "MX",
        timezone: "America/Mexico_City",
        created_by: ownerId,
      })
      .select("id")
      .single();
    if (error || !org) throw new Error(`No se pudo crear la organización: ${error?.message}`);
    organizationId = org.id;
    console.log("  Organización creada: Transportes Horizonte");
  } else {
    console.log("  Organización ya existe: Transportes Horizonte");
  }

  await admin
    .from("organization_members")
    .upsert(
      { organization_id: organizationId, user_id: ownerId, role: "owner", status: "active" },
      { onConflict: "organization_id,user_id" },
    );

  await admin
    .from("organization_settings")
    .upsert({ organization_id: organizationId }, { onConflict: "organization_id" });

  // 3) Conductores
  console.log("→ Creando conductores…");
  const driversSeed = [
    { full_name: "Carlos Mendoza Ruiz", phone: "55 1122 3344", license_type: "Federal tipo E", status: "assigned" as const, daysToExpire: 400 },
    { full_name: "Laura Jiménez Torres", phone: "55 2233 4455", license_type: "Federal tipo E", status: "assigned" as const, daysToExpire: 20 },
    { full_name: "Roberto Sánchez Gómez", phone: "55 3344 5566", license_type: "Federal tipo D", status: "available" as const, daysToExpire: 200 },
    { full_name: "Miguel Ángel Herrera", phone: "55 4455 6677", license_type: "Federal tipo E", status: "off_duty" as const, daysToExpire: 500 },
    { full_name: "Fernando Castillo Vega", phone: "55 5566 7788", license_type: "Federal tipo D", status: "suspended" as const, daysToExpire: -10 },
  ];

  const driverIds: string[] = [];
  for (const d of driversSeed) {
    const licenseExpiration = new Date(Date.now() + d.daysToExpire * 86_400_000).toISOString().slice(0, 10);
    const { data: existing } = await admin
      .from("drivers")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("full_name", d.full_name)
      .maybeSingle();

    if (existing) {
      driverIds.push(existing.id);
      continue;
    }

    const { data: driver, error } = await admin
      .from("drivers")
      .insert({
        organization_id: organizationId,
        full_name: d.full_name,
        phone: d.phone,
        license_number: `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
        license_type: d.license_type,
        license_expiration: licenseExpiration,
        status: d.status,
      })
      .select("id")
      .single();
    if (error || !driver) throw new Error(`No se pudo crear conductor: ${error?.message}`);
    driverIds.push(driver.id);
  }
  console.log(`  ${driverIds.length} conductores listos.`);

  // 4) Camiones
  console.log("→ Creando unidades…");
  const trucksSeed = [
    { unit: "TRK-001", plate: "MX-0001-A", status: "active" as const, city: CITIES.cdmx, driver: 0 },
    { unit: "TRK-002", plate: "MX-0002-B", status: "active" as const, city: CITIES.pachuca, driver: 1 },
    { unit: "TRK-003", plate: "MX-0003-C", status: "idle" as const, city: CITIES.puebla, driver: null },
    { unit: "TRK-004", plate: "MX-0004-D", status: "maintenance" as const, city: CITIES.queretaro, driver: null },
    { unit: "TRK-005", plate: "MX-0005-E", status: "active" as const, city: CITIES.toluca, driver: 2 },
    { unit: "TRK-006", plate: "MX-0006-F", status: "offline" as const, city: CITIES.tula, driver: null },
    { unit: "TRK-007", plate: "MX-0007-G", status: "idle" as const, city: CITIES.cdmx, driver: null },
    { unit: "TRK-008", plate: "MX-0008-H", status: "active" as const, city: CITIES.pachuca, driver: null },
  ];

  const truckIds: Record<string, string> = {};
  for (const t of trucksSeed) {
    const { data: existing } = await admin
      .from("trucks")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("unit_number", t.unit)
      .maybeSingle();

    if (existing) {
      truckIds[t.unit] = existing.id;
      continue;
    }

    const driverId = t.driver != null ? driverIds[t.driver] : null;
    const { data: truck, error } = await admin
      .from("trucks")
      .insert({
        organization_id: organizationId,
        name: `Unidad ${t.unit}`,
        unit_number: t.unit,
        plate: t.plate,
        brand: "Kenworth",
        model: "T680",
        year: 2022,
        vehicle_type: "Tractocamión",
        capacity_kg: 25000,
        fuel_type: "Diésel",
        fuel_capacity_liters: 400,
        current_fuel_pct: 40 + Math.round(Math.random() * 55),
        odometer_km: 80000 + Math.round(Math.random() * 120000),
        status: t.status,
        active_driver_id: driverId,
        last_latitude: t.status === "offline" ? null : t.city.latitude,
        last_longitude: t.status === "offline" ? null : t.city.longitude,
        last_speed_kmh: t.status === "active" ? 40 + Math.round(Math.random() * 50) : 0,
        last_heading: Math.round(Math.random() * 359),
        last_location_at: t.status === "offline" ? null : new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !truck) throw new Error(`No se pudo crear unidad ${t.unit}: ${error?.message}`);
    truckIds[t.unit] = truck.id;

    if (driverId) {
      await admin.from("drivers").update({ status: "assigned" }).eq("id", driverId);
    }
  }
  console.log(`  ${Object.keys(truckIds).length} unidades listas.`);

  // 5) Rutas
  console.log("→ Creando rutas…");
  const now = Date.now();
  const routesSeed = [
    {
      name: "CDMX a Pachuca",
      origin: CITIES.cdmx,
      destination: CITIES.pachuca,
      truck: "TRK-001",
      driver: driverIds[0],
      status: "in_progress" as const,
      startOffsetH: -2,
      endOffsetH: 1,
      progress: 55,
    },
    {
      name: "Pachuca a Tula",
      origin: CITIES.pachuca,
      destination: CITIES.tula,
      truck: "TRK-002",
      driver: driverIds[1],
      status: "scheduled" as const,
      startOffsetH: 3,
      endOffsetH: 6,
      progress: 0,
    },
    {
      name: "CDMX a Puebla",
      origin: CITIES.cdmx,
      destination: CITIES.puebla,
      truck: "TRK-005",
      driver: driverIds[2],
      status: "in_progress" as const,
      startOffsetH: -1,
      endOffsetH: 2,
      progress: 30,
    },
    {
      name: "Querétaro a CDMX",
      origin: CITIES.queretaro,
      destination: CITIES.cdmx,
      truck: null,
      driver: null,
      status: "draft" as const,
      startOffsetH: 24,
      endOffsetH: 30,
      progress: 0,
    },
    {
      name: "Toluca a CDMX",
      origin: CITIES.toluca,
      destination: CITIES.cdmx,
      truck: "TRK-008",
      driver: null,
      status: "completed" as const,
      startOffsetH: -30,
      endOffsetH: -27,
      progress: 100,
    },
  ];

  for (const r of routesSeed) {
    const { data: existing } = await admin
      .from("routes")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("name", r.name)
      .maybeSingle();
    if (existing) continue;

    const scheduledStart = new Date(now + r.startOffsetH * 3_600_000).toISOString();
    const scheduledEnd = new Date(now + r.endOffsetH * 3_600_000).toISOString();

    await admin.from("routes").insert({
      organization_id: organizationId,
      name: r.name,
      origin_name: r.origin.name,
      origin_latitude: r.origin.latitude,
      origin_longitude: r.origin.longitude,
      destination_name: r.destination.name,
      destination_latitude: r.destination.latitude,
      destination_longitude: r.destination.longitude,
      truck_id: r.truck ? truckIds[r.truck] : null,
      driver_id: r.driver ?? null,
      status: r.status,
      priority: "normal",
      scheduled_start_at: scheduledStart,
      scheduled_end_at: scheduledEnd,
      actual_start_at: r.status === "in_progress" || r.status === "completed" ? scheduledStart : null,
      actual_end_at: r.status === "completed" ? scheduledEnd : null,
      progress_pct: r.progress,
      created_by: ownerId,
    });
  }
  console.log(`  ${routesSeed.length} rutas listas.`);

  // 6) Alertas
  console.log("→ Creando alertas…");
  const alertsSeed = [
    {
      truck: "TRK-001",
      type: "speeding" as const,
      severity: "warning" as const,
      title: "Exceso de velocidad",
      description: "Velocidad de 105 km/h supera el límite de 90 km/h.",
    },
    {
      truck: "TRK-005",
      type: "low_fuel" as const,
      severity: "critical" as const,
      title: "Combustible bajo",
      description: "Nivel de combustible en 8%.",
    },
    {
      truck: "TRK-002",
      type: "delay" as const,
      severity: "warning" as const,
      title: "Retraso en ruta",
      description: "La ruta lleva 25 minutos de retraso.",
    },
    {
      truck: "TRK-006",
      type: "gps_offline" as const,
      severity: "warning" as const,
      title: "GPS desconectado",
      description: "Sin telemetría desde hace 45 minutos.",
    },
    {
      truck: "TRK-004",
      type: "maintenance_due" as const,
      severity: "critical" as const,
      title: "Mantenimiento vencido",
      description: "El servicio programado venció hace 3 días.",
    },
  ];

  for (const a of alertsSeed) {
    const truckId = truckIds[a.truck];
    if (!truckId) continue;
    const { data: existing } = await admin
      .from("alerts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("truck_id", truckId)
      .eq("type", a.type)
      .eq("status", "open")
      .maybeSingle();
    if (existing) continue;

    await admin.from("alerts").insert({
      organization_id: organizationId,
      truck_id: truckId,
      type: a.type,
      severity: a.severity,
      title: a.title,
      description: a.description,
      status: "open",
    });
  }
  console.log(`  ${alertsSeed.length} alertas listas.`);

  // 7) Mantenimiento para TRK-004 (en mantenimiento activo)
  console.log("→ Creando registro de mantenimiento…");
  const maintenanceTruckId = truckIds["TRK-004"];
  if (maintenanceTruckId) {
    const { data: existing } = await admin
      .from("maintenance_records")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("truck_id", maintenanceTruckId)
      .maybeSingle();
    if (!existing) {
      await admin.from("maintenance_records").insert({
        organization_id: organizationId,
        truck_id: maintenanceTruckId,
        type: "corrective",
        description: "Revisión de sistema de frenos",
        status: "in_progress",
        scheduled_at: new Date(now - 2 * 86_400_000).toISOString(),
        provider: "Taller Central Querétaro",
        cost: 8500,
      });
    }
  }

  console.log("\n✔ Seed completado.");
  console.log(`  Organización: Transportes Horizonte (${organizationId})`);
  console.log(`  Credenciales demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error("✘ Error durante el seed:", err);
  process.exit(1);
});
