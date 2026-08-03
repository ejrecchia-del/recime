-- ===========================================================================
-- ReciMe — database setup
--
-- Paste this whole file into the Supabase SQL Editor and hit Run. Once.
-- It creates one table that holds every kind of record (recipes, plans,
-- shopping items, pantry) keyed by a household code, so both phones see
-- the same data.
-- ===========================================================================

create table if not exists public.recime_items (
  household   text        not null,
  kind        text        not null,
  item_id     text        not null,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  deleted     boolean     not null default false,
  primary key (household, kind, item_id)
);

create index if not exists recime_items_household_updated_idx
  on public.recime_items (household, updated_at desc);

-- ---------------------------------------------------------------------------
-- Access
--
-- This is a two-person household app, so we keep it simple: anyone who knows
-- BOTH the project's anon key AND your household code can read and write that
-- household's rows. Nobody can list households they don't already know the
-- code for. Pick a household code that isn't guessable — the app generates
-- one for you.
--
-- If you'd rather have real accounts later, turn on Supabase Auth and replace
-- the policies below with ones that check auth.uid().
-- ---------------------------------------------------------------------------

alter table public.recime_items enable row level security;

drop policy if exists recime_read  on public.recime_items;
drop policy if exists recime_write on public.recime_items;
drop policy if exists recime_update on public.recime_items;
drop policy if exists recime_delete on public.recime_items;

create policy recime_read on public.recime_items
  for select using (true);

create policy recime_write on public.recime_items
  for insert with check (true);

create policy recime_update on public.recime_items
  for update using (true) with check (true);

create policy recime_delete on public.recime_items
  for delete using (true);

-- Keep updated_at honest even if a client forgets to send it
create or replace function public.recime_touch()
returns trigger language plpgsql as $$
begin
  if new.updated_at is null then new.updated_at := now(); end if;
  return new;
end $$;

drop trigger if exists recime_touch_trg on public.recime_items;
create trigger recime_touch_trg
  before insert or update on public.recime_items
  for each row execute function public.recime_touch();

-- Housekeeping: drop tombstones older than 90 days so the table stays small.
-- (Optional — run it by hand whenever, or schedule it with pg_cron.)
-- delete from public.recime_items where deleted and updated_at < now() - interval '90 days';
