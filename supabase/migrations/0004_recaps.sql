-- Hand-written weekly recaps, one per season/week. Body is lightweight markdown.
create table if not exists recaps (
  season int not null,
  week int not null,
  title text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (season, week)
);

alter table recaps enable row level security;
create policy "public read" on recaps for select using (true);
