/**
 * Shim para un defecto de empaquetado en react-leaflet@5.0.0 /
 * @react-leaflet/core@3.0.0: los .d.ts publicados de react-leaflet importan
 * un subpath profundo ("@react-leaflet/core/lib/context") que el "exports"
 * map del paquete no expone, rompiendo la resolución de tipos aunque el
 * código en tiempo de ejecución nunca usa ese subpath (sólo usa el barrel
 * "@react-leaflet/core"). Este shim declara el módulo con la forma real de
 * `ControlledLayer` (ver @react-leaflet/core/lib/context.d.ts) para que
 * `tsc` pueda resolverlo sin desactivar skipLibCheck.
 */
declare module "@react-leaflet/core/lib/context" {
  import type { Layer } from "leaflet";

  export type ControlledLayer = {
    addLayer(layer: Layer): void;
    removeLayer(layer: Layer): void;
  };
}
