-- Preserve the effective player capacity for materialized game days so
-- historical calendar denominators do not drift when the default changes.

alter table public.game_days
  add column if not exists capacity_snapshot integer;

alter table public.game_days
  drop constraint if exists game_days_capacity_snapshot_check;

alter table public.game_days
  add constraint game_days_capacity_snapshot_check
  check (capacity_snapshot is null or (capacity_snapshot between 1 and 72));

update public.game_days
set capacity_snapshot = coalesce(capacity_override, 24)
where capacity_snapshot is null
  and date < current_date;

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
          select game_days.capacity_snapshot
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

  insert into public.game_days (date, is_cancelled, capacity_snapshot)
  values (p_date, false, public.effective_game_capacity(p_date))
  on conflict (date) do update
    set capacity_snapshot = coalesce(
      public.game_days.capacity_snapshot,
      excluded.capacity_snapshot
    );

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
