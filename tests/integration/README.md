# Pruebas de integración

Estas pruebas ejercitan Supabase real (RLS, restricciones, triggers) y por
lo tanto requieren una instancia de Supabase accesible. No usan mocks: la
autorización multiempresa se prueba mejor contra Postgres real.

## Cómo ejecutarlas

1. Levanta Supabase local (requiere Docker):
   ```bash
   npx supabase start
   ```
2. Copia las credenciales que imprime `supabase start` a `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`).
3. Aplica las migraciones (ya se aplican automáticamente al iniciar):
   ```bash
   npx supabase db reset
   ```
4. Ejecuta las pruebas:
   ```bash
   pnpm test:integration
   ```

## Nota sobre este entorno

Estas pruebas se escribieron y están listas para ejecutarse, pero **no se
ejecutaron en la sesión que generó este proyecto** porque el entorno
sandbox bloquea las descargas de imágenes de Docker Hub (política de
proxy saliente, `403` en `production.cloudfront.docker.com`), lo cual
impide levantar Supabase local con Docker. Esto es una restricción del
entorno de desarrollo, no un problema del código. Ejecuta estas pruebas en
tu máquina local o en CI con acceso a Docker Hub para verificarlas.
