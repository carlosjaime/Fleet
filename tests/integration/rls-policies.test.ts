import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  isIntegrationEnvReady,
  createAdminTestClient,
  createTestUser,
  createTestOrganization,
  addMember,
  cleanupOrganization,
  deleteTestUser,
  type TestUser,
} from "./helpers";

const ready = isIntegrationEnvReady();
const describeIf = ready ? describe : describe.skip;

/**
 * Pruebas críticas de Row Level Security: garantizan que el aislamiento
 * multiempresa y la matriz de roles se cumplen en Postgres, no solo en la
 * capa de aplicación.
 */
describeIf("Row Level Security", () => {
  const admin = createAdminTestClient();

  let ownerA: TestUser;
  let orgAId: string;
  let ownerB: TestUser;
  let orgBId: string;
  let viewer: TestUser;
  let operator: TestUser;
  let dispatcher: TestUser;

  beforeAll(async () => {
    ownerA = await createTestUser(admin, "rls-owner-a");
    const orgA = await createTestOrganization(admin, ownerA.id, "Org A");
    orgAId = orgA.id;

    ownerB = await createTestUser(admin, "rls-owner-b");
    const orgB = await createTestOrganization(admin, ownerB.id, "Org B");
    orgBId = orgB.id;

    viewer = await createTestUser(admin, "rls-viewer");
    await addMember(admin, orgAId, viewer.id, "viewer");

    operator = await createTestUser(admin, "rls-operator");
    await addMember(admin, orgAId, operator.id, "operator");

    dispatcher = await createTestUser(admin, "rls-dispatcher");
    await addMember(admin, orgAId, dispatcher.id, "dispatcher");
  });

  afterAll(async () => {
    await cleanupOrganization(admin, orgAId);
    await cleanupOrganization(admin, orgBId);
    for (const u of [ownerA, ownerB, viewer, operator, dispatcher]) {
      if (u) await deleteTestUser(admin, u.id);
    }
  });

  it("un usuario no puede leer organizaciones ajenas", async () => {
    const { data, error } = await ownerA.client.from("organizations").select("id").eq("id", orgBId).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull(); // RLS filtra la fila silenciosamente
  });

  it("un usuario no puede leer camiones de otra organización", async () => {
    const { data: truck } = await admin
      .from("trucks")
      .insert({ organization_id: orgBId, name: "Unidad B", unit_number: "B-1", plate: "B-PLATE" })
      .select("id")
      .single();

    const { data, error } = await ownerA.client.from("trucks").select("id").eq("id", truck!.id).maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("un viewer no puede crear unidades", async () => {
    const { error } = await viewer.client
      .from("trucks")
      .insert({ organization_id: orgAId, name: "Intento viewer", unit_number: "V-1", plate: "V-PLATE" });

    expect(error).not.toBeNull();
  });

  it("un viewer no puede modificar ni eliminar rutas", async () => {
    const { data: route } = await admin
      .from("routes")
      .insert({
        organization_id: orgAId,
        name: "Ruta viewer",
        origin_name: "A",
        origin_latitude: 19,
        origin_longitude: -99,
        destination_name: "B",
        destination_latitude: 20,
        destination_longitude: -99,
      })
      .select("id")
      .single();

    const { error: updateError } = await viewer.client
      .from("routes")
      .update({ name: "Modificado" })
      .eq("id", route!.id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await viewer.client.from("routes").delete().eq("id", route!.id);
    expect(deleteError).not.toBeNull();
  });

  it("un operator puede reconocer alertas pero no cambiar roles de miembros", async () => {
    const { data: alert } = await admin
      .from("alerts")
      .insert({ organization_id: orgAId, type: "low_fuel", title: "Prueba", status: "open" })
      .select("id")
      .single();

    const { error: ackError } = await operator.client
      .from("alerts")
      .update({ status: "acknowledged", acknowledged_by: operator.id, acknowledged_at: new Date().toISOString() })
      .eq("id", alert!.id);
    expect(ackError).toBeNull();

    const { error: roleError } = await operator.client
      .from("organization_members")
      .update({ role: "admin" })
      .eq("organization_id", orgAId)
      .eq("user_id", viewer.id);
    expect(roleError).not.toBeNull();
  });

  it("un dispatcher puede gestionar rutas", async () => {
    const { error } = await dispatcher.client.from("routes").insert({
      organization_id: orgAId,
      name: "Ruta dispatcher",
      origin_name: "A",
      origin_latitude: 19,
      origin_longitude: -99,
      destination_name: "B",
      destination_latitude: 20,
      destination_longitude: -99,
    });
    expect(error).toBeNull();
  });

  it("un owner puede administrar miembros de su organización", async () => {
    const { error } = await ownerA.client
      .from("organization_members")
      .update({ role: "dispatcher" })
      .eq("organization_id", orgAId)
      .eq("user_id", viewer.id);
    expect(error).toBeNull();
  });
});
