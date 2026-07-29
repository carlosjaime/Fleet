import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  isIntegrationEnvReady,
  createAdminTestClient,
  createTestUser,
  createTestOrganization,
  cleanupOrganization,
  deleteTestUser,
  type TestUser,
} from "./helpers";
import { ingestTelemetry } from "@/lib/services/telemetry-ingest";

// Nota: acknowledgeAlert/resolveAlert (Server Actions) envuelven exactamente
// las mismas actualizaciones probadas aquí, más la verificación de permisos
// ya cubierta en tests/unit/permissions.test.ts. No se invocan directamente
// porque dependen de next/headers (cookies()), que solo existe en una
// request real de Next.js.

const ready = isIntegrationEnvReady();
const describeIf = ready ? describe : describe.skip;

describeIf("Ingestión de telemetría y motor de alertas", () => {
  const admin = createAdminTestClient();
  let owner: TestUser;
  let organizationId: string;
  let truckId: string;

  beforeAll(async () => {
    owner = await createTestUser(admin, "telemetry-owner");
    const org = await createTestOrganization(admin, owner.id);
    organizationId = org.id;

    const { data: truck } = await admin
      .from("trucks")
      .insert({ organization_id: organizationId, name: "Unidad Telemetría", unit_number: "TEL-001", plate: "TEL-001" })
      .select("id")
      .single();
    truckId = truck!.id;
  });

  afterAll(async () => {
    await cleanupOrganization(admin, organizationId);
    await deleteTestUser(admin, owner.id);
  });

  it("inserta una ubicación y actualiza la posición del camión", async () => {
    const result = await ingestTelemetry(organizationId, null, {
      unitNumber: "TEL-001",
      latitude: 19.4326,
      longitude: -99.1332,
      speedKmh: 60,
      heading: 90,
      fuelPct: 70,
      odometerKm: 1000,
    });

    expect(result.truckId).toBe(truckId);
    expect(result.locationId).toBeDefined();

    const { data: truck } = await admin.from("trucks").select("last_latitude, current_fuel_pct").eq("id", truckId).single();
    expect(truck?.last_latitude).toBeCloseTo(19.4326, 3);
    expect(truck?.current_fuel_pct).toBe(70);
  });

  it("crea una alerta de exceso de velocidad cuando supera el límite configurado", async () => {
    const result = await ingestTelemetry(organizationId, null, {
      unitNumber: "TEL-001",
      latitude: 19.43,
      longitude: -99.13,
      speedKmh: 130,
      heading: 90,
      fuelPct: 65,
      odometerKm: 1010,
    });

    expect(result.alertsCreated).toBeGreaterThan(0);

    const { data: alerts } = await admin
      .from("alerts")
      .select("type, status")
      .eq("organization_id", organizationId)
      .eq("truck_id", truckId)
      .eq("type", "speeding");

    expect(alerts?.some((a) => a.status === "open")).toBe(true);
  });

  it("no duplica alertas abiertas del mismo tipo para la misma unidad", async () => {
    await ingestTelemetry(organizationId, null, {
      unitNumber: "TEL-001",
      latitude: 19.43,
      longitude: -99.13,
      speedKmh: 135,
      heading: 90,
      fuelPct: 64,
      odometerKm: 1015,
    });

    const { data: alerts } = await admin
      .from("alerts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("truck_id", truckId)
      .eq("type", "speeding")
      .eq("status", "open");

    expect(alerts?.length).toBe(1);
  });

  it("permite reconocer y resolver la alerta creada", async () => {
    const { data: alert } = await admin
      .from("alerts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("truck_id", truckId)
      .eq("type", "speeding")
      .eq("status", "open")
      .single();

    const { error: ackError } = await owner.client
      .from("alerts")
      .update({ status: "acknowledged", acknowledged_by: owner.id, acknowledged_at: new Date().toISOString() })
      .eq("id", alert!.id);
    expect(ackError).toBeNull();

    const { error: resolveError } = await owner.client
      .from("alerts")
      .update({ status: "resolved", resolved_by: owner.id, resolved_at: new Date().toISOString() })
      .eq("id", alert!.id);
    expect(resolveError).toBeNull();

    const { data: finalAlert } = await admin.from("alerts").select("status").eq("id", alert!.id).single();
    expect(finalAlert?.status).toBe("resolved");
  });
});
