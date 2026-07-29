/**
 * Máquina de estados de rutas. Pura y probada.
 * Valida las transiciones permitidas y qué timestamps deben registrarse.
 */
import type { RouteStatus } from "@/types/domain";

export type RouteAction =
  | "schedule"
  | "start"
  | "pause"
  | "resume"
  | "complete"
  | "cancel";

const TRANSITIONS: Record<RouteStatus, Partial<Record<RouteAction, RouteStatus>>> = {
  draft: { schedule: "scheduled", cancel: "cancelled" },
  scheduled: { start: "in_progress", cancel: "cancelled" },
  in_progress: { pause: "paused", complete: "completed", cancel: "cancelled" },
  paused: { resume: "in_progress", complete: "completed", cancel: "cancelled" },
  completed: {},
  cancelled: {},
};

export const ACTION_LABELS: Record<RouteAction, string> = {
  schedule: "Programar",
  start: "Iniciar",
  pause: "Pausar",
  resume: "Reanudar",
  complete: "Completar",
  cancel: "Cancelar",
};

/** ¿La acción es válida desde el estado actual? */
export function canTransition(from: RouteStatus, action: RouteAction): boolean {
  return TRANSITIONS[from][action] !== undefined;
}

/** Estado resultante o null si la transición no es válida. */
export function nextStatus(from: RouteStatus, action: RouteAction): RouteStatus | null {
  return TRANSITIONS[from][action] ?? null;
}

/** Acciones disponibles desde un estado dado. */
export function availableActions(from: RouteStatus): RouteAction[] {
  return Object.keys(TRANSITIONS[from]) as RouteAction[];
}

export class InvalidRouteTransitionError extends Error {
  constructor(from: RouteStatus, action: RouteAction) {
    super(`Transición inválida: no se puede "${ACTION_LABELS[action]}" una ruta en estado "${from}".`);
    this.name = "InvalidRouteTransitionError";
  }
}

export interface TransitionEffect {
  status: RouteStatus;
  /** Campos a actualizar además del estado. */
  patch: {
    actual_start_at?: string;
    actual_end_at?: string;
    progress_pct?: number;
  };
}

/**
 * Aplica una transición devolviendo el nuevo estado y los timestamps que
 * deben persistirse. Lanza si la transición no es válida.
 */
export function applyTransition(
  from: RouteStatus,
  action: RouteAction,
  now: Date = new Date(),
): TransitionEffect {
  const to = nextStatus(from, action);
  if (!to) throw new InvalidRouteTransitionError(from, action);

  const patch: TransitionEffect["patch"] = {};
  if (action === "start" && from === "scheduled") {
    patch.actual_start_at = now.toISOString();
  }
  if (action === "complete") {
    patch.actual_end_at = now.toISOString();
    patch.progress_pct = 100;
  }
  return { status: to, patch };
}
