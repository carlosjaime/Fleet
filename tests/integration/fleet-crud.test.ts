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

const ready = isIntegrationEnvReady();
const describeIf = ready ? describe : describe.skip;

describeIf("CRUD de unidades (trucks)", () => {
  const admin = createAdminTestClient();
  let owner: TestUser;
  let organizationId: string;
  let truckId: string;

  beforeAll(async () => {
    owner = await createTestUser(admin, "fleet-owner");
    const org = await createTestOrganization(admin, owner.id);
    organizationId = org.id;
  });

  afterAll(async () => {
    await cleanupOrganization(admin, organizationId);
    await deleteTestUser(admin, owner.id);
  });

  it("crea una unidad", async () => {
    const { data, error } = await owner.client
      .from("trucks")
      .insert({ organization_id: organizationId, name: "Unidad 1", unit_number: "T-001", plate: "ABC-123" })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
    truckId = data!.id;
  });

  it("rechaza placa duplicada dentro de la misma organización", async () => {
    const { error } = await owner.client
      .from("trucks")
      .insert({ organization_id: organizationId, name: "Unidad duplicada", unit_number: "T-002", plate: "ABC-123" });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
  });

  it("rechaza número de unidad duplicado", async () => {
    const { error } = await owner.client
      .from("trucks")
      .insert({ organization_id: organizationId, name: "Otra unidad", unit_number: "T-001", plate: "XYZ-999" });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
  });

  it("actualiza una unidad", async () => {
    const { error } = await owner.client.from("trucks").update({ status: "active" }).eq("id", truckId);
    expect(error).toBeNull();

    const { data } = await owner.client.from("trucks").select("status").eq("id", truckId).single();
    expect(data?.status).toBe("active");
  });

  it("lee la unidad creada", async () => {
    const { data, error } = await owner.client.from("trucks").select("*").eq("id", truckId).single();
    expect(error).toBeNull();
    expect(data?.unit_number).toBe("T-001");
  });

  it("elimina la unidad", async () => {
    const { error } = await owner.client.from("trucks").delete().eq("id", truckId);
    expect(error).toBeNull();

    const { data } = await owner.client.from("trucks").select("id").eq("id", truckId).maybeSingle();
    expect(data).toBeNull();
  });
});

describeIf("CRUD de conductores (drivers)", () => {
  const admin = createAdminTestClient();
  let owner: TestUser;
  let organizationId: string;
  let driverId: string;

  beforeAll(async () => {
    owner = await createTestUser(admin, "drivers-owner");
    const org = await createTestOrganization(admin, owner.id);
    organizationId = org.id;
  });

  afterAll(async () => {
    await cleanupOrganization(admin, organizationId);
    await deleteTestUser(admin, owner.id);
  });

  it("crea un conductor", async () => {
    const { data, error } = await owner.client
      .from("drivers")
      .insert({ organization_id: organizationId, full_name: "Conductor de prueba" })
      .select("id")
      .single();
    expect(error).toBeNull();
    driverId = data!.id;
  });

  it("actualiza el estado del conductor", async () => {
    const { error } = await owner.client.from("drivers").update({ status: "suspended" }).eq("id", driverId);
    expect(error).toBeNull();
  });

  it("elimina el conductor", async () => {
    const { error } = await owner.client.from("drivers").delete().eq("id", driverId);
    expect(error).toBeNull();
  });
});

describeIf("CRUD de rutas (routes) y restricciones de unidad activa", () => {
  const admin = createAdminTestClient();
  let owner: TestUser;
  let organizationId: string;
  let truckId: string;
  let routeId: string;

  beforeAll(async () => {
    owner = await createTestUser(admin, "routes-owner");
    const org = await createTestOrganization(admin, owner.id);
    organizationId = org.id;

    const { data: truck } = await admin
      .from("trucks")
      .insert({ organization_id: organizationId, name: "Unidad ruta", unit_number: "R-001", plate: "RUT-001" })
      .select("id")
      .single();
    truckId = truck!.id;
  });

  afterAll(async () => {
    await cleanupOrganization(admin, organizationId);
    await deleteTestUser(admin, owner.id);
  });

  it("crea una ruta", async () => {
    const { data, error } = await owner.client
      .from("routes")
      .insert({
        organization_id: organizationId,
        name: "Ruta de prueba",
        origin_name: "A",
        origin_latitude: 19,
        origin_longitude: -99,
        destination_name: "B",
        destination_latitude: 20,
        destination_longitude: -99,
        truck_id: truckId,
        status: "in_progress",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    routeId = data!.id;
  });

  it("impide que la misma unidad tenga dos rutas activas simultáneas", async () => {
    const { error } = await owner.client.from("routes").insert({
      organization_id: organizationId,
      name: "Segunda ruta activa",
      origin_name: "C",
      origin_latitude: 19,
      origin_longitude: -98,
      destination_name: "D",
      destination_latitude: 20,
      destination_longitude: -98,
      truck_id: truckId,
      status: "in_progress",
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
  });

  it("completa la ruta", async () => {
    const { error } = await owner.client
      .from("routes")
      .update({ status: "completed", progress_pct: 100, actual_end_at: new Date().toISOString() })
      .eq("id", routeId);
    expect(error).toBeNull();
  });
});
