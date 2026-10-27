-- ═══════════════════════════════════════════════════════════════════════════
-- Kairos — schema de la base (a coller dans Supabase > SQL Editor > Run)
--
-- Chaque table porte un user_id rempli automatiquement avec auth.uid() :
-- le front n'a jamais a l'envoyer. La Row Level Security (fin du fichier)
-- garantit qu'une utilisatrice ne voit et ne modifie que ses propres lignes.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Profil et saison ────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  timezone text not null default 'Africa/Abidjan',
  wake_time time not null default '05:00',
  bed_time time not null default '22:30',
  height_cm numeric(5,1),
  start_weight numeric(5,1),
  target_weight numeric(5,1),
  weigh_day smallint not null default 6 check (weigh_day between 0 and 6),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cree le profil des l'inscription.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  intention text not null default '',
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now()
);

-- ─── Regle de vie : habitudes, pointages, journee ───────────────────────────

-- schedule = 'fixe'      : rendez-vous a heure fixe (at_time) les jours `days`
--            'quotidien' : chaque jour, a n'importe quelle heure
--            'hebdo'     : per_week_min a per_week fois par semaine, places dans les trous
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  domain text not null check (domain in ('esprit', 'service', 'corps', 'etudes')),
  kind text not null default 'libre',
  title text not null,
  schedule text not null check (schedule in ('fixe', 'quotidien', 'hebdo')),
  at_time time,
  days smallint[] not null default '{0,1,2,3,4,5,6}',  -- 0 = dimanche
  per_week smallint,
  per_week_min smallint,
  duration_min smallint not null default 20,
  full_version text not null default '',
  light_version text not null default '',
  sacred boolean not null default false,               -- jamais de mode leger
  grace_min smallint not null default 15,
  notify boolean not null default true,
  position int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  habit_id uuid not null references public.habits on delete cascade,
  day date not null,
  status text not null check (status in ('fait', 'leger', 'manque', 'repos')),  -- repos : jour dispense, ne casse pas la serie
  late_min int,                                         -- retard sur un rendez-vous fixe
  minutes int,
  note text not null default '',
  done_at timestamptz not null default now(),
  unique (habit_id, day)
);

create table public.day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null,
  sleep_hours numeric(3,1),
  energy smallint check (energy between 1 and 5),
  mood smallint check (mood between 1 and 5),
  mode text not null default 'plein' check (mode in ('plein', 'leger')),
  water smallint not null default 0,
  sugar_free boolean,
  salt_free boolean,
  word_used boolean,
  gratitude text not null default '',
  victory text not null default '',
  lesson text not null default '',
  unique (user_id, day)
);

-- Emploi du temps (cours, travail) : sert a calculer les creneaux libres.
create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  kind text not null default 'cours',
  location text not null default ''
);

-- Seances hebdo placees dans un jour et une heure precis.
create table public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  habit_id uuid not null references public.habits on delete cascade,
  day date not null,
  at_time time not null,
  unique (habit_id, day)
);

create table public.week_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_start date not null,                             -- lundi
  wins text not null default '',
  lesson text not null default '',
  focus text not null default '',
  ecaa_goal text not null default '',
  rating smallint check (rating between 1 and 5),
  unique (user_id, week_start)
);

-- ─── Esprit ──────────────────────────────────────────────────────────────────

create table public.bible_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  book text not null,
  chapters smallint not null,
  current smallint not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Journal de meditation, methode E.O.A.P.
create table public.devotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null default current_date,
  passage text not null default '',
  verse text not null default '',
  observation text not null default '',
  application text not null default '',
  prayer text not null default '',
  created_at timestamptz not null default now()
);

create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  details text not null default '',
  category text not null default 'personnel',
  status text not null default 'en_cours' check (status in ('en_cours', 'exauce')),
  answered_on date,
  testimony text not null default '',
  created_at timestamptz not null default now()
);

create table public.fasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('total', 'partiel', 'daniel', 'sec')),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  intention text not null default '',
  ended_at timestamptz,                                  -- rupture effective
  completed boolean,
  journal text not null default '',
  created_at timestamptz not null default now()
);

create table public.intercession_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  category text not null default '',
  weekday smallint check (weekday between 0 and 6),     -- null = tous les jours
  notes text not null default '',
  last_prayed_on date,
  active boolean not null default true
);

-- ─── Service : ECAA et contenu (meme pipeline) ───────────────────────────────

create table public.board_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  board text not null check (board in ('ecaa', 'contenu')),
  pillar text not null default '',
  title text not null,
  details text not null default '',
  status text not null default 'idee' check (status in ('idee', 'en_cours', 'pret', 'fait')),
  due_on date,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Volontairement sans nom ni detail sur la personne ecoutee.
create table public.listening_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null default current_date,
  kind text not null default 'individuelle' check (kind in ('individuelle', 'appel', 'groupe', 'crise')),
  minutes int not null,
  feeling smallint not null check (feeling between 1 and 5),
  debrief text not null default '',
  supervised boolean not null default false,             -- debriefe avec un referent / en intervision
  created_at timestamptz not null default now()
);

-- Parcours de formation (ECAA, art oratoire…) : le contenu est livre avec l'app,
-- la base ne garde que la progression et les notes de l'utilisatrice.
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  track text not null,
  lesson text not null,
  done boolean not null default false,
  notes text not null default '',
  practice text not null default '',                    -- ce que j'ai mis en pratique
  updated_at timestamptz not null default now(),
  unique (user_id, track, lesson)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  label text not null,
  contact text not null default '',
  note text not null default ''
);

-- ─── Corps ───────────────────────────────────────────────────────────────────

create table public.weigh_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null default current_date,
  weight_kg numeric(5,1) not null,
  waist_cm numeric(5,1),
  unique (user_id, day)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null default current_date,
  routine text not null default '',
  minutes int not null,
  effort smallint check (effort between 1 and 5),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.cravings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  at timestamptz not null default now(),
  kind text not null check (kind in ('sucre', 'sel')),
  trigger text not null default '',
  resisted boolean,
  note text not null default ''
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null default current_date,
  meal text not null check (meal in ('matin', 'midi', 'soir', 'collation')),
  quality smallint not null check (quality between 1 and 3),  -- 1 equilibre, 2 moyen, 3 ecart
  sugar boolean not null default false,
  salt boolean not null default false,
  note text not null default '',
  unique (user_id, day, meal)
);

-- ─── Etudes et passion ───────────────────────────────────────────────────────

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  color text not null default 'or',
  exam_on date,
  position int not null default 0
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  course_id uuid not null references public.courses on delete cascade,
  title text not null,
  status text not null default 'a_voir' check (status in ('a_voir', 'vu', 'revise')),
  planned_on date,
  -- Revisions espacees apres le premier passage : J+1, J+3, J+7, J+14, J+30.
  review_step smallint not null default 0,
  next_review date,
  confidence smallint check (confidence between 1 and 5),
  explanation text not null default '',               -- technique Feynman : l'expliquer simplement
  position int not null default 0
);

-- Devoirs, exposes, TD a rendre.
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  course_id uuid references public.courses on delete set null,
  title text not null,
  due_on date not null,
  est_min int not null default 60,
  priority smallint not null default 2 check (priority between 1 and 3),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  started_at timestamptz not null default now(),
  minutes int not null,
  kind text not null default 'etude',                   -- etude, anglais, contenu, lecture, ecaa
  course_id uuid references public.courses on delete set null,
  skill text,                                           -- competence travaillee en anglais
  goal text not null default '',                        -- objectif annonce avant la session
  focus smallint check (focus between 1 and 5),         -- concentration ressentie a la fin
  distractions text not null default '',                -- pensees parasites notees pendant la session
  note text not null default ''
);

-- Revision espacee (boites de Leitner) : vocabulaire, anglais, versets.
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  deck text not null check (deck in ('mots', 'english', 'versets', 'cours', 'ecaa')),
  course_id uuid references public.courses on delete cascade,     -- cartes de rappel actif d'un cours
  chapter_id uuid references public.chapters on delete cascade,
  front text not null,
  back text not null default '',
  example text not null default '',
  source text not null default '',
  box smallint not null default 1 check (box between 1 and 5),
  due_on date not null default current_date,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  author text not null default '',
  kind text not null default 'roman' check (kind in ('roman', 'document')),
  total_pages int not null default 0,
  current_page int not null default 0,
  status text not null default 'en_cours' check (status in ('a_lire', 'en_cours', 'fini')),
  started_on date,
  finished_on date,
  rating smallint check (rating between 1 and 5),
  review text not null default '',
  created_at timestamptz not null default now()
);

create table public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  book_id uuid not null references public.books on delete cascade,
  day date not null default current_date,
  pages int not null
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  book_id uuid references public.books on delete set null,
  text text not null,
  page int,
  created_at timestamptz not null default now()
);

create table public.speeches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  day date not null default current_date,
  topic text not null,
  kind text not null default 'impro',
  duration_sec int,
  audio_path text,
  clarity smallint, pace smallint, structure smallint,
  voice smallint, presence smallint, fillers smallint,   -- notes de 1 a 5
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.arguments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  topic text not null,
  thesis text not null default '',
  args text[] not null default '{}',
  objection text not null default '',
  rebuttal text not null default '',
  conclusion text not null default '',
  created_at timestamptz not null default now()
);

create table public.finance_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  position smallint not null,
  title text not null,
  questions text[] not null default '{}',
  action text not null default '',
  action_done boolean not null default false,
  notes text not null default '',
  takeaways text not null default '',
  week_start date
);

-- ─── Notifications ───────────────────────────────────────────────────────────

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Anti-doublon des rappels : seule la fonction « rappels » (service role) y ecrit.
create table public.push_log (
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  day date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, key, day)
);

-- ─── Index ───────────────────────────────────────────────────────────────────

create index on public.checkins (user_id, day);
create index on public.habits (user_id) where not archived;
create index on public.cards (user_id, deck, due_on);
create index on public.cravings (user_id, at);
create index on public.focus_sessions (user_id, started_at);
create index on public.planned_sessions (user_id, day);
create index on public.devotions (user_id, day);
create index on public.chapters (course_id);
create index on public.assignments (user_id, due_on) where not done;

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
create policy "profil personnel" on public.profiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter table public.push_log enable row level security;  -- aucune policy : service role uniquement

do $$
declare t text;
begin
  foreach t in array array[
    'seasons', 'habits', 'checkins', 'day_logs', 'schedule_blocks', 'planned_sessions',
    'week_reviews', 'bible_plans', 'devotions', 'prayer_requests', 'fasts',
    'intercession_targets', 'board_items', 'listening_logs', 'resources', 'weigh_ins',
    'workouts', 'cravings', 'meals', 'courses', 'chapters', 'focus_sessions', 'cards',
    'books', 'reading_logs', 'quotes', 'speeches', 'arguments', 'finance_weeks', 'assignments', 'lesson_progress',
    'push_subscriptions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "donnees personnelles" on public.%I for all
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- ─── Droits de l'API ────────────────────────────────────────────────────────
-- Le projet est cree avec « Automatically expose new tables » DECOCHE : rien
-- n'est expose par defaut, on ouvre explicitement.
--  - authenticated (une utilisatrice connectee) : lecture/ecriture, puis la RLS
--    filtre ligne par ligne ;
--  - anon (visiteur non connecte) : aucun acces aux tables ;
--  - service_role (la fonction « rappels ») : tout, elle contourne la RLS.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
revoke all on all tables in schema public from anon;
revoke all on public.push_log from authenticated;

-- ─── Stockage des enregistrements de prise de parole ─────────────────────────
-- Un dossier par utilisatrice : paroles/<user_id>/<fichier>.webm

insert into storage.buckets (id, name, public) values ('paroles', 'paroles', false)
on conflict (id) do nothing;

create policy "mes enregistrements" on storage.objects
  for all to authenticated
  using (bucket_id = 'paroles' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'paroles' and (storage.foldername(name))[1] = (select auth.uid())::text);
