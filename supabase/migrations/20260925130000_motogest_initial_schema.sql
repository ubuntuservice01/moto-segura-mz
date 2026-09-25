-- MotoGest initial production schema
-- Multi-tenant motorcycle registration and municipal management.
-- Supabase/PostgreSQL

create extension if not exists pgcrypto;

create type public.app_role as enum (
  'super_admin',
  'admin_municipal',
  'tecnico',
  'fiscal',
  'financeiro'
);

create type public.motorcycle_status as enum (
  'activa',
  'roubada',
  'a_venda',
  'apreendida'
);

create type public.document_type as enum (
  'bi',
  'passaporte',
  'dire',
  'outro'
);

create type public.motorcycle_document_type as enum (
  'livrete',
  'declaracao_venda',
  'comprovativo_propriedade',
  'documento_identificacao',
  'outro'
);

create table public.municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  province text,
  district text,
  address text,
  phone text,
  email text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint municipalities_code_format check (code ~ '^[A-Z0-9]{2,10}$')
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  municipality_id uuid references public.municipalities(id) on delete restrict,
  full_name text not null,
  phone text,
  role public.app_role not null default 'tecnico',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_tenant_requirement check (
    role = 'super_admin' or municipality_id is not null
  )
);

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  full_name text not null,
  document_type public.document_type,
  document_number text,
  phone text,
  alternative_phone text,
  address text,
  neighborhood text,
  locality text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owners_document_unique unique (municipality_id, document_type, document_number)
);

create table public.registration_sequences (
  municipality_id uuid primary key references public.municipalities(id) on delete cascade,
  prefix text not null,
  last_number bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint registration_sequences_prefix_format check (prefix ~ '^[A-Z0-9]{2,10}$'),
  constraint registration_sequences_last_number_nonnegative check (last_number >= 0)
);

create table public.motorcycles (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  owner_id uuid not null references public.owners(id) on delete restrict,
  registration_number text not null,
  qr_token uuid not null default gen_random_uuid(),
  chassis_number text not null,
  engine_number text,
  make text not null,
  model text not null,
  color text,
  year smallint,
  engine_capacity_cc integer,
  category text,
  status public.motorcycle_status not null default 'activa',
  registration_date date not null default current_date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint motorcycles_registration_unique unique (municipality_id, registration_number),
  constraint motorcycles_qr_token_unique unique (qr_token),
  constraint motorcycles_chassis_unique unique (municipality_id, chassis_number),
  constraint motorcycles_year_valid check (year is null or year between 1900 and 2100),
  constraint motorcycles_engine_capacity_valid check (
    engine_capacity_cc is null or engine_capacity_cc > 0
  )
);

create table public.ownership_transfers (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  motorcycle_id uuid not null references public.motorcycles(id) on delete restrict,
  from_owner_id uuid references public.owners(id) on delete restrict,
  to_owner_id uuid not null references public.owners(id) on delete restrict,
  transfer_date date not null default current_date,
  reason text,
  document_reference text,
  processed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.motorcycle_status_history (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  previous_status public.motorcycle_status,
  new_status public.motorcycle_status not null,
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  motorcycle_id uuid references public.motorcycles(id) on delete cascade,
  owner_id uuid references public.owners(id) on delete cascade,
  document_type public.motorcycle_document_type not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint documents_target_check check (
    motorcycle_id is not null or owner_id is not null
  )
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  municipality_id uuid references public.municipalities(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_municipality_idx on public.profiles(municipality_id);
create index owners_municipality_idx on public.owners(municipality_id);
create index owners_document_number_idx on public.owners(municipality_id, document_number);
create index motorcycles_municipality_idx on public.motorcycles(municipality_id);
create index motorcycles_owner_idx on public.motorcycles(owner_id);
create index motorcycles_status_idx on public.motorcycles(municipality_id, status);
create index motorcycles_qr_token_idx on public.motorcycles(qr_token);
create index motorcycles_chassis_idx on public.motorcycles(municipality_id, chassis_number);
create index transfers_municipality_idx on public.ownership_transfers(municipality_id);
create index transfers_motorcycle_idx on public.ownership_transfers(motorcycle_id);
create index status_history_motorcycle_idx on public.motorcycle_status_history(motorcycle_id, created_at desc);
create index documents_municipality_idx on public.documents(municipality_id);
create index documents_motorcycle_idx on public.documents(motorcycle_id);
create index documents_owner_idx on public.documents(owner_id);
create index audit_logs_municipality_idx on public.audit_logs(municipality_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger municipalities_set_updated_at
before update on public.municipalities
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger owners_set_updated_at
before update on public.owners
for each row execute function public.set_updated_at();

create trigger registration_sequences_set_updated_at
before update on public.registration_sequences
for each row execute function public.set_updated_at();

create trigger motorcycles_set_updated_at
before update on public.motorcycles
for each row execute function public.set_updated_at();

create or replace function public.current_user_municipality_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select municipality_id
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'super_admin', false);
$$;

create or replace function public.next_registration_number(p_municipality_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
  v_number bigint;
begin
  if not (public.is_super_admin()
      or (select public.current_user_municipality_id()) = p_municipality_id) then
    raise exception 'Not authorized for municipality';
  end if;

  insert into public.registration_sequences (municipality_id, prefix, last_number)
  select m.id, m.code, 0
  from public.municipalities m
  where m.id = p_municipality_id
  on conflict (municipality_id) do nothing;

  update public.registration_sequences
  set last_number = last_number + 1
  where municipality_id = p_municipality_id
  returning prefix, last_number into v_prefix, v_number;

  if v_number is null then
    raise exception 'Municipality not found';
  end if;

  return v_prefix || '-' || lpad(v_number::text, 6, '0');
end;
$$;

create or replace function public.get_motorcycle_public_info(p_qr_token uuid)
returns table (
  registration_number text,
  status public.motorcycle_status,
  municipality_name text,
  make text,
  model text,
  color text,
  registration_date date
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.registration_number,
    m.status,
    mu.name,
    m.make,
    m.model,
    m.color,
    m.registration_date
  from public.motorcycles m
  join public.municipalities mu on mu.id = m.municipality_id
  where m.qr_token = p_qr_token
    and mu.is_active = true;
$$;

revoke all on function public.next_registration_number(uuid) from public, anon, authenticated;
grant execute on function public.next_registration_number(uuid) to authenticated;

revoke all on function public.get_motorcycle_public_info(uuid) from public;
grant execute on function public.get_motorcycle_public_info(uuid) to anon, authenticated;

alter table public.municipalities enable row level security;
alter table public.profiles enable row level security;
alter table public.owners enable row level security;
alter table public.registration_sequences enable row level security;
alter table public.motorcycles enable row level security;
alter table public.ownership_transfers enable row level security;
alter table public.motorcycle_status_history enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table public.municipalities, public.profiles, public.owners,
  public.registration_sequences, public.motorcycles, public.ownership_transfers,
  public.motorcycle_status_history, public.documents, public.audit_logs
from anon, authenticated;

grant select, insert, update, delete on public.municipalities to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.owners to authenticated;
grant select on public.registration_sequences to authenticated;
grant select, insert, update, delete on public.motorcycles to authenticated;
grant select, insert, update, delete on public.ownership_transfers to authenticated;
grant select, insert on public.motorcycle_status_history to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert on public.audit_logs to authenticated;

create policy municipalities_select
on public.municipalities for select to authenticated
using (
  public.is_super_admin()
  or id = (select public.current_user_municipality_id())
);

create policy municipalities_update
on public.municipalities for update to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy municipalities_insert
on public.municipalities for insert to authenticated
with check (public.is_super_admin());

create policy municipalities_delete
on public.municipalities for delete to authenticated
using (public.is_super_admin());

create policy profiles_select
on public.profiles for select to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
  or id = (select auth.uid())
);

create policy profiles_insert
on public.profiles for insert to authenticated
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy profiles_update
on public.profiles for update to authenticated
using (
  public.is_super_admin()
  or id = (select auth.uid())
  or municipality_id = (select public.current_user_municipality_id())
)
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy profiles_delete
on public.profiles for delete to authenticated
using (public.is_super_admin());

create policy owners_select
on public.owners for select to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy owners_insert
on public.owners for insert to authenticated
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy owners_update
on public.owners for update to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
)
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy owners_delete
on public.owners for delete to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy registration_sequences_select
on public.registration_sequences for select to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy motorcycles_select
on public.motorcycles for select to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy motorcycles_insert
on public.motorcycles for insert to authenticated
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy motorcycles_update
on public.motorcycles for update to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
)
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy motorcycles_delete
on public.motorcycles for delete to authenticated
using (public.is_super_admin());

create policy transfers_select
on public.ownership_transfers for select to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy transfers_insert
on public.ownership_transfers for insert to authenticated
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy transfers_update
on public.ownership_transfers for update to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
)
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy transfers_delete
on public.ownership_transfers for delete to authenticated
using (public.is_super_admin());

create policy status_history_select
on public.motorcycle_status_history for select to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy status_history_insert
on public.motorcycle_status_history for insert to authenticated
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy documents_select
on public.documents for select to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy documents_insert
on public.documents for insert to authenticated
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy documents_update
on public.documents for update to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
)
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy documents_delete
on public.documents for delete to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy audit_logs_select
on public.audit_logs for select to authenticated
using (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

create policy audit_logs_insert
on public.audit_logs for insert to authenticated
with check (
  public.is_super_admin()
  or municipality_id = (select public.current_user_municipality_id())
);

comment on table public.municipalities is 'Tenants do MotoGest, normalmente municípios.';
comment on table public.profiles is 'Perfis de utilizadores associados ao Supabase Auth e ao tenant.';
comment on table public.motorcycles is 'Registo principal das motorizadas.';
comment on column public.motorcycles.qr_token is 'Identificador público do QR Code; não contém dados pessoais.';
comment on function public.get_motorcycle_public_info(uuid) is 'Consulta pública mínima através do QR Code, sem dados pessoais.';
