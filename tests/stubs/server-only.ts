/**
 * Stub de la librería `server-only` para pruebas con Vitest.
 *
 * `server-only` normalmente lanza un error si su módulo se resuelve fuera
 * del bundling de servidor de Next.js (protección en build time). Bajo
 * Vitest no hay bundler de Next.js, así que se sustituye por un módulo
 * vacío para poder probar servicios de servidor de forma aislada.
 */
export {};
