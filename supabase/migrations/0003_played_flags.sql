-- Whether the player actually recorded stats that week, and whether their NFL team was on bye.
alter table lineup_entries add column if not exists played boolean;
alter table lineup_entries add column if not exists on_bye boolean;
