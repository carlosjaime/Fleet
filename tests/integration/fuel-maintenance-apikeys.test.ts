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
import { generateApiKey } from "@/lib/auth/api-keys";

const ready = isIntegrationEnvReady();
const describeIf = ready ? describe : describe.skip;

describeIf("Registro de combustible", () => {
  const admin = createAdminTestClient();
  let owner: TestUser;
  let organizationId: string;
  let truckId: string;

  beforeAll(async () => {
    owner = await createTestUser(admin, "fuel-owner");
    const org = await createTestOrganization(admin, owner.id);
    organizationId = org.id;
    const { data: truck } = await admin
      .from("trucks")
      .insert({ organization_id: organizationId, name: "Unidad Fuel", unit_number: "FUEL-001", plate: "FUEL-001" })
      .select("id")
      .single();
    truckId = truck!.id;
  });

  afterAll(async () => {
    await cleanupOrganization(admin, organizationId);
    await deleteTestUser(admin, owner.id);
  });

  it("registra una carga de combustible con costo calculado", async () => {
    const liters = 100;
    const pricePerLiter = 24.5;
    const { data, error } = await owner.client
      .from("fuel_logs")
      .insert({
        organization_id: organizationId,
        truck_id: truckId,
        liters,
        price_per_liter: pricePerLiter,
        total_cost: liters * pricePerLiter,
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data?.total_cost).toBe(2450);
  });

  it("rechaza litros negativos por restricción CHECK", async () => {
    const { error } = await owner.client
      .from("fuel_logs")
      .insert({ organization_id: organizationId, truck_id: truckId, liters: -5, price_per_liter: 20, total_cost: -100 });
    expect(error).not.toBeNull();
  });
});

describeIf("Registro de mantenimiento", () => {
  const admin = createAdminTestClient();
  let owner: TestUser;
  let organizationId: string;
  let truckId: string;

  beforeAll(async () => {
    owner = await createTestUser(admin, "maint-owner");
    const org = await createTestOrganization(admin, owner.id);
    organizationId = org.id;
    const { data: truck } = await admin
      .from("trucks")
      .insert({ organization_id: organizationId, name: "Unidad Maint", unit_number: "MAINT-001", plate: "MAINT-001" })
      .select("id")
      .single();
    truckId = truck!.id;
  });

  afterAll(async () => {
    await cleanupOrganization(admin, organizationId);
    await deleteTestUser(admin, owner.id);
  });

  it("crea y completa un registro de mantenimiento", async () => {
    const { data, error } = await owner.client
      .from("maintenance_records")
      .insert({ organization_id: organizationId, truck_id: truckId, type: "preventive", status: "scheduled" })
      .select("id")
      .single();
    expect(error).toBeNull();

    const { error: completeError } = await owner.client
      .from("maintenance_records")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data!.id);
    expect(completeError).toBeNull();
  });
});

describeIf("Creación y revocación de API keys de dispositivos", () => {
  const admin = createAdminTestClient();
  let owner: TestUser;
  let organizationId: string;

  beforeAll(async () => {
    owner = await createTestUser(admin, "apikey-owner");
    const org = await createTestOrganization(admin, owner.id);
    organizationId = org.id;
  });

  afterAll(async () => {
    await cleanupOrganization(admin, organizationId);
    await deleteTestUser(admin, owner.id);
  });

  it("crea una API key almacenando solo el hash", async () => {
    const generated = await generateApiKey();
    const { data, error } = await owner.client
      .from("device_api_keys")
      .insert({
        organization_id: organizationId,
        name: "Dispositivo de prueba",
        key_prefix: generated.keyPrefix,
        key_hash: generated.keyHash,
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data?.key_hash).toBe(generated.keyHash);
    expect(data?.status).toBe("active");
  });

  it("revoca la API key", async () => {
    const { data: key } = await owner.client
      .from("device_api_keys")
      .select("id")
      .eq("organization_id", organizationId)
      .single();

    const { error } = await owner.client
      .from("device_api_keys")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", key!.id);

    expect(error).toBeNull();

    const { data: revoked } = await owner.client.from("device_api_keys").select("status").eq("id", key!.id).single();
    expect(revoked?.status).toBe("revoked");
  });
});
