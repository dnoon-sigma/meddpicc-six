-- Calls the app's live-sync endpoint every 5 minutes. The endpoint itself decides whether any
-- NFL game is live and skips otherwise. The bearer token is read from Vault (secret name: cron_secret),
-- create it first: select vault.create_secret('<CRON_SECRET>', 'cron_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('live-sync') where exists (select 1 from cron.job where jobname = 'live-sync');

select cron.schedule(
  'live-sync',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := 'https://meddpicc-six.vercel.app/api/sync?mode=live',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    timeout_milliseconds := 55000
  );
  $$
);
