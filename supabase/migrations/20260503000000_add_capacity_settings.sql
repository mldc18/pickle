-- Adds admin-managed player capacity with a default value and per-date overrides.

alter table public.game_days
  add column if not exists capacity_override integer;

alter table public.game_days
  drop constraint if exists game_days_capacity_override_check;

alter table public.game_days
  add constraint game_days_capacity_override_check
  check (capacity_override is null or (capacity_override between 1 and 72));

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.app_settings enable row level security;

insert into public.app_settings (key, value)
values ('default_game_capacity', '24'::jsonb)
on conflict (key) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_settings'
      and policyname = 'Authenticated users can read app settings'
  ) then
    create policy "Authenticated users can read app settings"
      on public.app_settings
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_settings'
      and policyname = 'Admins can manage app settings'
  ) then
    create policy "Admins can manage app settings"
      on public.app_settings
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.users
          where users.id = auth.uid()
            and users.role in ('admin', 'super_admin')
        )
      )
      with check (
        exists (
          select 1
          from public.users
          where users.id = auth.uid()
            and users.role in ('admin', 'super_admin')
        )
      );
  end if;
end $$;

create or replace function public.effective_game_capacity(p_date date)
returns integer
language sql
stable
set search_path = public
as $$
  select greatest(
    1,
    least(
      72,
      coalesce(
        (
          select game_days.capacity_override
          from public.game_days
          where game_days.date = p_date
        ),
        (
          select nullif(app_settings.value #>> '{}', '')::integer
          from public.app_settings
          where app_settings.key = 'default_game_capacity'
        ),
        24
      )
    )
  );
$$;

create or replace function public.rebalance_game_registrations(p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_registered_count integer;
  v_open_slots integer;
begin
  if not exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role in ('admin', 'super_admin')
  ) then
    raise exception 'Only admins can rebalance game registrations.'
      using errcode = '42501';
  end if;

  v_capacity := public.effective_game_capacity(p_date);

  select count(*)
  into v_registered_count
  from public.game_registrations
  where game_registrations.game_date = p_date
    and game_registrations.status = 'registered';

  v_open_slots := greatest(0, v_capacity - v_registered_count);

  if v_open_slots = 0 then
    return;
  end if;

  update public.game_registrations
  set status = 'registered'
  where game_registrations.game_date = p_date
    and game_registrations.user_id in (
    select queued.user_id
    from public.game_registrations queued
    where queued.game_date = p_date
      and queued.status = 'waitlist'
    order by queued.position asc, queued.registered_at asc
    limit v_open_slots
  );
end;
$$;

create or replace function public.register_for_game(p_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_capacity integer;
  v_registered_count integer;
  v_next_position integer;
  v_status text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return 'closed';
  end if;

  if exists (
    select 1
    from public.game_days
    where game_days.date = p_date
      and game_days.is_cancelled = true
  ) then
    return 'blocked';
  end if;

  if not exists (
    select 1
    from public.monthly_payments
    where monthly_payments.user_id = v_user_id
      and monthly_payments.month = date_trunc('month', p_date)::date
      and monthly_payments.paid = true
  ) then
    return 'unpaid';
  end if;

  select game_registrations.status
  into v_status
  from public.game_registrations
  where game_registrations.game_date = p_date
    and game_registrations.user_id = v_user_id
    and game_registrations.status in ('registered', 'waitlist')
  limit 1;

  if v_status is not null then
    return v_status;
  end if;

  insert into public.game_days (date, is_cancelled)
  values (p_date, false)
  on conflict (date) do nothing;

  v_capacity := public.effective_game_capacity(p_date);

  select count(*)
  into v_registered_count
  from public.game_registrations
  where game_registrations.game_date = p_date
    and game_registrations.status = 'registered';

  select coalesce(max(game_registrations.position), 0) + 1
  into v_next_position
  from public.game_registrations
  where game_registrations.game_date = p_date;

  v_status := case
    when v_registered_count < v_capacity then 'registered'
    else 'waitlist'
  end;

  insert into public.game_registrations (
    game_date,
    user_id,
    status,
    position
  )
  values (
    p_date,
    v_user_id,
    v_status,
    v_next_position
  );

  return v_status;
end;
$$;
