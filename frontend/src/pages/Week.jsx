import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Trash2, Wand2 } from 'lucide-react';
import { useBulk, useHabits, useProfile, useRemove, useRows, useSave } from '../hooks/useData';
import { addDays, capitalize, dayName, diffDays, hhmm, shortDate, today, toTime, weekDays, weekStart } from '../lib/dates';
import { autoPlace, checkState, cravingInsights, DOMAINS, fidelity, freeSlots, sleepInsight, weekProgress } from '../lib/engine';
import { Button, Card, Empty, Field, Gauge, IconButton, Input, Scale, SectionTitle, Select, Sheet, Stat, Tabs, Textarea } from '../components/ui';
import { PageHeader } from '../components/Layout';
import { LineChart } from '../components/Chart';

const TONE = { esprit: 'rouge', service: 'ciel', corps: 'herbe', etudes: 'orange' };

export default function Week() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') || 'progres';
  const [monday, setMonday] = useState(weekStart());
  const sunday = addDays(monday, 6);
  const days = weekDays(monday);

  const { data: profile } = useProfile();
  const { data: habits = [] } = useHabits();
  // 3 semaines d'historique pour la fidelite sur 14 jours.
  const { data: checkins = [] } = useRows('checkins', { key: ['range', monday], build: (q) => q.gte('day', addDays(monday, -28)).lte('day', sunday) });
  const { data: planned = [] } = useRows('planned_sessions', { key: [monday], build: (q) => q.gte('day', monday).lte('day', sunday) });
  const { data: blocks = [] } = useRows('schedule_blocks');
  const { data: fasts = [] } = useRows('fasts', { key: ['semaine', monday], build: (q) => q.gte('ends_at', monday).lte('starts_at', `${sunday}T23:59:59`) });

  const ctx = { habits, planned, checkins, blocks, profile, fasts };
  const isThisWeek = monday === weekStart();

  return (
    <div>
      <PageHeader
        title="Semaine"
        help="semaine"
        sub={`du ${shortDate(monday)} au ${shortDate(sunday)}`}
        action={(
          <div className="flex">
            <IconButton icon={ChevronLeft} label="Semaine précédente" onClick={() => setMonday(addDays(monday, -7))} />
            <IconButton icon={ChevronRight} label="Semaine suivante" onClick={() => setMonday(addDays(monday, 7))} />
          </div>
        )}
      />
      {!isThisWeek && <button type="button" className="mb-3 text-sm font-semibold text-rouge" onClick={() => setMonday(weekStart())}>Revenir à cette semaine</button>}
      <Tabs
        tabs={[['progres', 'Progrès'], ['planning', 'Planning'], ['bilan', 'Bilan']]}
        value={tab}
        onChange={(v) => setParams({ onglet: v }, { replace: true })}
      />
      <div className="mt-5">
        {tab === 'progres' && <Progress monday={monday} {...ctx} />}
        {tab === 'planning' && <Planner monday={monday} days={days} {...ctx} />}
        {tab === 'bilan' && <Review monday={monday} {...ctx} />}
      </div>
    </div>
  );
}

function Progress({ monday, habits, checkins }) {
  return (
    <div className="space-y-5">
      {Object.entries(DOMAINS).map(([key, d]) => {
        const list = habits.filter((h) => h.domain === key);
        if (!list.length) return null;
        return (
          <Card key={key} domain={key} className="p-4">
            <h2 className="mb-3 text-lg font-bold">{d.label}</h2>
            <div className="space-y-3.5">
              {list.map((h) => {
                const p = weekProgress(h, checkins, monday);
                const f = h.schedule === 'fixe' ? fidelity(h, checkins) : null;
                return (
                  <div key={h.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold">{h.title}{h.at_time && <span className="ml-1.5 font-normal text-muted num">{hhmm(h.at_time)}</span>}</span>
                      <span className="shrink-0 num text-muted">
                        {p.done}/{p.target}
                        {p.onTime != null && p.done > 0 && ` · ${p.onTime} à l'heure`}
                      </span>
                    </div>
                    <Gauge done={p.done} target={p.target} min={p.min} tone={TONE[h.domain]} />
                    {h.schedule !== 'hebdo' && <Strip habit={h} checkins={checkins} />}
                    {f && f.due >= 5 && f.onTimeRate < 0.6 && (
                      <p className="mt-1 text-xs text-orange">Fragile : à l'heure {Math.round(f.onTimeRate * 100)} % du temps sur 14 jours.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Planner({ monday, days, habits, planned, checkins, blocks, profile, fasts }) {
  const bulk = useBulk('planned_sessions');
  const save = useSave('planned_sessions');
  const remove = useRemove('planned_sessions');
  const [proposals, setProposals] = useState(null);
  const [adding, setAdding] = useState(null);
  const weekly = habits.filter((h) => h.schedule === 'hebdo' && h.kind !== 'jeune');
  const ctx = { blocks, habits, planned };

  const freeByDay = useMemo(
    () => Object.fromEntries(days.map((d) => [d, freeSlots(d, ctx, profile, 15)])),
    [days, blocks, habits, planned, profile], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const totalFree = days.filter((d) => d >= today()).reduce((s, d) => s + freeByDay[d].reduce((a, [x, y]) => a + (y - x), 0), 0);

  const propose = () => setProposals(autoPlace({ days, habits, planned, checkins, blocks, profile, fasts }));
  const accept = () => bulk.mutate({ rows: proposals, onConflict: 'habit_id,day' }, { onSuccess: () => setProposals(null) });

  if (!weekly.length) return <Empty title="Aucune habitude hebdomadaire">Ajoute-en dans les réglages (sport, anglais…) pour les placer ici.</Empty>;

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Stat label="Temps libre restant cette semaine" value={`${Math.floor(totalFree / 60)} h ${String(totalFree % 60).padStart(2, '0')}`} sub={blocks.length ? 'Calculé à partir de ton emploi du temps.' : 'Saisis ton emploi du temps dans les réglages pour un calcul exact.'} />
          <Button icon={Wand2} onClick={propose}>Placer automatiquement</Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2.5">
          {weekly.map((h) => {
            const n = planned.filter((p) => p.habit_id === h.id).length;
            return (
              <div key={h.id} className="text-sm">
                <div className="mb-1 flex justify-between"><span className="truncate">{h.title}</span><span className="num text-muted">{n}/{h.per_week} placées</span></div>
                <Gauge done={n} target={h.per_week || 1} min={h.per_week_min} tone={TONE[h.domain]} />
              </div>
            );
          })}
        </div>
      </Card>

      {proposals && (
        <Card className="border-2 border-ink p-4">
          <SectionTitle>Proposition</SectionTitle>
          {!proposals.length ? <p className="text-sm text-muted">Tout est déjà placé, ou il n'y a plus de créneau assez long cette semaine.</p> : (
            <ul className="mb-3 divide-y divide-line text-sm">
              {proposals.map((p) => (
                <li key={p.habit_id + p.day} className="flex justify-between py-1.5">
                  <span className="font-semibold">{habits.find((h) => h.id === p.habit_id)?.title}</span>
                  <span className="text-muted">{dayName(p.day)} · {p.at_time}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            {proposals.length > 0 && <Button onClick={accept} loading={bulk.isPending}>Valider</Button>}
            <Button variant="secondary" onClick={() => setProposals(null)}>Annuler</Button>
          </div>
        </Card>
      )}

      {days.map((d) => {
        const mine = planned.filter((p) => p.day === d).sort((a, b) => (a.at_time < b.at_time ? -1 : 1));
        const past = d < today();
        return (
          <div key={d} className={past ? 'opacity-55' : undefined}>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{capitalize(dayName(d))} <span className="text-sm font-normal text-muted">{shortDate(d)}</span></h3>
              {!past && <IconButton icon={Plus} label="Ajouter une séance" onClick={() => setAdding(d)} />}
            </div>
            {mine.map((p) => {
              const h = habits.find((x) => x.id === p.habit_id);
              return (
                <div key={p.id} className="mb-1 flex items-center gap-3 border-l-4 bg-paper px-3 py-2" style={{ borderColor: `var(--${TONE[h?.domain] || 'line'})` }}>
                  <span className="w-11 text-sm font-bold num">{hhmm(p.at_time)}</span>
                  <span className="flex-1 font-semibold">{h?.title}</span>
                  <span className="text-xs text-muted">{h?.duration_min} min</span>
                  <IconButton icon={Trash2} label="Retirer" onClick={() => remove.mutate(p.id)} />
                </div>
              );
            })}
            {!past && (
              <p className="text-xs text-muted">
                Libre : {freeByDay[d].length ? freeByDay[d].map(([a, b]) => `${toTime(a)}–${toTime(b)}`).join(', ') : 'aucun créneau'}
              </p>
            )}
          </div>
        );
      })}

      <AddSession day={adding} habits={weekly} slots={adding ? freeByDay[adding] : []} onClose={() => setAdding(null)}
        onSave={(row) => save.mutate(row, { onSuccess: () => setAdding(null) })} />
    </div>
  );
}

function AddSession({ day, habits, slots, onClose, onSave }) {
  const [habit, setHabit] = useState('');
  const [time, setTime] = useState('');
  if (!day) return null;
  const h = habits.find((x) => x.id === (habit || habits[0]?.id));
  return (
    <Sheet open onClose={onClose} title={`Placer une séance — ${dayName(day)}`}>
      <div className="space-y-3">
        <Field label="Activité"><Select value={habit || habits[0]?.id} onChange={(e) => setHabit(e.target.value)} options={habits.map((x) => [x.id, x.title])} /></Field>
        <Field label="Heure"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        {slots.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {slots.filter(([a, b]) => b - a >= (h?.duration_min || 15)).map(([a]) => (
              <button key={a} type="button" className="chip num" aria-pressed={time === toTime(a)} onClick={() => setTime(toTime(a))}>{toTime(a)}</button>
            ))}
          </div>
        )}
        <Button className="w-full" disabled={!time} onClick={() => onSave({ habit_id: h.id, day, at_time: time })}>Placer</Button>
      </div>
    </Sheet>
  );
}

function Review({ monday, habits, checkins }) {
  const sunday = addDays(monday, 6);
  const { data: logs = [] } = useRows('day_logs', { key: ['range', monday], build: (q) => q.gte('day', addDays(monday, -21)).lte('day', sunday) });
  const { data: cravings = [] } = useRows('cravings', { key: ['range', monday], build: (q) => q.gte('at', addDays(monday, -21)).lte('at', `${sunday}T23:59:59`) });
  const { data: [review] = [] } = useRows('week_reviews', { key: [monday], build: (q) => q.eq('week_start', monday) });
  const save = useSave('week_reviews', { onConflict: 'user_id,week_start' });

  const weekLogs = logs.filter((l) => l.day >= monday && l.day <= sunday);
  const avg = (k) => {
    const v = weekLogs.map((l) => l[k]).filter((x) => x != null);
    return v.length ? (v.reduce((s, x) => s + Number(x), 0) / v.length) : null;
  };
  const scores = Object.entries(DOMAINS).map(([key, d]) => {
    const list = habits.filter((h) => h.domain === key);
    const ps = list.map((h) => weekProgress(h, checkins, monday, sunday));
    const done = ps.reduce((s, p) => s + Math.min(p.done, p.target), 0);
    const target = ps.reduce((s, p) => s + p.target, 0);
    return { key, label: d.label, rate: target ? done / target : null };
  }).filter((s) => s.rate != null);
  const fragile = habits.filter((h) => h.schedule === 'fixe')
    .map((h) => ({ h, f: fidelity(h, checkins) }))
    .filter(({ f }) => f && f.due >= 5)
    .sort((a, b) => a.f.onTimeRate - b.f.onTimeRate)
    .slice(0, 2);
  const sugarDays = weekLogs.filter((l) => l.sugar_free).length;
  const saltDays = weekLogs.filter((l) => l.salt_free).length;
  const insights = [sleepInsight(habits, checkins, logs), ...cravingInsights(cravings)].filter(Boolean);
  const victories = weekLogs.filter((l) => l.victory).map((l) => l.victory);

  const [form, setForm] = useState(null);
  const f = form || { wins: review?.wins || '', lesson: review?.lesson || '', focus: review?.focus || '', ecaa_goal: review?.ecaa_goal || '', rating: review?.rating || null };
  const set = (k, v) => setForm({ ...f, [k]: v });

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <SectionTitle>Ta semaine en chiffres</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {scores.map((s) => <Stat key={s.key} label={s.label} value={`${Math.round(s.rate * 100)} %`} tone={TONE[s.key]} />)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          <Stat label="Sommeil moyen" value={avg('sleep_hours') ? `${avg('sleep_hours').toFixed(1).replace('.', ',')} h` : '—'} />
          <Stat label="Énergie" value={avg('energy') ? `${avg('energy').toFixed(1).replace('.', ',')}/5` : '—'} />
          <Stat label="Jours sans sucre" value={`${sugarDays}/7`} tone="herbe" />
          <Stat label="Jours sans sel" value={`${saltDays}/7`} tone="herbe" />
        </div>
      </Card>

      {logs.filter((l) => l.energy).length >= 2 && (
        <Card className="p-4">
          <SectionTitle>Énergie et humeur <span className="font-normal text-muted">· 4 semaines</span></SectionTitle>
          <LineChart points={logs.filter((l) => l.energy).sort((a, b) => (a.day < b.day ? -1 : 1)).map((l) => ({ d: l.day, v: l.energy }))} tone="orange" height={120} />
          <LineChart points={logs.filter((l) => l.mood).sort((a, b) => (a.day < b.day ? -1 : 1)).map((l) => ({ d: l.day, v: l.mood }))} tone="ciel" height={120} />
          <p className="text-xs text-muted">Orange : énergie. Bleu : humeur. Une baisse qui dure plus de deux semaines mérite d'en parler à quelqu'un.</p>
        </Card>
      )}

      {(insights.length > 0 || fragile.length > 0) && (
        <Card domain="esprit" className="p-4">
          <SectionTitle>Ce que je remarque</SectionTitle>
          <ul className="space-y-2 text-sm">
            {fragile.map(({ h, f }) => (
              <li key={h.id}>• <b>{h.title}</b> ({hhmm(h.at_time)}) : tenu {f.kept}/{f.due}, à l'heure {f.onTime}/{f.due} sur 14 jours.{f.onTimeRate < 0.5 && ' Couche-toi plus tôt la veille, ou prépare tout le soir (Bible ouverte, réveil loin du lit).'}</li>
            ))}
            {insights.map((s) => <li key={s}>• {s}</li>)}
          </ul>
        </Card>
      )}

      {victories.length > 0 && (
        <Card className="p-4">
          <SectionTitle>Tes victoires de la semaine</SectionTitle>
          <ul className="space-y-1 text-sm">{victories.map((v, i) => <li key={i}>✦ {v}</li>)}</ul>
        </Card>
      )}

      <Card className="p-4">
        <SectionTitle>Bilan et cap</SectionTitle>
        <div className="space-y-3">
          <Field label="Comment s'est passée la semaine ?"><Scale value={f.rating} onChange={(v) => set('rating', v)} tone="rouge" /></Field>
          <Field label="Mes 3 victoires"><Textarea value={f.wins} onChange={(e) => set('wins', e.target.value)} /></Field>
          <Field label="La leçon de la semaine"><Textarea value={f.lesson} onChange={(e) => set('lesson', e.target.value)} /></Field>
          <Field label="Mon focus pour la semaine prochaine"><Input value={f.focus} onChange={(e) => set('focus', e.target.value)} /></Field>
          <Field label="Objectif ECAA de la semaine prochaine"><Input value={f.ecaa_goal} onChange={(e) => set('ecaa_goal', e.target.value)} /></Field>
          <Button className="w-full" loading={save.isPending} disabled={!form} onClick={() => save.mutate({ week_start: monday, ...f }, { onSuccess: () => setForm(null) })}>Enregistrer le bilan</Button>
          {diffDays(today(), sunday) >= -1 && <p className="text-center text-xs text-muted">Ensuite : onglet Planning, pour placer la semaine prochaine.</p>}
        </div>
      </Card>
    </div>
  );
}

const STRIP = { fait: 'var(--herbe)', leger: 'var(--jaune)', retard: 'var(--orange)', repos: 'var(--ciel-soft)' };

/** Les 28 derniers jours d'une habitude, une case par jour : la chaine a ne pas casser. */
function Strip({ habit, checkins }) {
  const days = Array.from({ length: 28 }, (_, i) => addDays(today(), i - 27));
  return (
    <div className="mt-1.5 flex gap-[2px]" aria-label="28 derniers jours">
      {days.map((d) => {
        const due = habit.days.includes(new Date(`${d}T12:00`).getDay());
        const c = checkins.find((x) => x.habit_id === habit.id && x.day === d);
        const st = checkState(c, habit);
        return (
          <span key={d} title={`${shortDate(d)}${st ? ` : ${st}` : ''}`} className="h-2.5 flex-1"
            style={{
              background: st && STRIP[st] ? STRIP[st] : 'transparent',
              border: st === 'manque' ? '1px solid var(--rouge)' : !st && due && d < today() ? '1px solid var(--line)' : '1px solid transparent',
              opacity: due ? 1 : 0.35,
            }} />
        );
      })}
    </div>
  );
}
