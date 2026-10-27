import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookMarked, Check, ChevronDown, Flame, Play, Plus, Sparkles } from 'lucide-react';
import PrayerMode from '../components/PrayerMode';
import { useHabits, useRows, useSave } from '../hooks/useData';
import { useAutoCheck } from '../hooks/useCheck';
import { addDays, clock, duration, hhmm, longDate, shortDate, today } from '../lib/dates';
import { fidelity } from '../lib/engine';
import { ACTS, BIBLE_BOOKS, FAST_KINDS } from '../data/contenus';
import { Button, Card, Chips, Empty, Field, Gauge, Input, SectionTitle, Select, Sheet, Stat, Tabs, Textarea } from '../components/ui';
import Soleil from '../components/Soleil';
import Deck from '../components/Deck';
import { PageHeader } from '../components/Layout';

export default function Esprit() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') || 'meditation';
  const { data: habits = [] } = useHabits();
  const { data: checkins = [] } = useRows('checkins', { key: ['range14'], build: (q) => q.gte('day', addDays(today(), -15)) });
  const sacred = habits.filter((h) => h.domain === 'esprit' && h.schedule === 'fixe');

  return (
    <div>
      <PageHeader kicker="Intimité avec Dieu" title="Esprit" help="esprit" sub="Des heures fixes, non négociables. Le reste de la journée s'organise autour." />
      {sacred.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          {sacred.map((h) => {
            const f = fidelity(h, checkins);
            return (
              <Card key={h.id} domain="esprit" className="p-3">
                <p className="text-sm font-semibold">{h.title} <span className="num text-muted">{hhmm(h.at_time)}</span></p>
                <p className="font-display text-2xl font-extrabold num">{f ? `${f.onTime}/${f.due}` : '—'}</p>
                <p className="text-xs text-muted">à l'heure sur 14 jours</p>
              </Card>
            );
          })}
        </div>
      )}
      <Tabs
        tabs={[['meditation', 'Méditation'], ['priere', 'Prière'], ['jeune', 'Jeûne'], ['versets', 'Versets']]}
        value={tab}
        onChange={(v) => setParams({ onglet: v }, { replace: true })}
      />
      <div className="mt-5">
        {tab === 'meditation' && <Meditation habits={habits} />}
        {tab === 'priere' && <Prayer habits={habits} />}
        {tab === 'jeune' && <Fasting habits={habits} />}
        {tab === 'versets' && (
          <>
            <p className="mb-4 text-sm text-muted">Les versets à garder dans le cœur. Ils reviennent de moins en moins souvent à mesure que tu les sais.</p>
            <Deck deck="versets" habits={habits} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Meditation ────────────────────────────────────────────────────────────

const EMPTY_DEVOTION = { passage: '', verse: '', observation: '', application: '', prayer: '' };

function Meditation({ habits }) {
  const { data: plans = [] } = useRows('bible_plans', { build: (q) => q.eq('active', true).order('created_at', { ascending: false }) });
  const { data: devotions = [] } = useRows('devotions', { build: (q) => q.order('day', { ascending: false }).order('created_at', { ascending: false }).limit(60) });
  const saveDevotion = useSave('devotions');
  const savePlan = useSave('bible_plans');
  const saveCard = useSave('cards');
  const autoCheck = useAutoCheck(habits);
  const plan = plans[0];
  const todays = devotions.find((d) => d.day === today());
  const [form, setForm] = useState(EMPTY_DEVOTION);
  const [planOpen, setPlanOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [memorized, setMemorized] = useState(false);

  useEffect(() => {
    if (plan && !form.passage) setForm((f) => ({ ...f, passage: `${plan.book} ${Math.min(plan.current, plan.chapters)}` }));
  }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = () => saveDevotion.mutate(form, {
    onSuccess: () => {
      autoCheck('meditation');
      if (plan && form.passage.startsWith(plan.book) && plan.current <= plan.chapters) {
        savePlan.mutate({ id: plan.id, current: plan.current + 1 });
      }
      setForm(EMPTY_DEVOTION);
    },
  });
  const memorize = (d) => saveCard.mutate(
    { deck: 'versets', front: d.passage, back: d.verse, example: d.application.slice(0, 200), source: shortDate(d.day) },
    { onSuccess: () => setMemorized(true) },
  );
  const streakDays = new Set(devotions.map((d) => d.day));
  let streak = 0;
  for (let d = streakDays.has(today()) ? today() : addDays(today(), -1); streakDays.has(d); d = addDays(d, -1)) streak += 1;

  return (
    <div className="space-y-5">
      <Card domain="esprit" className="flex items-center gap-4 p-4">
        {plan ? (
          <>
            <Soleil value={(plan.current - 1) / plan.chapters} size={84} petals={Math.min(plan.chapters, 36)}>
              <span className="text-[0.7rem] font-bold num">{plan.current - 1}/{plan.chapters}</span>
            </Soleil>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-rouge">Plan de lecture</p>
              <p className="font-display text-xl font-bold">{plan.current > plan.chapters ? `${plan.book} terminé` : `${plan.book} ${plan.current}`}</p>
              <p className="text-sm text-muted">{streak > 0 ? `${streak} jour${streak > 1 ? 's' : ''} de suite dans la Parole` : 'Un chapitre par jour.'}</p>
            </div>
          </>
        ) : <p className="flex-1 text-sm text-muted">Choisis un livre : l'app prépare chaque matin le chapitre suivant.</p>}
        <Button variant="secondary" size="sm" onClick={() => setPlanOpen(true)}>{plan ? 'Changer' : 'Choisir'}</Button>
      </Card>

      {todays ? (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-herbe"><Check className="h-5 w-5" /><p className="font-semibold">Méditation du jour écrite</p></div>
          <p className="mt-2 font-display text-lg font-bold">{todays.passage}</p>
          {todays.verse && <blockquote className="mt-1 border-l-4 border-rouge pl-3 italic">{todays.verse}</blockquote>}
          {todays.verse && !memorized && <Button className="mt-3" size="sm" variant="secondary" icon={BookMarked} onClick={() => memorize(todays)}>Mémoriser ce verset</Button>}
          {memorized && <p className="mt-3 text-sm font-semibold text-herbe">Ajouté à tes versets à mémoriser.</p>}
        </Card>
      ) : (
        <Card className="p-4">
          <SectionTitle>Journal É.O.A.P.</SectionTitle>
          <div className="space-y-3">
            <Field label="Passage"><Input value={form.passage} onChange={set('passage')} placeholder="Jean 15" /></Field>
            <Field label="É — Écriture" hint="Le verset qui te parle, recopié."><Textarea value={form.verse} onChange={set('verse')} rows={2} /></Field>
            <Field label="O — Observation" hint="Que dit le texte ? À qui, dans quel contexte ?"><Textarea value={form.observation} onChange={set('observation')} rows={3} /></Field>
            <Field label="A — Application" hint="Qu'est-ce que ça change concrètement aujourd'hui ?"><Textarea value={form.application} onChange={set('application')} rows={3} /></Field>
            <Field label="P — Prière" hint="Réponds à Dieu avec tes mots."><Textarea value={form.prayer} onChange={set('prayer')} rows={3} /></Field>
            <Button className="w-full" loading={saveDevotion.isPending} disabled={!form.passage.trim()} onClick={submit}>Enregistrer ma méditation</Button>
          </div>
        </Card>
      )}

      <div>
        <SectionTitle>Mes méditations</SectionTitle>
        {!devotions.length && <Empty title="Ton journal commence ici">Chaque méditation écrite reste : tu pourras relire ce que Dieu t'a dit cette saison.</Empty>}
        <ul className="divide-y divide-line border-y border-line">
          {devotions.map((d) => (
            <li key={d.id}>
              <button type="button" className="flex w-full items-center justify-between gap-3 py-2.5 text-left" onClick={() => setOpenId(openId === d.id ? null : d.id)}>
                <span><span className="font-semibold">{d.passage}</span> <span className="text-sm text-muted">· {longDate(d.day)}</span></span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition ${openId === d.id ? 'rotate-180' : ''}`} />
              </button>
              {openId === d.id && (
                <div className="space-y-2 pb-3 text-sm">
                  {d.verse && <blockquote className="border-l-4 border-rouge pl-3 italic">{d.verse}</blockquote>}
                  {d.observation && <p><b>Observation.</b> {d.observation}</p>}
                  {d.application && <p><b>Application.</b> {d.application}</p>}
                  {d.prayer && <p><b>Prière.</b> {d.prayer}</p>}
                  {d.verse && <Button size="sm" variant="ghost" icon={BookMarked} onClick={() => memorize(d)}>Mémoriser</Button>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <PlanSheet open={planOpen} onClose={() => setPlanOpen(false)} current={plan} />
    </div>
  );
}

function PlanSheet({ open, onClose, current }) {
  const save = useSave('bible_plans');
  const [book, setBook] = useState('Psaumes');
  const [from, setFrom] = useState(1);
  const chapters = BIBLE_BOOKS.find(([b]) => b === book)?.[1] || 1;
  const start = async () => {
    if (current) await save.mutateAsync({ id: current.id, active: false });
    save.mutate({ book, chapters, current: Math.min(Math.max(1, Number(from) || 1), chapters) }, { onSuccess: onClose });
  };
  return (
    <Sheet open={open} onClose={onClose} title="Plan de lecture">
      <div className="space-y-3">
        <Field label="Livre"><Select value={book} onChange={(e) => setBook(e.target.value)} options={BIBLE_BOOKS.map(([b, n]) => [b, `${b} (${n} ch.)`])} /></Field>
        <Field label="Commencer au chapitre"><Input type="number" min={1} max={chapters} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <p className="text-sm text-muted">À un chapitre par jour : environ {chapters - (Number(from) || 1) + 1} jours.</p>
        <Button className="w-full" onClick={start} loading={save.isPending}>Commencer ce plan</Button>
      </div>
    </Sheet>
  );
}

// ─── Priere ────────────────────────────────────────────────────────────────

const PRAYER_CATS = [['personnel', 'Moi'], ['famille', 'Famille'], ['ecaa', 'ECAA'], ['etudes', 'Études'], ['sante', 'Santé'], ['autres', 'Autres']];

function Prayer({ habits }) {
  const autoCheck = useAutoCheck(habits);
  const [praying, setPraying] = useState(false);
  const { data: requests = [] } = useRows('prayer_requests', { build: (q) => q.order('created_at', { ascending: false }) });
  const save = useSave('prayer_requests');
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('personnel');
  const [answering, setAnswering] = useState(null);
  const [guide, setGuide] = useState(false);
  const open = requests.filter((r) => r.status === 'en_cours');
  const answered = requests.filter((r) => r.status === 'exauce').sort((a, b) => (a.answered_on < b.answered_on ? 1 : -1));

  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    save.mutate({ title: title.trim(), category: cat || 'personnel' }, { onSuccess: () => setTitle('') });
  };

  return (
    <div className="space-y-5">
      <Button size="lg" icon={Play} className="w-full" onClick={() => setPraying(true)}>Mode prière</Button>
      {praying && (
        <PrayerMode
          title="Prière"
          items={[
            ...ACTS.map((a) => ({ id: a.k, kicker: `${a.k} · ${a.t}`, title: a.t, body: a.q })),
            ...open.map((r) => ({ id: r.id, kicker: PRAYER_CATS.find(([k]) => k === r.category)?.[1] || 'Sujet', title: r.title, body: r.details, hint: `Tu portes ce sujet depuis le ${shortDate(r.created_at.slice(0, 10))}.` })),
          ]}
          onFinish={(minutes) => autoCheck('priere', minutes)}
          onClose={() => setPraying(false)}
        />
      )}
      <Card className="p-4">
        <button type="button" className="flex w-full items-center justify-between" onClick={() => setGuide(!guide)}>
          <span className="flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-rouge" /> Guide A.C.T.S. pour ton temps de prière</span>
          <ChevronDown className={`h-4 w-4 transition ${guide ? 'rotate-180' : ''}`} />
        </button>
        {guide && (
          <ol className="mt-3 space-y-2">
            {ACTS.map((a) => (
              <li key={a.k} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink font-display font-extrabold text-on-ink">{a.k}</span>
                <span className="text-sm"><b>{a.t}.</b> {a.q}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <form onSubmit={add} className="space-y-2">
        <SectionTitle>Mes sujets de prière</SectionTitle>
        <div className="flex gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nouveau sujet…" />
          <Button type="submit" icon={Plus} aria-label="Ajouter" />
        </div>
        <Chips options={PRAYER_CATS} value={cat} onChange={setCat} />
      </form>

      {!open.length && <Empty title="Aucun sujet en cours">Écris ce que tu portes. Tu verras un jour la réponse s'écrire en face.</Empty>}
      <ul className="divide-y divide-line border-y border-line">
        {open.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{r.title}</p>
              <p className="text-xs text-muted">{PRAYER_CATS.find(([k]) => k === r.category)?.[1]} · depuis le {shortDate(r.created_at.slice(0, 10))}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setAnswering(r)}>Exaucé</Button>
          </li>
        ))}
      </ul>

      <div>
        <SectionTitle>Mur des exaucements <span className="font-normal text-muted">({answered.length})</span></SectionTitle>
        {!answered.length && <p className="text-sm text-muted">Chaque prière exaucée viendra s'afficher ici. Un rappel de sa fidélité pour les jours de doute.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {answered.map((r) => (
            <div key={r.id} className="ink-block p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--jaune)]">{shortDate(r.answered_on)} · après {Math.max(0, Math.round((new Date(r.answered_on) - new Date(r.created_at)) / 86400000))} j</p>
              <p className="mt-1 font-display text-lg font-bold">{r.title}</p>
              {r.testimony && <p className="mt-1 text-sm opacity-80">{r.testimony}</p>}
            </div>
          ))}
        </div>
      </div>

      <AnswerSheet request={answering} onClose={() => setAnswering(null)} onSave={(fields) => save.mutate({ id: answering.id, status: 'exauce', ...fields }, { onSuccess: () => setAnswering(null) })} />
    </div>
  );
}

function AnswerSheet({ request, onClose, onSave }) {
  const [testimony, setTestimony] = useState('');
  const [date, setDate] = useState(today());
  if (!request) return null;
  return (
    <Sheet open onClose={onClose} title="Gloire à Dieu">
      <p className="mb-3 font-semibold">{request.title}</p>
      <div className="space-y-3">
        <Field label="Exaucé le"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Mon témoignage" hint="Comment c'est arrivé. Tu le reliras."><Textarea value={testimony} onChange={(e) => setTestimony(e.target.value)} /></Field>
        <Button className="w-full" onClick={() => onSave({ testimony, answered_on: date })}>Ajouter au mur</Button>
      </div>
    </Sheet>
  );
}

// ─── Jeune ─────────────────────────────────────────────────────────────────

function Fasting({ habits }) {
  const { data: fasts = [] } = useRows('fasts', { build: (q) => q.order('starts_at', { ascending: false }).limit(40) });
  const save = useSave('fasts');
  const autoCheck = useAutoCheck(habits);
  const [planning, setPlanning] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const current = fasts.find((f) => !f.ended_at && new Date(f.starts_at).getTime() <= now);
  const upcoming = fasts.filter((f) => !f.ended_at && new Date(f.starts_at).getTime() > now).reverse();
  const past = fasts.filter((f) => f.ended_at);
  const totalHours = past.reduce((s, f) => s + (new Date(f.ended_at) - new Date(f.starts_at)) / 3600000, 0);
  const [journal, setJournal] = useState('');

  const breakFast = () => {
    const end = new Date();
    const completed = end >= new Date(current.ends_at) - 5 * 60000;
    save.mutate({ id: current.id, ended_at: end.toISOString(), completed, journal }, {
      onSuccess: () => { if (completed) autoCheck('jeune'); setJournal(''); },
    });
  };

  return (
    <div className="space-y-5">
      {current ? (() => {
        const s = new Date(current.starts_at).getTime();
        const e = new Date(current.ends_at).getTime();
        const done = now >= e;
        return (
          <div className="ink-block p-5">
            <div className="flex items-center gap-5">
              <Soleil value={(now - s) / (e - s)} size={120} petals={24}>
                <Flame className="h-6 w-6 text-rouge" />
              </Soleil>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--jaune)]">Jeûne {FAST_KINDS[current.kind].label.toLowerCase()} en cours</p>
                <p className="font-display text-4xl font-extrabold num">{done ? 'Accompli' : clock((e - now) / 1000)}</p>
                <p className="text-sm opacity-70">{clock((now - s) / 1000)} écoulées · rupture à {hhmm(new Date(e).toTimeString())}</p>
              </div>
            </div>
            {current.intention && <p className="mt-4 border-l-4 border-[var(--rouge)] pl-3 italic">{current.intention}</p>}
            {current.kind === 'sec' && <p className="mt-3 text-sm text-[var(--jaune)]">Jeûne sec : arrête si tu as des vertiges, et réhydrate-toi doucement à la rupture.</p>}
            <textarea className="input mt-4" rows={2} placeholder="Ce que Dieu t'a montré pendant ce jeûne…" value={journal} onChange={(ev) => setJournal(ev.target.value)} />
            <Button className="mt-3 w-full" variant={done ? 'primary' : 'secondary'} onClick={breakFast} style={done ? undefined : { color: 'inherit', borderColor: 'currentColor' }}>
              {done ? 'Rompre mon jeûne' : 'Arrêter avant la fin'}
            </Button>
          </div>
        );
      })() : (
        <Card domain="esprit" className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-display text-lg font-bold">Pas de jeûne en cours</p>
            <p className="text-sm text-muted">{upcoming[0] ? `Prochain : ${longDate(upcoming[0].starts_at.slice(0, 10))} à ${hhmm(new Date(upcoming[0].starts_at).toTimeString())}` : 'Planifie le prochain avec son intention.'}</p>
          </div>
          <Button icon={Plus} onClick={() => setPlanning(true)}>Planifier</Button>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Jeûnes accomplis" value={past.filter((f) => f.completed).length} tone="rouge" />
        <Stat label="Heures offertes" value={Math.round(totalHours)} />
        <Stat label="Prévus" value={upcoming.length} />
      </div>

      {upcoming.length > 0 && (
        <div>
          <SectionTitle>À venir</SectionTitle>
          <ul className="divide-y divide-line border-y border-line text-sm">
            {upcoming.map((f) => (
              <li key={f.id} className="py-2">
                <b>{longDate(f.starts_at.slice(0, 10))}</b> · {FAST_KINDS[f.kind].label} · {hhmm(new Date(f.starts_at).toTimeString())} → {hhmm(new Date(f.ends_at).toTimeString())}
                {f.intention && <p className="text-muted">{f.intention}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <SectionTitle>Mes jeûnes</SectionTitle>
          <ul className="divide-y divide-line border-y border-line text-sm">
            {past.map((f) => (
              <li key={f.id} className="py-2">
                <div className="flex justify-between gap-2">
                  <span><b>{shortDate(f.starts_at.slice(0, 10))}</b> · {FAST_KINDS[f.kind].label} · {duration((new Date(f.ended_at) - new Date(f.starts_at)) / 1000)}</span>
                  <span className={f.completed ? 'font-semibold text-herbe' : 'text-muted'}>{f.completed ? 'Accompli' : 'Interrompu'}</span>
                </div>
                {f.intention && <p className="text-muted">{f.intention}</p>}
                {f.journal && <p className="mt-1 italic">{f.journal}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <PlanFast open={planning} onClose={() => setPlanning(false)} onSave={(row) => save.mutate(row, { onSuccess: () => setPlanning(false) })} />
    </div>
  );
}

function PlanFast({ open, onClose, onSave }) {
  const [kind, setKind] = useState('partiel');
  const [day, setDay] = useState(addDays(today(), 1));
  const [from, setFrom] = useState('06:00');
  const [to, setTo] = useState('15:00');
  const [endDay, setEndDay] = useState(null);
  const [intention, setIntention] = useState('');
  const start = new Date(`${day}T${from}`);
  const end = new Date(`${endDay || day}T${to}`);
  const hours = (end - start) / 3600000;
  const tooLong = kind === 'sec' && hours > 24;
  return (
    <Sheet open={open} onClose={onClose} title="Planifier un jeûne">
      <div className="space-y-3">
        <Chips options={Object.entries(FAST_KINDS).map(([k, v]) => [k, v.label])} value={kind} onChange={(k) => {
          if (!k) return;
          setKind(k);
          if (k === 'total') { setFrom('18:00'); setTo('18:00'); setEndDay(addDays(day, 1)); } else { setEndDay(null); setFrom('06:00'); setTo(k === 'daniel' ? '20:00' : '15:00'); }
        }} />
        <p className="text-sm text-muted">{FAST_KINDS[kind].hint}</p>
        <Field label="Jour"><Input type="date" value={day} onChange={(e) => { setDay(e.target.value); if (endDay) setEndDay(addDays(e.target.value, 1)); }} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début"><Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label={endDay ? `Fin (${shortDate(endDay)})` : 'Rupture'}><Input type="time" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
        <Field label="Intention" hint="Pour quoi, pour qui tu jeûnes."><Textarea value={intention} onChange={(e) => setIntention(e.target.value)} rows={2} /></Field>
        {hours > 0 && <p className="text-sm">Durée : <b className="num">{Math.round(hours * 10) / 10} h</b></p>}
        {tooLong && <p className="border-l-4 border-rouge bg-rouge-soft px-3 py-2 text-sm">Un jeûne sec ne doit pas dépasser 24 heures.</p>}
        <p className="text-xs text-muted">Les jours de jeûne, l'app ne place pas de séance de sport intense.</p>
        <Button className="w-full" disabled={hours <= 0 || tooLong} onClick={() => onSave({ kind, starts_at: start.toISOString(), ends_at: end.toISOString(), intention })}>Planifier</Button>
      </div>
    </Sheet>
  );
}
