-- ============================================================================
-- FleetOps · Trigger de alta de usuario y publicación Realtime
-- Migración 0003
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Crear perfil automáticamente al registrar un usuario en auth.users.
-- La organización y la membresía se crean desde la aplicación (Server Action)
-- porque requieren el nombre de la empresa.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Publicación Realtime para las tablas que la aplicación observa.
-- El filtrado por organización se hace en el cliente + RLS.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.trucks;
alter publication supabase_realtime add table public.truck_locations;
alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.routes;
alter publication supabase_realtime add table public.drivers;

-- Necesario para recibir el registro completo en updates/deletes.
alter table public.trucks replica identity full;
alter table public.alerts replica identity full;
alter table public.routes replica identity full;
