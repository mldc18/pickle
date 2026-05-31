-- Materialize historical registration/no-show dates that predate game_days rows,
-- then freeze their original default capacity for calendar history.

insert into public.game_days (date, is_cancelled, capacity_snapshot)
select historical_dates.game_date, false, 24
from (
  select distinct game_registrations.game_date
  from public.game_registrations
  where game_registrations.game_date < current_date

  union

  select distinct game_no_shows.game_date
  from public.game_no_shows
  where game_no_shows.game_date < current_date
) as historical_dates
left join public.game_days
  on game_days.date = historical_dates.game_date
where game_days.date is null;

update public.game_days
set capacity_snapshot = coalesce(capacity_snapshot, capacity_override, 24)
where date < current_date
  and capacity_snapshot is null;
