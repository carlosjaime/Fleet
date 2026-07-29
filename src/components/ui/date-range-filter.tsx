"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";

export type DateRangePreset = "today" | "7d" | "30d" | "custom";

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "Hoy",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  custom: "Personalizado",
};

export function presetToRange(preset: DateRangePreset): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  if (preset === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (preset === "7d") {
    from.setDate(from.getDate() - 7);
  } else {
    from.setDate(from.getDate() - 30);
  }
  return { from, to };
}

/** Filtro de rango de fechas persistido en la URL (?range=7d). */
export function DateRangeFilter({ current }: { current: DateRangePreset }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(PRESET_LABELS) as DateRangePreset[])
          .filter((p) => p !== "custom")
          .map((p) => (
            <SelectItem key={p} value={p}>
              {PRESET_LABELS[p]}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
