"use client";

import { useEffect, useState } from "react";

/** Reloj con la zona horaria de la organización. */
export function OrgClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <span className="telemetry text-xs text-muted">--:--:--</span>;

  const time = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: timezone,
  }).format(now);
  const date = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    timeZone: timezone,
  }).format(now);

  return (
    <div className="hidden text-right lg:block" title={timezone}>
      <p className="telemetry text-sm font-medium leading-none">{time}</p>
      <p className="text-xs capitalize text-muted">{date}</p>
    </div>
  );
}
