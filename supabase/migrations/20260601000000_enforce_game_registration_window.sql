-- Enforce the daily game registration window in the database so users cannot
-- bypass it by changing browser state or calling the RPC directly.

create or replace function public.is_game_registration_window_open(p_date date)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_date = (now() at time zone 'Asia/Manila')::date
    and (now() at time zone 'Asia/Manila')::time >= time '12:00'
    and (now() at time zone 'Asia/Manila')::time < time '19:30';
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

  if not public.is_game_registration_window_open(p_date) then
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

revoke execute on function public.register_for_game(date) from public, anon;
grant execute on function public.register_for_game(date) to authenticated;
revoke execute on function public.is_game_registration_window_open(date) from public, anon;

notify pgrst, 'reload schema';
