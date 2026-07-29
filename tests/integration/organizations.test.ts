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

describeIf("Organizaciones, perfiles y membresías", () => {
  const admin = createAdminTestClient();
  let owner: TestUser;
  let organizationId: string;

  beforeAll(async () => {
    owner = await createTestUser(admin, "org-owner");
  });

  afterAll(async () => {
    if (organizationId) await cleanupOrganization(admin, organizationId);
    if (owner) await deleteTestUser(admin, owner.id);
  });

  it("crea un perfil automáticamente al registrar el usuario (trigger on_auth_user_created)", async () => {
    const { data, error } = await admin.from("profiles").select("id").eq("id", owner.id).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(owner.id);
  });

  it("crea una organización y la membresía owner", async () => {
    const org = await createTestOrganization(admin, owner.id);
    organizationId = org.id;

    const { data: membership } = await admin
      .from("organization_members")
      .select("role, status")
      .eq("organization_id", organizationId)
      .eq("user_id", owner.id)
      .single();

    expect(membership?.role).toBe("owner");
    expect(membership?.status).toBe("active");
  });

  it("crea la configuración predeterminada de la organización", async () => {
    const { data: settings } = await admin
      .from("organization_settings")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    expect(settings?.speed_limit_kmh).toBe(90);
    expect(settings?.low_fuel_threshold_pct).toBe(20);
    expect(settings?.currency).toBe("MXN");
  });

  it("impide membresías duplicadas para la misma organización y usuario", async () => {
    const { error } = await admin
      .from("organization_members")
      .insert({ organization_id: organizationId, user_id: owner.id, role: "admin", status: "active" });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
  });

  it("el usuario puede leer su propia organización usando el cliente anon autenticado", async () => {
    const { data, error } = await owner.client.from("organizations").select("id").eq("id", organizationId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.id).toBe(organizationId);
  });
});
