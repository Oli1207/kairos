import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Check, ChevronRight, Droplet, Flame, Moon, Settings, Siren, Sparkles } from 'lucide-react';
import { useHabits, useProfile, useRows, useSeason } from '../hooks/useData';
import { useCheck } from '../hooks/useCheck';
import { useDayLog } from '../hooks/useDayLog';
import { addDays, clock, diffDays, hhmm, longDate, minutesLabel, nowMin, today, toTime, weekStart } from '../lib/dates';
import { agenda, checkState, KIND_LINK, lateness, weekProgress } from '../lib/engine';
import { Button, Card, Gauge, IconButton, Scale, SectionTitle, Sheet, Textarea } from '../components/ui';
import Soleil from '../components/Soleil';
import { PageHeader } from '../components/Layout';
import { setBadge } from '../lib/push';

export default function Today() {
  const day = today();
  const monday = weekStart(day);
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: [season] = [] } = useSeason();
  const { data: habits = [] } = useHabits();
  const { data: checkins = [] } = useRows('checkins', { key: ['week', monday], build: (q) => q.gte('day', monday).lte('day', addDays(monday, 6)) });
  const { data: planned = [] } = useRows('planned_sessions', { key: [monday], build: (q) => q.gte('day', monday).lte('day', addDays(monday, 6)) });
  const { data: blocks = [] } = useRows('schedule_blocks');
  const { data: fasts = [] } = useRows('fasts', { key: ['actifs'], build: (q) => q.is('ended_at', null).order('starts_at') });
  const { data: words = [] } = useRows('cards', { key: ['mots'], build: (q) => q.eq('deck', 'mots').order('created_at', { ascending: false }) });
  const { log, patch } = useDayLog(day);
  const check = useCheck();
  const [menu, setMenu] = useState(null);
  const [, refresh] = useState(0);

  // L'heure avance : la ligne « maintenant » et les retards se recalculent chaque minute.
  useEffect(() => {
    const t = setInterval(() => refresh((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const light = log?.mode === 'leger';
  const { timed, untimed } = useMemo(() => agenda(day, habits, planned, blocks), [day, habits, planned, blocks]);
  const todayChecks = checkins.filter((c) => c.day === day);
  const checkOf = (h) => todayChecks.find((c) => c.habit_id === h.id);
  const habitItems = [...timed, ...untimed].filter((i) => i.type === 'habit');
  const doneCount = habitItems.filter((i) => checkOf(i.habit) && checkOf(i.habit).status !== 'manque').length;
  const { data: dueChapters = [] } = useRows('chapters', { key: ['dus', day], build: (q) => q.lte('next_review', day).neq('status', 'revise') });
  const { data: urgent = [] } = useRows('assignments', { key: ['urgents', day], build: (q) => q.eq('done', false).lte('due_on', addDays(day, 2)).order('due_on') });

  // Pastille sur l'icone de l'app : ce qu'il reste a pointer aujourd'hui.
  const remaining = habitItems.length - doneCount;
  useEffect(() => { setBadge(remaining); }, [remaining]);

  const activeFast = fasts.find((f) => new Date(f.starts_at) <= new Date() && !f.ended_at);
  const weekly = habits.filter((h) => h.schedule === 'hebdo');
  const word = words.length ? words[diffDays(day, '2026-01-01') % words.length] : null;
  const seasonDay = season ? diffDays(day, season.starts_on) + 1 : null;
  const seasonLen = season ? diffDays(season.ends_on, season.starts_on) + 1 : null;

  const tap = (item) => {
    const h = item.habit;
    const c = checkOf(h);
    if (c) { setMenu(item); return; }
    const late = h.schedule === 'fixe' || item.planned ? lateness(day, item.at) : null;
    check.mutate({ habit_id: h.id, status: light && !h.sacred && h.light_version ? 'leger' : 'fait', late_min: late });
    navigator.vibrate?.(15);
  };

  const now = nowMin();
  let nowPlaced = false;

  return (
    <div>
      <PageHeader
        kicker={season && seasonDay >= 1 && seasonDay <= seasonLen ? `Jour ${seasonDay} / ${seasonLen} · ${season.title}` : season?.title}
        title={`${greeting()}${profile?.display_name ? `, ${profile.display_name}` : ''}`}
        help="jour"
        sub={longDate(day)}
        action={<IconButton icon={Settings} label="Réglages" className="md:hidden" onClick={() => navigate('/reglages')} />}
      />

      {season && seasonDay < 1 && (
        <Card className="mb-4 p-4">
          <p className="font-semibold">Ta saison commence dans {1 - seasonDay} jour{seasonDay < 0 ? 's' : ''}.</p>
          <p className="mt-1 text-sm text-muted">Profite de ces jours pour régler tes heures, saisir ton emploi du temps et placer ta première semaine.</p>
        </Card>
      )}

      {activeFast && <FastBanner fast={activeFast} />}

      {!log?.energy ? <MorningCheckin onSave={patch} /> : (
        <div className="mb-5 flex items-center gap-4">
          <Soleil value={habitItems.length ? doneCount / habitItems.length : 0} size={104} petals={24}>
            <span className="font-display text-2xl font-extrabold num">{doneCount}/{habitItems.length}</span>
          </Soleil>
          <div className="min-w-0 flex-1">
            <div className="flex gap-1.5">
              {['plein', 'leger'].map((m) => (
                <button key={m} type="button" className="chip" aria-pressed={log.mode === m} onClick={() => patch({ mode: m })}>
                  {m === 'plein' ? 'Jour plein' : 'Jour léger'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              {light
                ? 'Versions minimales affichées. Faire un peu compte : on ne casse pas la chaîne.'
                : `Énergie ${log.energy}/5${log.sleep_hours ? ` · ${String(log.sleep_hours).replace('.', ',')} h de sommeil` : ''}.`}
            </p>
            {intention(season)}
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">
      <div>
      <SectionTitle>Ton jour</SectionTitle>
      {!timed.length && <p className="mb-4 text-sm text-muted">Aucun rendez-vous à heure fixe aujourd'hui.</p>}
      <ol className="mb-6 border-l-2 border-ink">
        {timed.map((item) => {
          const marker = !nowPlaced && day === today() && item.at > now;
          if (marker) nowPlaced = true;
          return (
            <li key={item.id}>
              {marker && <NowLine />}
              {item.type === 'block'
                ? <BlockRow item={item} />
                : <HabitRow item={item} checkin={checkOf(item.habit)} light={light} onTap={() => tap(item)} />}
            </li>
          );
        })}
        {!nowPlaced && day === today() && timed.length > 0 && <li><NowLine /></li>}
      </ol>

      {untimed.length > 0 && (
        <>
          <SectionTitle>Dans la journée</SectionTitle>
          <div className="mb-6 divide-y divide-line border-y border-line">
            {untimed.map((item) => (item.habit.kind === 'sucre_sel'
              ? <SugarSaltRow key={item.id} habit={item.habit} log={log} patch={patch} checkin={checkOf(item.habit)} />
              : <HabitRow key={item.id} item={item} checkin={checkOf(item.habit)} light={light} onTap={() => tap(item)} flat />))}
          </div>
        </>
      )}

      </div>
      <aside>
      {(dueChapters.length > 0 || urgent.length > 0) && (
        <Link to="/etudes?onglet=plan" className="card card-etudes mb-4 block p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-orange">Études</p>
          {dueChapters.length > 0 && <p className="font-semibold">{dueChapters.length} rappel{dueChapters.length > 1 ? 's' : ''} actif{dueChapters.length > 1 ? 's' : ''} à faire</p>}
          {urgent.map((a) => <p key={a.id} className="text-sm">{a.title} · <span className={a.due_on <= day ? 'font-semibold text-rouge' : 'text-muted'}>{a.due_on < day ? 'en retard' : a.due_on === day ? "aujourd'hui" : 'bientôt'}</span></p>)}
          <p className="mt-1 text-sm font-semibold text-rouge">Ouvrir le tableau de bord →</p>
        </Link>
      )}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Link to="/corps?onglet=sucre&sos=1" className="ink-block flex items-center gap-3 p-4">
          <Siren className="h-6 w-6 text-[var(--jaune)]" />
          <div className="flex-1">
            <p className="font-display text-lg font-bold">SOS envie</p>
            <p className="text-sm opacity-70">Sucre ou sel : 10 minutes pour la laisser passer.</p>
          </div>
          <ChevronRight className="h-5 w-5 opacity-60" />
        </Link>
        <Water value={log?.water || 0} onChange={(water) => patch({ water })} />
      </div>

      {word && (
        <Card domain="etudes" className="mb-6 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-orange">Mot à placer aujourd'hui</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{word.front}</p>
          <p className="text-sm text-muted">{word.back}</p>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="h-5 w-5 accent-[var(--orange)]" checked={!!log?.word_used} onChange={(e) => patch({ word_used: e.target.checked })} />
            Je l'ai utilisé dans une vraie conversation
          </label>
        </Card>
      )}

      {weekly.length > 0 && (
        <Card className="mb-6 p-4">
          <SectionTitle action={<Link to="/semaine" className="text-sm font-semibold text-rouge">Placer mes séances</Link>}>Cette semaine</SectionTitle>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 lg:grid-cols-1">
            {weekly.map((h) => {
              const p = weekProgress(h, checkins, monday);
              return (
                <div key={h.id}>
                  <div className="mb-1 flex justify-between text-sm"><span className="truncate">{h.title}</span><span className="num text-muted">{p.done}/{p.target}</span></div>
                  <Gauge done={p.done} target={p.target} min={p.min} tone={toneOf(h.domain)} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <EveningReview log={log} patch={patch} />
      </aside>
      </div>

      <CheckMenu item={menu} checkin={menu && checkOf(menu.habit)} onClose={() => setMenu(null)} onSet={(status) => {
        const late = menu.habit.schedule === 'fixe' || menu.planned ? (checkOf(menu.habit)?.late_min ?? lateness(day, menu.at)) : null;
        check.mutate({ habit_id: menu.habit.id, status, late_min: late });
        setMenu(null);
      }} />
    </div>
  );
}

const toneOf = (domain) => ({ esprit: 'rouge', service: 'ciel', corps: 'herbe', etudes: 'orange' }[domain]);

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function intention(season) {
  if (!season?.intention) return null;
  return <p className="mt-2 border-l-2 border-rouge pl-2 text-sm italic">{season.intention}</p>;
}

function NowLine() {
  return (
    <div className="relative -ml-[5px] flex items-center gap-2 py-1">
      <span className="pulse-dot h-2 w-2 rounded-full bg-rouge" />
      <span className="h-px flex-1 bg-rouge" />
      <span className="pr-1 text-[0.65rem] font-bold uppercase tracking-wider text-rouge">maintenant</span>
    </div>
  );
}

function BlockRow({ item }) {
  return (
    <div className="flex items-center gap-3 py-2 pl-4 text-muted">
      <span className="w-11 shrink-0 text-sm font-semibold num">{toTime(item.at)}</span>
      <div className="flex-1 border-l-4 border-line bg-paper-2 px-3 py-2 text-sm">
        <span className="font-semibold text-ink">{item.block.title}</span> · jusqu'à {toTime(item.end)}{item.block.location ? ` · ${item.block.location}` : ''}
      </div>
    </div>
  );
}

function HabitRow({ item, checkin, light, onTap, flat }) {
  const h = item.habit;
  const state = checkState(checkin, h);
  const version = light && !h.sacred && h.light_version ? h.light_version : h.full_version;
  const link = KIND_LINK[h.kind];
  return (
    <div className={clsx('flex items-center gap-3 py-2.5', !flat && 'pl-4')}>
      {!flat && <span className="w-11 shrink-0 text-sm font-bold num">{item.at != null ? toTime(item.at) : ''}</span>}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {link ? <Link to={link} className="truncate font-semibold underline-offset-4 hover:underline">{h.title}</Link> : <span className="truncate font-semibold">{h.title}</span>}
          {h.sacred && <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-wider text-rouge">sacré</span>}
          {item.planned && <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-wider text-muted">placé</span>}
        </div>
        {version && <p className="truncate text-sm text-muted">{version}</p>}
        {state === 'retard' && <p className="text-xs font-semibold text-orange">Rattrapé avec {minutesLabel(checkin.late_min)} de retard</p>}
      </div>
      <button type="button" className="check" data-state={state || undefined} onClick={onTap} aria-label={state ? `Modifier ${h.title}` : `Pointer ${h.title}`}>
        {state && state !== 'manque' && state !== 'repos' && <Check className="h-5 w-5" strokeWidth={3} />}
        {state === 'repos' && <span className="text-[0.6rem] font-bold">repos</span>}
      </button>
    </div>
  );
}

function SugarSaltRow({ habit, log, patch, checkin }) {
  const check = useCheck();
  const set = (field, value) => {
    const next = { sugar_free: log?.sugar_free, salt_free: log?.salt_free, [field]: value };
    patch({ [field]: value });
    const both = next.sugar_free && next.salt_free;
    const one = next.sugar_free || next.salt_free;
    if (next.sugar_free != null && next.salt_free != null) {
      check.mutate({ habit_id: habit.id, status: both ? 'fait' : one ? 'leger' : 'manque' });
    }
  };
  const Toggle = ({ field, label }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        <button type="button" className="chip" aria-pressed={log?.[field] === true} onClick={() => set(field, true)}>Tenu</button>
        <button type="button" className="chip" aria-pressed={log?.[field] === false} onClick={() => set(field, false)}>Écart</button>
      </div>
    </div>
  );
  return (
    <div className="py-3">
      <div className="mb-2 flex items-center justify-between">
        <Link to="/corps?onglet=sucre" className="font-semibold">{habit.title}</Link>
        {checkin && <span className="text-xs font-semibold text-herbe">{checkin.status === 'fait' ? 'Journée propre' : checkin.status === 'leger' ? 'À moitié' : 'Demain on reprend'}</span>}
      </div>
      <div className="space-y-1.5">
        <Toggle field="sugar_free" label="Sans sucre ajouté" />
        <Toggle field="salt_free" label="Sans sel ni cube" />
      </div>
    </div>
  );
}

function Water({ value, onChange }) {
  const goal = 8;
  return (
    <div className="card flex items-center gap-3 p-4">
      <Droplet className="h-6 w-6 text-ciel" />
      <div className="flex-1">
        <p className="font-semibold">Eau <span className="num text-muted">{value}/{goal} verres</span></p>
        <div className="mt-1.5 flex gap-1">
          {Array.from({ length: goal }, (_, i) => (
            <button key={i} type="button" aria-label={`${i + 1} verres`} onClick={() => onChange(value === i + 1 ? i : i + 1)}
              className="h-5 flex-1 border border-ciel" style={{ background: i < value ? 'var(--ciel)' : 'transparent' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MorningCheckin({ onSave }) {
  const [sleep, setSleep] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [mood, setMood] = useState(null);
  const save = () => onSave({ sleep_hours: sleep, energy, mood, mode: energy <= 2 ? 'leger' : 'plein' });
  return (
    <Card domain="esprit" className="mb-6 p-4">
      <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-rouge" /><h2 className="text-lg font-bold">Check-in du matin</h2></div>
      <p className="mb-3 text-sm text-muted">10 secondes pour que la journée s'adapte à toi.</p>
      <p className="field-label">Sommeil</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[4, 5, 6, 6.5, 7, 7.5, 8, 9].map((h) => (
          <button key={h} type="button" className="chip num" aria-pressed={sleep === h} onClick={() => setSleep(h)}>{String(h).replace('.', ',')} h</button>
        ))}
      </div>
      <p className="field-label">Énergie</p>
      <Scale value={energy} onChange={setEnergy} tone="orange" labels={['Vidée', 'Basse', 'Correcte', 'Bonne', 'Pleine']} />
      <p className="field-label mt-3">Humeur</p>
      <Scale value={mood} onChange={setMood} tone="ciel" labels={['Lourde', 'Moyenne', 'Neutre', 'Bien', 'Joyeuse']} />
      {energy != null && energy <= 2 && (
        <p className="mt-3 border-l-4 border-jaune bg-jaune-soft px-3 py-2 text-sm">Énergie basse : je te propose un <b>jour léger</b>. Tes rendez-vous sacrés restent, le reste passe en version minimale.</p>
      )}
      <Button className="mt-4 w-full" disabled={!energy} onClick={save}>Commencer ma journée</Button>
    </Card>
  );
}

function EveningReview({ log, patch }) {
  const evening = new Date().getHours() >= 18;
  const [open, setOpen] = useState(false);
  const filled = log?.gratitude || log?.victory || log?.lesson;
  if (!evening && !filled && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mb-6 flex w-full items-center gap-2 text-sm font-semibold text-muted">
        <Moon className="h-4 w-4" /> Le bilan du soir s'ouvre à 18 h
      </button>
    );
  }
  const Fieldish = ({ k, label, ph }) => (
    <label className="block">
      <span className="field-label">{label}</span>
      <Textarea defaultValue={log?.[k] || ''} placeholder={ph} rows={2} onBlur={(e) => e.target.value !== (log?.[k] || '') && patch({ [k]: e.target.value })} />
    </label>
  );
  return (
    <Card className="mb-6 p-4" style={{ borderTop: '3px solid var(--ink)' }}>
      <div className="mb-3 flex items-center gap-2"><Moon className="h-5 w-5" /><h2 className="text-lg font-bold">Bilan du soir</h2></div>
      <div className="space-y-3">
        <Fieldish k="gratitude" label="Merci pour…" ph="Une chose précise." />
        <Fieldish k="victory" label="Ma victoire du jour" ph="Même petite." />
        <Fieldish k="lesson" label="Demain je ferai mieux…" ph="Sans te juger." />
      </div>
    </Card>
  );
}

function FastBanner({ fast }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const start = new Date(fast.starts_at).getTime();
  const end = new Date(fast.ends_at).getTime();
  const now = Date.now();
  const pct = (now - start) / (end - start);
  return (
    <Link to="/esprit?onglet=jeune" className="ink-block mb-5 flex items-center gap-4 p-4">
      <Soleil value={pct} size={64} petals={16}><Flame className="h-4 w-4 text-rouge" /></Soleil>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--jaune)]">Jeûne en cours</p>
        <p className="font-display text-2xl font-extrabold num">{now < end ? clock((end - now) / 1000) : 'Terminé'}</p>
        <p className="truncate text-sm opacity-70">{now < end ? `Rupture à ${hhmm(new Date(end).toTimeString())}` : 'Tu peux rompre ton jeûne.'}{fast.intention ? ` · ${fast.intention}` : ''}</p>
      </div>
    </Link>
  );
}

function CheckMenu({ item, checkin, onClose, onSet }) {
  if (!item) return null;
  const h = item.habit;
  return (
    <Sheet open onClose={onClose} title={h.title}>
      {checkin?.late_min != null && <p className="mb-3 text-sm text-muted">Pointé avec {minutesLabel(checkin.late_min)} d'écart sur l'heure prévue.</p>}
      <div className="grid gap-2">
        <Button variant="ink" onClick={() => onSet('fait')}>Fait en entier</Button>
        {!h.sacred && h.light_version && <Button variant="secondary" onClick={() => onSet('leger')}>Version légère : {h.light_version}</Button>}
        <Button variant="secondary" onClick={() => onSet('manque')}>Manqué</Button>
        <Button variant="secondary" onClick={() => onSet('repos')}>Jour de repos (maladie, voyage) — ne casse pas la série</Button>
        <Button variant="ghost" onClick={() => onSet(null)}>Effacer le pointage</Button>
      </div>
    </Sheet>
  );
}
