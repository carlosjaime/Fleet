"use client";

import { useQuery } from "@tanstack/react-query";
import { useTrucksRealtime, trucksQueryKey } from "@/hooks/use-trucks-realtime";
import { useAlertsRealtime, alertsQueryKey } from "@/hooks/use-alerts-realtime";
import { useTruckLocationsRealtime } from "@/hooks/use-truck-locations-realtime";
import { useOrg } from "@/components/providers/org-provider";
import { FleetMapPanel } from "@/components/maps/fleet-map-panel";
import { AlertsPanel, type DashboardAlert } from "@/components/dashboard/alerts-panel";
import { FleetStatusList, type FleetSnapshotItem } from "@/components/dashboard/fleet-status-list";
import type { MapRoutePath, MapUnit } from "@/components/maps/fleet-map";
import type { Truck, Alert } from "@/types/domain";

interface AlertRow extends Alert {
  truck: { unit_number: string } | null;
}

export function DashboardLive({
  initialTrucks,
  initialAlerts,
  routeTracks,
}: {
  initialTrucks: FleetSnapshotItem[];
  initialAlerts: DashboardAlert[];
  routeTracks: MapRoutePath[];
}) {
  const { organizationId } = useOrg();

  // Sembramos la caché de TanStack Query con los datos del servidor y
  // dejamos que los hooks de Realtime la mantengan sincronizada.
  const { data: trucks } = useQuery<Truck[]>({
    queryKey: trucksQueryKey(organizationId),
    queryFn: () => Promise.resolve(initialTrucks as unknown as Truck[]),
    initialData: initialTrucks as unknown as Truck[],
    staleTime: Infinity,
  });

  const { data: alerts } = useQuery<AlertRow[]>({
    queryKey: alertsQueryKey(organizationId),
    queryFn: () => Promise.resolve(initialAlerts as unknown as AlertRow[]),
    initialData: initialAlerts as unknown as AlertRow[],
    staleTime: Infinity,
  });

  useTrucksRealtime(organizationId);
  useAlertsRealtime(organizationId);
  useTruckLocationsRealtime(organizationId);

  const driverByTruckId = new Map(initialTrucks.map((t) => [t.id, t.driver]));

  const mapUnits: MapUnit[] = (trucks ?? [])
    .filter((t) => t.last_latitude != null && t.last_longitude != null)
    .map((t) => ({
      id: t.id,
      name: t.name,
      unitNumber: t.unit_number,
      latitude: t.last_latitude!,
      longitude: t.last_longitude!,
      heading: t.last_heading ?? 0,
      speedKmh: t.last_speed_kmh ?? 0,
      fuelPct: t.current_fuel_pct ?? 0,
      status: t.status,
    }));

  const fleetRows: FleetSnapshotItem[] = (trucks ?? []).map((t) => ({
    id: t.id,
    unit_number: t.unit_number,
    name: t.name,
    status: t.status,
    last_speed_kmh: t.last_speed_kmh,
    current_fuel_pct: t.current_fuel_pct,
    last_location_at: t.last_location_at,
    driver: driverByTruckId.get(t.id) ?? null,
  }));

  const alertRows: DashboardAlert[] = (alerts ?? [])
    .filter((a) => a.status === "open")
    .map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      detected_at: a.detected_at,
      truck: a.truck,
    }));

  return (
    <div className="space-y-6">
      <FleetMapPanel liveUnits={mapUnits} routes={routeTracks} />
      <div className="grid gap-4 lg:grid-cols-2">
        <AlertsPanel alerts={alertRows} />
        <FleetStatusList trucks={fleetRows} />
      </div>
    </div>
  );
}
