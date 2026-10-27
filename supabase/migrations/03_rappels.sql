-- ═══════════════════════════════════════════════════════════════════════════
-- Kairos — planification des rappels (a executer APRES avoir deploye la
-- fonction « rappels », voir docs/SUPABASE.md etape 6).
--
-- Remplace les deux valeurs entre chevrons avant d'executer :
--   <PROJECT_URL>  ex. https://abcdefgh.supabase.co
--   <CRON_SECRET>  la meme valeur que le secret CRON_SECRET de la fonction
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Les valeurs sensibles vont dans le coffre (Vault), pas en clair dans le job.
select vault.create_secret('<PROJECT_URL>', 'kairos_project_url');
select vault.create_secret('<CRON_SECRET>', 'kairos_cron_secret');

-- Chaque minute : les rappels tombent a l'heure exacte du rendez-vous.
select cron.schedule(
  'kairos-rappels',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'kairos_project_url') || '/functions/v1/rappels',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'kairos_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);

-- Menage : on ne garde que 14 jours d'historique d'envois.
select cron.schedule('kairos-menage', '17 3 * * *', $$ delete from public.push_log where day < current_date - 14 $$);
