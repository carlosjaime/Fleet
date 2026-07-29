/**
 * Tipos de la base de datos de Supabase.
 *
 * En un flujo con Supabase local se regeneran con:
 *   pnpm db:types   (supabase gen types typescript --local)
 *
 * Se mantiene versionado a mano para que el proyecto compile sin una
 * instancia de Supabase en ejecución. Debe mantenerse alineado con las
 * migraciones en `supabase/migrations`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// --- Enumeraciones de dominio (deben coincidir con los CHECK / ENUM en SQL) ---
export type OrgRole = "owner" | "admin" | "dispatcher" | "operator" | "viewer";
export type MemberStatus = "active" | "invited" | "suspended";
export type TruckStatus = "active" | "idle" | "offline" | "maintenance";
export type DriverStatus = "available" | "assigned" | "off_duty" | "suspended";
export type RouteStatus =
  | "draft"
  | "scheduled"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";
export type RoutePriority = "low" | "normal" | "high" | "urgent";
export type WaypointStatus = "pending" | "arrived" | "departed" | "skipped";
export type AlertType =
  | "speeding"
  | "route_deviation"
  | "low_fuel"
  | "delay"
  | "gps_offline"
  | "maintenance_due"
  | "unauthorized_stop";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "open" | "acknowledged" | "resolved";
export type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "overdue";
export type MaintenanceType = "preventive" | "corrective" | "inspection";
export type ApiKeyStatus = "active" | "revoked";
export type TelemetrySource = "device" | "simulator" | "manual";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
        } & Timestamps;
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          country: string;
          timezone: string;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          country?: string;
          timezone?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrgRole;
          status: MemberStatus;
        } & Timestamps;
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrgRole;
          status?: MemberStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organization_members"]["Insert"]>;
        Relationships: [];
      };
      organization_settings: {
        Row: {
          id: string;
          organization_id: string;
          speed_limit_kmh: number;
          low_fuel_threshold_pct: number;
          route_deviation_tolerance_meters: number;
          delay_tolerance_minutes: number;
          gps_offline_minutes: number;
          metric_units: boolean;
          currency: string;
          alert_preferences: Json;
          simulator_settings: Json;
        } & Timestamps;
        Insert: {
          id?: string;
          organization_id: string;
          speed_limit_kmh?: number;
          low_fuel_threshold_pct?: number;
          route_deviation_tolerance_meters?: number;
          delay_tolerance_minutes?: number;
          gps_offline_minutes?: number;
          metric_units?: boolean;
          currency?: string;
          alert_preferences?: Json;
          simulator_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organization_settings"]["Insert"]>;
        Relationships: [];
      };
      trucks: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          unit_number: string;
          plate: string;
          vin: string | null;
          brand: string | null;
          model: string | null;
          year: number | null;
          color: string | null;
          vehicle_type: string | null;
          capacity_kg: number | null;
          fuel_type: string | null;
          fuel_capacity_liters: number | null;
          current_fuel_pct: number | null;
          odometer_km: number;
          status: TruckStatus;
          active_driver_id: string | null;
          last_latitude: number | null;
          last_longitude: number | null;
          last_speed_kmh: number | null;
          last_heading: number | null;
          last_location_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          unit_number: string;
          plate: string;
          vin?: string | null;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          color?: string | null;
          vehicle_type?: string | null;
          capacity_kg?: number | null;
          fuel_type?: string | null;
          fuel_capacity_liters?: number | null;
          current_fuel_pct?: number | null;
          odometer_km?: number;
          status?: TruckStatus;
          active_driver_id?: string | null;
          last_latitude?: number | null;
          last_longitude?: number | null;
          last_speed_kmh?: number | null;
          last_heading?: number | null;
          last_location_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trucks"]["Insert"]>;
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          license_number: string | null;
          license_type: string | null;
          license_expiration: string | null;
          status: DriverStatus;
          photo_url: string | null;
          emergency_contact: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          organization_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          license_number?: string | null;
          license_type?: string | null;
          license_expiration?: string | null;
          status?: DriverStatus;
          photo_url?: string | null;
          emergency_contact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["drivers"]["Insert"]>;
        Relationships: [];
      };
      routes: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          reference: string | null;
          origin_name: string;
          origin_latitude: number;
          origin_longitude: number;
          destination_name: string;
          destination_latitude: number;
          destination_longitude: number;
          truck_id: string | null;
          driver_id: string | null;
          status: RouteStatus;
          priority: RoutePriority;
          scheduled_start_at: string | null;
          scheduled_end_at: string | null;
          actual_start_at: string | null;
          actual_end_at: string | null;
          estimated_distance_km: number | null;
          actual_distance_km: number | null;
          estimated_duration_minutes: number | null;
          progress_pct: number;
          notes: string | null;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          reference?: string | null;
          origin_name: string;
          origin_latitude: number;
          origin_longitude: number;
          destination_name: string;
          destination_latitude: number;
          destination_longitude: number;
          truck_id?: string | null;
          driver_id?: string | null;
          status?: RouteStatus;
          priority?: RoutePriority;
          scheduled_start_at?: string | null;
          scheduled_end_at?: string | null;
          actual_start_at?: string | null;
          actual_end_at?: string | null;
          estimated_distance_km?: number | null;
          actual_distance_km?: number | null;
          estimated_duration_minutes?: number | null;
          progress_pct?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["routes"]["Insert"]>;
        Relationships: [];
      };
      route_waypoints: {
        Row: {
          id: string;
          route_id: string;
          organization_id: string;
          sequence: number;
          name: string;
          latitude: number;
          longitude: number;
          status: WaypointStatus;
          arrived_at: string | null;
          departed_at: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          route_id: string;
          organization_id: string;
          sequence: number;
          name: string;
          latitude: number;
          longitude: number;
          status?: WaypointStatus;
          arrived_at?: string | null;
          departed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["route_waypoints"]["Insert"]>;
        Relationships: [];
      };
      truck_locations: {
        Row: {
          id: string;
          organization_id: string;
          truck_id: string;
          route_id: string | null;
          latitude: number;
          longitude: number;
          speed_kmh: number | null;
          heading: number | null;
          fuel_pct: number | null;
          odometer_km: number | null;
          accuracy_meters: number | null;
          recorded_at: string;
          source: TelemetrySource;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          truck_id: string;
          route_id?: string | null;
          latitude: number;
          longitude: number;
          speed_kmh?: number | null;
          heading?: number | null;
          fuel_pct?: number | null;
          odometer_km?: number | null;
          accuracy_meters?: number | null;
          recorded_at?: string;
          source?: TelemetrySource;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["truck_locations"]["Insert"]>;
        Relationships: [];
      };
      telemetry_events: {
        Row: {
          id: string;
          organization_id: string;
          truck_id: string;
          route_id: string | null;
          event_type: string;
          severity: AlertSeverity;
          value: number | null;
          payload: Json;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          truck_id: string;
          route_id?: string | null;
          event_type: string;
          severity?: AlertSeverity;
          value?: number | null;
          payload?: Json;
          recorded_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["telemetry_events"]["Insert"]>;
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          organization_id: string;
          truck_id: string | null;
          driver_id: string | null;
          route_id: string | null;
          type: AlertType;
          severity: AlertSeverity;
          title: string;
          description: string | null;
          latitude: number | null;
          longitude: number | null;
          status: AlertStatus;
          detected_at: string;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          resolution_notes: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          organization_id: string;
          truck_id?: string | null;
          driver_id?: string | null;
          route_id?: string | null;
          type: AlertType;
          severity?: AlertSeverity;
          title: string;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          status?: AlertStatus;
          detected_at?: string;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
        Relationships: [];
      };
      maintenance_records: {
        Row: {
          id: string;
          organization_id: string;
          truck_id: string;
          type: MaintenanceType;
          description: string | null;
          status: MaintenanceStatus;
          scheduled_at: string | null;
          completed_at: string | null;
          odometer_at_service: number | null;
          next_service_odometer: number | null;
          next_service_date: string | null;
          cost: number | null;
          provider: string | null;
          notes: string | null;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          organization_id: string;
          truck_id: string;
          type?: MaintenanceType;
          description?: string | null;
          status?: MaintenanceStatus;
          scheduled_at?: string | null;
          completed_at?: string | null;
          odometer_at_service?: number | null;
          next_service_odometer?: number | null;
          next_service_date?: string | null;
          cost?: number | null;
          provider?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["maintenance_records"]["Insert"]>;
        Relationships: [];
      };
      fuel_logs: {
        Row: {
          id: string;
          organization_id: string;
          truck_id: string;
          driver_id: string | null;
          liters: number;
          price_per_liter: number;
          total_cost: number;
          odometer_km: number | null;
          fuel_station: string | null;
          latitude: number | null;
          longitude: number | null;
          receipt_url: string | null;
          recorded_at: string;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          organization_id: string;
          truck_id: string;
          driver_id?: string | null;
          liters: number;
          price_per_liter: number;
          total_cost: number;
          odometer_km?: number | null;
          fuel_station?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          receipt_url?: string | null;
          recorded_at?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fuel_logs"]["Insert"]>;
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
        Relationships: [];
      };
      device_api_keys: {
        Row: {
          id: string;
          organization_id: string;
          truck_id: string | null;
          name: string;
          key_prefix: string;
          key_hash: string;
          status: ApiKeyStatus;
          last_used_at: string | null;
          expires_at: string | null;
          created_by: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          truck_id?: string | null;
          name: string;
          key_prefix: string;
          key_hash: string;
          status?: ApiKeyStatus;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["device_api_keys"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_organization_member: {
        Args: { organization_uuid: string };
        Returns: boolean;
      };
      has_organization_role: {
        Args: { organization_uuid: string; allowed_roles: string[] };
        Returns: boolean;
      };
      current_user_organization_role: {
        Args: { organization_uuid: string };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// --- Helpers de acceso a tipos de tabla ---
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
