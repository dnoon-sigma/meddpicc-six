-- League data for the ESPN fantasy app. Written by the sync job (service role), read by the site (anon).

create table if not exists teams (
  season int not null,
  id int not null,
  name text not null,
  abbrev text,
  owner text,
  logo text,
  primary key (season, id)
);

create table if not exists players (
  id bigint primary key,
  name text not null,
  position text,
  pro_team int
);

create table if not exists matchups (
  season int not null,
  week int not null,
  home_team int not null,
  away_team int not null,
  home_score numeric not null default 0,
  away_score numeric not null default 0,
  winner text not null default 'UNDECIDED',
  final boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (season, week, home_team)
);

-- One row per player on a team's roster for a given week (starters, bench and IR).
-- slot_id: 0 QB, 2 RB, 4 WR, 6 TE, 16 D/ST, 17 K, 23 FLEX, 20 bench, 21 IR
create table if not exists lineup_entries (
  season int not null,
  week int not null,
  team_id int not null,
  player_id bigint not null,
  slot_id int not null,
  is_starter boolean not null,
  points numeric not null default 0,
  projected numeric,
  updated_at timestamptz not null default now(),
  primary key (season, week, team_id, player_id)
);

create index if not exists lineup_entries_week_idx on lineup_entries (season, week);

create table if not exists sync_runs (
  id bigint generated always as identity primary key,
  kind text not null,
  season int,
  week int,
  status text not null,
  message text,
  created_at timestamptz not null default now()
);

-- Public read-only access. The sync job uses the service role, which bypasses RLS.
alter table teams enable row level security;
alter table players enable row level security;
alter table matchups enable row level security;
alter table lineup_entries enable row level security;
alter table sync_runs enable row level security;

create policy "public read" on teams for select using (true);
create policy "public read" on players for select using (true);
create policy "public read" on matchups for select using (true);
create policy "public read" on lineup_entries for select using (true);
create policy "public read" on sync_runs for select using (true);
