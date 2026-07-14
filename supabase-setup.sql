-- Ejecutar una sola vez en Supabase: Dashboard > SQL Editor > pegar y "Run".

create table if not exists solicitudes (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  nombre text not null,
  telefono text not null,
  email text default '',
  zona text default '',
  cuando text default '',
  vehiculo_id text not null,
  vehiculo text not null,
  ambientes text not null
);

create index if not exists solicitudes_ts_idx on solicitudes (ts desc);

-- RLS activado sin policies: bloquea el acceso directo con la clave "anon".
-- El backend usa la "service_role" key, que ignora RLS, así que sigue funcionando.
alter table solicitudes enable row level security;
