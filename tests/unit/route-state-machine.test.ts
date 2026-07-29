import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStatus,
  availableActions,
  applyTransition,
  InvalidRouteTransitionError,
} from "@/lib/routes/state-machine";

describe("canTransition", () => {
  it("permite draft -> scheduled", () => {
    expect(canTransition("draft", "schedule")).toBe(true);
  });
  it("permite scheduled -> in_progress", () => {
    expect(canTransition("scheduled", "start")).toBe(true);
  });
  it("no permite completar una ruta cancelada", () => {
    expect(canTransition("cancelled", "complete")).toBe(false);
  });
  it("no permite iniciar una ruta completada", () => {
    expect(canTransition("completed", "start")).toBe(false);
  });
  it("no permite pausar un borrador", () => {
    expect(canTransition("draft", "pause")).toBe(false);
  });
});

describe("nextStatus", () => {
  it("devuelve el estado resultante para una transición válida", () => {
    expect(nextStatus("in_progress", "pause")).toBe("paused");
    expect(nextStatus("paused", "resume")).toBe("in_progress");
  });
  it("devuelve null para una transición inválida", () => {
    expect(nextStatus("completed", "cancel")).toBeNull();
  });
});

describe("availableActions", () => {
  it("lista las acciones disponibles desde in_progress", () => {
    const actions = availableActions("in_progress");
    expect(actions).toContain("pause");
    expect(actions).toContain("complete");
    expect(actions).toContain("cancel");
    expect(actions).not.toContain("start");
  });
  it("no hay acciones disponibles desde un estado terminal", () => {
    expect(availableActions("completed")).toHaveLength(0);
    expect(availableActions("cancelled")).toHaveLength(0);
  });
});

describe("applyTransition", () => {
  it("registra actual_start_at al iniciar", () => {
    const now = new Date("2026-01-01T10:00:00Z");
    const result = applyTransition("scheduled", "start", now);
    expect(result.status).toBe("in_progress");
    expect(result.patch.actual_start_at).toBe(now.toISOString());
  });

  it("registra actual_end_at y progreso 100 al completar", () => {
    const now = new Date("2026-01-01T14:00:00Z");
    const result = applyTransition("in_progress", "complete", now);
    expect(result.status).toBe("completed");
    expect(result.patch.actual_end_at).toBe(now.toISOString());
    expect(result.patch.progress_pct).toBe(100);
  });

  it("no agrega timestamps para pausar", () => {
    const result = applyTransition("in_progress", "pause");
    expect(result.status).toBe("paused");
    expect(result.patch.actual_start_at).toBeUndefined();
    expect(result.patch.actual_end_at).toBeUndefined();
  });

  it("lanza InvalidRouteTransitionError para una transición inválida", () => {
    expect(() => applyTransition("completed", "start")).toThrow(InvalidRouteTransitionError);
  });
});
