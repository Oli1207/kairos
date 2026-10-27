import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pause, Play, Plus, SkipForward, Siren } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useHabits, useProfile, useRows, useSave } from '../hooks/useData';
import { useAutoCheck } from '../hooks/useCheck';
import { addDays, capitalize, clock, DAY_LABELS, longDate, shortDate, today, weekStart, weekday } from '../lib/dates';
import { cravingInsights, streak, TRIGGERS, weekProgress } from '../lib/engine';
import { supabase, unwrap } from '../lib/supabase';
import { HIDDEN_SOURCES, ROUTINES, routineMinutes, SOS_ALTERNATIVES } from '../data/contenus';
import { Button, Card, Chips, Field, Gauge, Input, Scale, SectionTitle, Sheet, Stat, Tabs } from '../components/ui';
import Soleil from '../components/Soleil';
import { LineChart } from '../components/Chart';
import { PageHeader } from '../components/Layout';

export default function Corps() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') || 'seances';
  const { data: habits = [] } = useHabits();
  return (
    <div>
      <PageHeader kicker="Santé physique" title="Corps" help="corps" sub="Bouger, manger simple, couper le sucre et le sel. Prendre soin de moi." />
      <Tabs
        tabs={[['seances', 'Séances'], ['sucre', 'Sucre & sel'], ['repas', 'Repas'], ['poids', 'Poids']]}
        value={tab}
        onChange={(v) => setParams({ onglet: v }, { replace: true })}
      />
      <div className="mt-5">
        {tab === 'seances' && <Workouts habits={habits} />}
        {tab === 'sucre' && <SugarSalt sosOpen={params.get('sos') === '1'} onSosClose={() => setParams({ onglet: 'sucre' }, { replace: true })} />}
        {tab === 'repas' && <Meals />}
        {tab === 'poids' && <Weight />}
      </div>
    </div>
  );
}

// ─── Seances guidees ───────────────────────────────────────────────────────

function Workouts({ habits }) {
  const monday = weekStart();
  const { data: workouts = [] } = useRows('workouts', { build: (q) => q.order('day', { ascending: false }).limit(40) });
  const { data: checkins = [] } = useRows('checkins', { key: ['week', monday], build: (q) => q.gte('day', monday).lte('day', addDays(monday, 6)) });
  const save = useSave('workouts');
  const autoCheck = useAutoCheck(habits);
  const [routine, setRoutine] = useState(null);
  const [manual, setManual] = useState(false);
  const sport = habits.find((h) => h.kind === 'sport');
  const p = sport && weekProgress(sport, checkins, monday);
  const month = workouts.filter((w) => w.day >= addDays(today(), -29));

  const record = (row) => save.mutate(row, { onSuccess: () => { autoCheck('sport', row.minutes); setRoutine(null); setManual(false); } });

  return (
    <div className="space-y-5">
      {p && (
        <Card domain="corps" className="p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Cette semaine</h2>
            <span className="num text-muted">{p.done}/{p.target} séances</span>
          </div>
          <Gauge done={p.done} target={p.target} min={p.min} tone="herbe" />
          <p className="mt-2 text-sm text-muted">
            {p.done >= p.target ? 'Semaine complète. Repos mérité.' : p.done >= p.min ? 'Objectif tenu. La suivante est un bonus.' : `Encore ${p.min - p.done} pour tenir ton objectif.`}
          </p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {ROUTINES.map((r) => (
          <button key={r.key} type="button" onClick={() => setRoutine(r)} className="card flex flex-col p-4 text-left transition hover:border-ink" style={{ borderTop: `3px solid var(--${r.tone})` }}>
            <span className="flex items-baseline justify-between">
              <span className="font-display text-xl font-bold">{r.title}</span>
              <span className="text-sm num text-muted">{routineMinutes(r)} min</span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: `var(--${r.tone})` }}>{r.level}</span>
            <span className="mt-1 text-sm text-muted">{r.note}</span>
          </button>
        ))}
      </div>
      <Button variant="secondary" icon={Plus} className="w-full" onClick={() => setManual(true)}>J'ai bougé autrement (marche, danse, foot…)</Button>

      <div>
        <SectionTitle>Historique <span className="font-normal text-muted">· {month.length} séances en 30 jours</span></SectionTitle>
        <ul className="divide-y divide-line border-y border-line text-sm">
          {workouts.map((w) => (
            <li key={w.id} className="flex justify-between py-2">
              <span><b>{w.routine}</b> · {w.minutes} min{w.effort ? ` · effort ${w.effort}/5` : ''}</span>
              <span className="text-muted">{shortDate(w.day)}</span>
            </li>
          ))}
        </ul>
      </div>

      {routine && <Player routine={routine} onClose={() => setRoutine(null)} onDone={(effort, minutes) => record({ routine: routine.title, minutes, effort })} />}
      <ManualWorkout open={manual} onClose={() => setManual(false)} onSave={record} />
    </div>
  );
}

/** Lecteur de seance : enchaine les exercices, vibre au changement, garde l'ecran allume. */
function Player({ routine, onClose, onDone }) {
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(routine.steps[0].sec);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [effort, setEffort] = useState(null);
  const startedAt = useRef(null);
  const lock = useRef(null);
  const step = routine.steps[i];
  const next = routine.steps[i + 1];

  useEffect(() => {
    if (!running) return undefined;
    navigator.wakeLock?.request('screen').then((l) => { lock.current = l; }).catch(() => {});
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => { clearInterval(t); lock.current?.release?.(); };
  }, [running]);

  useEffect(() => {
    if (left > 0) return;
    if (i + 1 >= routine.steps.length) { setRunning(false); setFinished(true); navigator.vibrate?.([400, 150, 400]); return; }
    navigator.vibrate?.(routine.steps[i + 1].rest ? 150 : [200, 80, 200]);
    setI(i + 1);
    setLeft(routine.steps[i + 1].sec);
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSec = routine.steps.reduce((s, x) => s + x.sec, 0);
  const doneSec = routine.steps.slice(0, i).reduce((s, x) => s + x.sec, 0) + (step.sec - left);
  const minutes = Math.max(1, Math.round(((startedAt.current ? (Date.now() - startedAt.current) / 1000 : doneSec)) / 60));

  return (
    <Sheet open onClose={onClose} title={routine.title} wide>
      {finished ? (
        <div className="space-y-4 text-center">
          <p className="font-display text-3xl font-extrabold">Séance terminée</p>
          <Field label="Effort ressenti"><Scale value={effort} onChange={setEffort} tone="herbe" labels={['Facile', 'Modéré', 'Soutenu', 'Dur', 'Maximal']} /></Field>
          <Button className="w-full" onClick={() => onDone(effort, minutes)}>Enregistrer ma séance</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {step.round ? `Tour ${step.round} · ` : ''}étape {i + 1}/{routine.steps.length}
          </p>
          <Soleil value={1 - left / step.sec} size={230} petals={30} core={31} tones={step.rest ? ['ciel'] : ['herbe', 'jaune']}>
            <span className="font-display text-5xl font-extrabold num">{clock(left)}</span>
          </Soleil>
          <p className="font-display text-3xl font-extrabold" style={{ color: step.rest ? 'var(--ciel)' : undefined }}>{step.name}</p>
          {step.cue && <p className="max-w-sm text-muted">{step.cue}</p>}
          {next && <p className="text-sm">Ensuite : <b>{next.name}</b></p>}
          <div className="h-1.5 w-full bg-paper-2"><div className="h-full bg-herbe" style={{ width: `${(doneSec / totalSec) * 100}%` }} /></div>
          <div className="flex gap-2">
            <Button size="lg" variant={running ? 'secondary' : 'primary'} icon={running ? Pause : Play} onClick={() => { if (!startedAt.current) startedAt.current = Date.now(); setRunning(!running); }}>
              {running ? 'Pause' : i === 0 && left === step.sec ? 'Commencer' : 'Reprendre'}
            </Button>
            <Button size="lg" variant="ghost" icon={SkipForward} onClick={() => setLeft(0)}>Passer</Button>
          </div>
          {i > 0 && <button type="button" className="text-sm text-muted underline" onClick={() => { setRunning(false); setFinished(true); }}>Terminer maintenant</button>}
        </div>
      )}
    </Sheet>
  );
}

function ManualWorkout({ open, onClose, onSave }) {
  const [f, setF] = useState({ routine: 'Marche', minutes: 30, effort: null, day: today() });
  return (
    <Sheet open={open} onClose={onClose} title="Autre activité">
      <div className="space-y-3">
        <Chips options={['Marche', 'Danse', 'Course', 'Foot', 'Corde à sauter', 'Natation', 'Autre'].map((x) => [x, x])} value={f.routine} onChange={(v) => setF({ ...f, routine: v || 'Autre' })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minutes"><Input type="number" min={1} value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} /></Field>
          <Field label="Jour"><Input type="date" value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })} /></Field>
        </div>
        <Field label="Effort"><Scale value={f.effort} onChange={(v) => setF({ ...f, effort: v })} tone="herbe" /></Field>
        <Button className="w-full" disabled={!Number(f.minutes)} onClick={() => onSave({ ...f, minutes: Number(f.minutes) })}>Enregistrer</Button>
      </div>
    </Sheet>
  );
}

// ─── Sucre et sel ──────────────────────────────────────────────────────────

function SugarSalt({ sosOpen, onSosClose }) {
  const { data: logs = [] } = useRows('day_logs', { key: ['90j'], build: (q) => q.gte('day', addDays(today(), -90)) });
  const { data: cravings = [] } = useRows('cravings', { build: (q) => q.gte('at', addDays(today(), -60)).order('at', { ascending: false }) });
  const [sos, setSos] = useState(sosOpen);
  useEffect(() => { if (sosOpen) setSos(true); }, [sosOpen]);
  const byDay = useMemo(() => Object.fromEntries(logs.map((l) => [l.day, l])), [logs]);
  const sugarStreak = streak((d) => byDay[d]?.sugar_free === true);
  const saltStreak = streak((d) => byDay[d]?.salt_free === true);
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => setSos(true)} className="ink-block flex w-full items-center gap-3 p-4 text-left">
        <Siren className="h-7 w-7 text-[var(--jaune)]" />
        <span className="flex-1">
          <span className="block font-display text-xl font-bold">SOS envie</span>
          <span className="block text-sm opacity-70">Une envie dure rarement plus de 10 minutes. On la laisse passer ensemble.</span>
        </span>
      </button>

      <div className="grid grid-cols-2 gap-3">
        {[['sucre', sugarStreak, 'sugar_free'], ['sel', saltStreak, 'salt_free']].map(([k, n, field]) => (
          <Card key={k} domain="corps" className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-herbe">Sans {k}</p>
            <p className="font-display text-4xl font-extrabold num">{n}<span className="text-base font-semibold text-muted"> jour{n > 1 ? 's' : ''}</span></p>
            <Milestone n={n} />
            <div className="mt-2 flex gap-[3px]" aria-label="14 derniers jours">
              {last14.map((d) => (
                <span key={d} title={shortDate(d)} className="h-4 flex-1" style={{
                  background: byDay[d]?.[field] === true ? 'var(--herbe)' : byDay[d]?.[field] === false ? 'var(--rouge)' : 'var(--paper-2)',
                }} />
              ))}
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted">Chaque soir, indique « tenu » ou « écart » dans l'écran du jour : les séries se calculent seules.</p>

      {['sucre', 'sel'].map((k) => {
        const ins = cravingInsights(cravings, k);
        return ins.length > 0 && (
          <Card key={k} className="p-4">
            <SectionTitle>Tes envies de {k}</SectionTitle>
            <ul className="space-y-1 text-sm">{ins.map((s) => <li key={s}>• {s}</li>)}</ul>
          </Card>
        );
      })}

      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(HIDDEN_SOURCES).map(([k, list]) => (
          <Card key={k} className="p-4">
            <p className="mb-2 font-bold">Où se cache le {k}</p>
            <ul className="space-y-1 text-sm text-muted">{list.map((s) => <li key={s}>— {s}</li>)}</ul>
          </Card>
        ))}
      </div>

      {cravings.length > 0 && (
        <div>
          <SectionTitle>Dernières envies</SectionTitle>
          <ul className="divide-y divide-line border-y border-line text-sm">
            {cravings.slice(0, 12).map((c) => (
              <li key={c.id} className="flex justify-between gap-2 py-2">
                <span><b className="capitalize">{c.kind}</b>{c.trigger && ` · ${c.trigger}`}</span>
                <span className={c.resisted ? 'font-semibold text-herbe' : c.resisted === false ? 'text-rouge' : 'text-muted'}>
                  {c.resisted ? 'Tenu' : c.resisted === false ? 'Cédé' : '—'} · {shortDate(c.at.slice(0, 10))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sos && <SosFlow onClose={() => { setSos(false); onSosClose(); }} />}
    </div>
  );
}

function SosFlow({ onClose }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState('sucre');
  const [trigger, setTrigger] = useState(null);
  const [step, setStep] = useState(0);
  const [id, setId] = useState(null);
  const [left, setLeft] = useState(600);

  useEffect(() => {
    if (step !== 1) return undefined;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);
  useEffect(() => { if (step === 1 && left === 0) navigator.vibrate?.([300, 100, 300]); }, [left, step]);

  // L'envie est enregistree des le debut : meme si elle ferme l'app, on garde le declencheur.
  const start = async () => {
    const row = unwrap(await supabase.from('cravings').insert({ kind, trigger: trigger || '' }).select().single());
    setId(row.id);
    setStep(1);
  };
  const finish = async (resisted) => {
    if (id) await supabase.from('cravings').update({ resisted }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['cravings'] });
    setStep(resisted ? 2 : 3);
  };

  return (
    <Sheet open onClose={onClose} title="SOS envie">
      {step === 0 && (
        <div className="space-y-4">
          <Field label="Envie de"><Chips options={[['sucre', 'Sucre'], ['sel', 'Salé']]} value={kind} onChange={(v) => setKind(v || 'sucre')} /></Field>
          <Field label="Qu'est-ce qui l'a déclenchée ?"><Chips options={TRIGGERS.map((t) => [t, t])} value={trigger} onChange={setTrigger} /></Field>
          <Button size="lg" className="w-full" onClick={start}>Lancer les 10 minutes</Button>
        </div>
      )}
      {step === 1 && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Soleil value={1 - left / 600} size={210} petals={24} core={31} tones={['herbe', 'jaune']}>
            <span className="font-display text-4xl font-extrabold num">{clock(left)}</span>
          </Soleil>
          <p className="font-semibold">{left ? 'Pendant ce temps, choisis une de ces actions :' : 'Les 10 minutes sont passées. Alors ?'}</p>
          <ul className="w-full space-y-1.5 text-left">
            {SOS_ALTERNATIVES[kind].map((a) => <li key={a} className="border border-line bg-paper px-3 py-2 text-sm">{a}</li>)}
          </ul>
          <div className="grid w-full grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => finish(false)}>J'ai cédé</Button>
            <Button variant="ink" onClick={() => finish(true)}>J'ai tenu</Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3 text-center">
          <p className="font-display text-3xl font-extrabold text-herbe">Tenu.</p>
          <p className="text-muted">Chaque envie surmontée rend la suivante plus faible. Ton corps se réhabitue au vrai goût des aliments.</p>
          <Button className="w-full" onClick={onClose}>Fermer</Button>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3 text-center">
          <p className="font-display text-2xl font-extrabold">Ce n'est pas un échec.</p>
          <p className="text-muted">C'est une information. Le déclencheur est noté : au bilan, on verra ce qui revient et comment l'anticiper. Le prochain repas est un nouveau départ.</p>
          <Button className="w-full" onClick={onClose}>Fermer</Button>
        </div>
      )}
    </Sheet>
  );
}

// ─── Repas ─────────────────────────────────────────────────────────────────

const MEALS = [['matin', 'Petit-déjeuner'], ['midi', 'Déjeuner'], ['soir', 'Dîner'], ['collation', 'Collation']];
const QUALITY = [[1, 'Équilibré', 'herbe'], [2, 'Moyen', 'jaune'], [3, 'Écart', 'rouge']];

function Meals() {
  const [day, setDay] = useState(today());
  const { data: meals = [] } = useRows('meals', { key: ['14j'], build: (q) => q.gte('day', addDays(today(), -13)) });
  const save = useSave('meals', { onConflict: 'user_id,day,meal' });
  const todays = meals.filter((m) => m.day === day);
  const week = meals.filter((m) => m.day >= addDays(today(), -6));
  const balanced = week.filter((m) => m.quality === 1).length;

  const set = (meal, fields) => {
    const cur = todays.find((m) => m.meal === meal);
    save.mutate({ day, meal, quality: cur?.quality || 2, sugar: cur?.sugar || false, salt: cur?.salt || false, ...fields });
  };

  return (
    <div className="space-y-5">
      <Card domain="corps" className="flex items-center gap-4 p-4">
        <Plate />
        <div className="text-sm">
          <p className="font-display text-lg font-bold">La règle de l'assiette</p>
          <p><b className="text-herbe">½ légumes</b> (gombo, épinards, aubergine, salade, crudités)</p>
          <p><b className="text-orange">¼ protéines</b> (poisson, poulet, œufs, haricots)</p>
          <p><b className="text-or">¼ féculents</b> (attiéké, riz, igname, banane, foutou)</p>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{day === today() ? "Aujourd'hui" : capitalize(longDate(day))}</h2>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setDay(addDays(day, -1))}>Veille</Button>
          {day !== today() && <Button size="sm" variant="ghost" onClick={() => setDay(addDays(day, 1))}>Suivant</Button>}
        </div>
      </div>
      <div className="space-y-2">
        {MEALS.map(([key, label]) => {
          const m = todays.find((x) => x.meal === key);
          return (
            <div key={key} className="card p-3">
              <p className="mb-2 font-semibold">{label}</p>
              <div className="grid grid-cols-3 gap-1">
                {QUALITY.map(([q, l, tone]) => (
                  <button key={q} type="button" onClick={() => set(key, { quality: q })}
                    className="h-10 border text-sm font-semibold transition"
                    style={m?.quality === q ? { background: `var(--${tone})`, borderColor: `var(--${tone})`, color: tone === 'jaune' ? 'var(--ink)' : '#fff' } : { borderColor: 'var(--line)' }}>
                    {l}
                  </button>
                ))}
              </div>
              {m && (
                <div className="mt-2 flex gap-1.5">
                  <button type="button" className="chip" aria-pressed={m.sugar} onClick={() => set(key, { sugar: !m.sugar })}>+ sucre</button>
                  <button type="button" className="chip" aria-pressed={m.salt} onClick={() => set(key, { salt: !m.salt })}>+ sel / cube</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Stat label="Repas équilibrés sur 7 jours" value={`${balanced} / ${week.length}`} tone="herbe" />
    </div>
  );
}

/** L'assiette coupee en trois, aplats sans degrade. */
function Plate() {
  return (
    <svg viewBox="0 0 100 100" width="92" height="92" aria-hidden="true" className="shrink-0">
      <circle cx="50" cy="50" r="48" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M50 50 L50 8 A42 42 0 0 0 50 92 Z" fill="var(--herbe)" />
      <path d="M50 50 L50 8 A42 42 0 0 1 92 50 Z" fill="var(--orange)" />
      <path d="M50 50 L92 50 A42 42 0 0 1 50 92 Z" fill="var(--jaune)" />
    </svg>
  );
}

// ─── Poids ─────────────────────────────────────────────────────────────────

function Weight() {
  const { data: profile } = useProfile();
  const { data: weighIns = [] } = useRows('weigh_ins', { build: (q) => q.order('day') });
  const save = useSave('weigh_ins', { onConflict: 'user_id,day' });
  const saveProfile = useSave('profiles');
  const [w, setW] = useState('');
  const [waist, setWaist] = useState('');
  const [goals, setGoals] = useState(false);
  const last = weighIns[weighIns.length - 1];
  const start = profile?.start_weight ?? weighIns[0]?.weight_kg;
  const target = profile?.target_weight;
  const lost = start && last ? Number(start) - Number(last.weight_kg) : null;
  const weighDay = profile?.weigh_day ?? 6;
  const isWeighDay = weekday(today()) === weighDay;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Actuel" value={last ? `${String(last.weight_kg).replace('.', ',')} kg` : '—'} />
        <Stat label="Depuis le début" value={lost != null ? `${lost > 0 ? '−' : '+'}${Math.abs(lost).toFixed(1).replace('.', ',')} kg` : '—'} tone={lost > 0 ? 'herbe' : undefined} />
        <Stat label="Objectif" value={target ? `${String(target).replace('.', ',')} kg` : '—'} sub={target && last ? `encore ${Math.max(0, last.weight_kg - target).toFixed(1).replace('.', ',')} kg` : undefined} />
      </div>

      <Card domain="corps" className="p-4">
        <LineChart points={weighIns.map((x) => ({ d: x.day, v: Number(x.weight_kg) }))} target={target ? Number(target) : null} tone="herbe" avg={3} format={(v) => String(v).replace('.', ',')} />
        <p className="mt-1 text-xs text-muted">Trait vert : moyenne sur 3 pesées. Pointillé : ton objectif.</p>
      </Card>

      <Card className="p-4">
        <SectionTitle>{isWeighDay ? "C'est le jour de la pesée" : `Pesée du ${DAY_LABELS[weighDay]}`}</SectionTitle>
        <p className="mb-3 text-sm text-muted">Une fois par semaine, le matin, à jeun, après être passée aux toilettes. Les variations d'un jour à l'autre (eau, cycle, sel) ne veulent rien dire.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Poids (kg)"><Input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} /></Field>
          <Field label="Tour de taille (cm)"><Input inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="facultatif" /></Field>
        </div>
        <Button className="mt-3 w-full" disabled={!parseFloat(w.replace(',', '.'))} loading={save.isPending} onClick={() => save.mutate(
          { day: today(), weight_kg: parseFloat(w.replace(',', '.')), waist_cm: waist ? parseFloat(waist.replace(',', '.')) : null },
          { onSuccess: () => { setW(''); setWaist(''); } },
        )}>Enregistrer</Button>
        <button type="button" className="mt-3 text-sm font-semibold text-muted underline" onClick={() => setGoals(true)}>Mon point de départ et mon objectif</button>
      </Card>

      {weighIns.some((x) => x.waist_cm) && (
        <Card className="p-4">
          <SectionTitle>Tour de taille</SectionTitle>
          <LineChart points={weighIns.filter((x) => x.waist_cm).map((x) => ({ d: x.day, v: Number(x.waist_cm) }))} tone="orange" />
        </Card>
      )}

      <GoalsSheet open={goals} profile={profile} onClose={() => setGoals(false)} onSave={(f) => saveProfile.mutate({ id: profile.id, ...f }, { onSuccess: () => setGoals(false) })} />
    </div>
  );
}

function GoalsSheet({ open, profile, onClose, onSave }) {
  const [f, setF] = useState(null);
  if (!open || !profile) return null;
  const v = f || { height_cm: profile.height_cm || '', start_weight: profile.start_weight || '', target_weight: profile.target_weight || '', weigh_day: profile.weigh_day ?? 6 };
  const num = (x) => (x === '' || x == null ? null : parseFloat(String(x).replace(',', '.')));
  return (
    <Sheet open onClose={onClose} title="Point de départ et objectif">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Taille (cm)"><Input inputMode="decimal" value={v.height_cm} onChange={(e) => setF({ ...v, height_cm: e.target.value })} /></Field>
          <Field label="Départ (kg)"><Input inputMode="decimal" value={v.start_weight} onChange={(e) => setF({ ...v, start_weight: e.target.value })} /></Field>
          <Field label="Objectif (kg)"><Input inputMode="decimal" value={v.target_weight} onChange={(e) => setF({ ...v, target_weight: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-muted">Un rythme sain : 0,5 à 1 kg par semaine au maximum. Sur une saison de 8 semaines, 3 à 5 kg, c'est déjà beaucoup.</p>
        <Field label="Jour de pesée">
          <select className="input" value={v.weigh_day} onChange={(e) => setF({ ...v, weigh_day: Number(e.target.value) })}>
            {DAY_LABELS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </Field>
        <Button className="w-full" onClick={() => onSave({ height_cm: num(v.height_cm), start_weight: num(v.start_weight), target_weight: num(v.target_weight), weigh_day: v.weigh_day })}>Enregistrer</Button>
      </div>
    </Sheet>
  );
}

const MILESTONES = [3, 7, 14, 21, 30, 45, 60];

/** Prochain palier de la serie : de petites victoires visibles. */
function Milestone({ n }) {
  const next = MILESTONES.find((m) => m > n);
  const prev = [...MILESTONES].reverse().find((m) => m <= n) || 0;
  if (!next) return <p className="text-xs font-semibold text-herbe">Tous les paliers franchis.</p>;
  return (
    <div className="mt-1">
      <div className="h-1 bg-paper-2"><div className="h-full bg-herbe" style={{ width: `${((n - prev) / (next - prev)) * 100}%` }} /></div>
      <p className="mt-0.5 text-[0.65rem] text-muted">Prochain palier : {next} jours{prev ? ` · ${prev} j franchis` : ''}</p>
    </div>
  );
}
