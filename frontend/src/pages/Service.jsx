import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { Check, ClipboardList, HeartHandshake, LifeBuoy, Phone, Play, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useHabits, useRemove, useRows, useSave } from '../hooks/useData';
import { useAutoCheck } from '../hooks/useCheck';
import { DAY_LABELS, addDays, diffDays, shortDate, today, weekStart, weekday } from '../lib/dates';
import { listeningAlert } from '../lib/engine';
import { ECAA_MOMENTS, ECAA_PILLARS } from '../data/contenus';
import { CRISIS_STEPS, GROUP_TEMPLATE, GROUP_THEMES, LESSONS, LISTENING_GUIDE, SELF_CHECK, TRACK } from '../data/ecaa';
import { Button, Card, Chips, Empty, Field, IconButton, Input, Scale, SectionTitle, Select, Sheet, Stat, Tabs, Textarea } from '../components/ui';
import Board from '../components/Board';
import Track from '../components/Track';
import PrayerMode from '../components/PrayerMode';
import { toast } from '../components/toast';
import { PageHeader } from '../components/Layout';

export default function Service() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') || 'intercession';
  const { data: habits = [] } = useHabits();
  return (
    <div>
      <PageHeader kicker="Servir" title="Service" help="service" sub="Porter les autres dans la prière, et donner corps à la vision d'ECAA." />
      <Tabs
        tabs={[['intercession', 'Intercession'], ['ecaa', 'ECAA'], ['formation', 'Formation'], ['ecoute', 'Écoute']]}
        value={tab}
        onChange={(v) => setParams({ onglet: v }, { replace: true })}
      />
      <div className="mt-5">
        {tab === 'intercession' && <Intercession habits={habits} />}
        {tab === 'ecaa' && <Ecaa />}
        {tab === 'formation' && (
          <>
            <p className="mb-4 text-sm text-muted">Une formation d'aidante, pensée comme le ferait une psychologue qui forme les bénévoles de son association : comprendre, écouter, repérer l'urgence, orienter, et durer sans s'user.</p>
            <Track track={TRACK} lessons={LESSONS} deck="ecaa" tone="ciel" habits={habits} />
          </>
        )}
        {tab === 'ecoute' && <Listening />}
      </div>
    </div>
  );
}

// ─── Intercession tournante ────────────────────────────────────────────────

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * La liste du jour : les cibles du jour de la semaine, plus les deux
 * personnes pour lesquelles elle n'a pas prie depuis le plus longtemps
 * (comme PrayerMate, personne n'est oublie).
 */
function todaysList(targets) {
  const wd = weekday(today());
  const base = targets.filter((t) => t.weekday == null || t.weekday === wd);
  const forgotten = targets
    .filter((t) => !base.includes(t) && (!t.last_prayed_on || diffDays(today(), t.last_prayed_on) >= 10))
    .sort((a, b) => (a.last_prayed_on || '') < (b.last_prayed_on || '') ? -1 : 1)
    .slice(0, 2);
  return [...base, ...forgotten.map((t) => ({ ...t, forgotten: true }))];
}

function Intercession({ habits }) {
  const { data: targets = [] } = useRows('intercession_targets', { build: (q) => q.eq('active', true).order('name') });
  const save = useSave('intercession_targets');
  const remove = useRemove('intercession_targets');
  const autoCheck = useAutoCheck(habits);
  const [adding, setAdding] = useState(false);
  const [praying, setPraying] = useState(false);
  const todays = todaysList(targets);
  const prayed = todays.filter((t) => t.last_prayed_on === today()).length;

  const mark = (t, on = true) => save.mutate({ id: t.id, last_prayed_on: on ? today() : null });
  const toggle = (t) => {
    const done = t.last_prayed_on === today();
    mark(t, !done);
    if (!done && prayed + 1 === todays.length) autoCheck('intercession');
  };

  return (
    <div className="space-y-5">
      <Card domain="service" className="p-4" data-tour="intercession">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Aujourd'hui, {DAY_LABELS[weekday(today())]}</h2>
          <span className="text-sm num text-muted">{prayed}/{todays.length}</span>
        </div>
        <p className="mb-3 text-sm text-muted">Une liste courte chaque jour, plus ceux que tu n'as pas portés depuis longtemps.</p>
        {todays.length > 0 && <Button className="mb-3 w-full" icon={Play} onClick={() => setPraying(true)}>Mode prière</Button>}
        {!todays.length && <p className="text-sm text-muted">Personne pour aujourd'hui. Ajoute des personnes ou des causes ci-dessous.</p>}
        <ul className="space-y-1.5">
          {todays.map((t) => {
            const done = t.last_prayed_on === today();
            return (
              <li key={t.id}>
                <button type="button" onClick={() => toggle(t)} className={clsx('flex w-full items-center gap-3 border p-3 text-left transition', done ? 'border-ciel bg-ciel-soft' : 'border-line bg-paper')}>
                  <span className="check h-8 w-8" data-state={done ? 'fait' : undefined}>{done && <Check className="h-4 w-4" strokeWidth={3} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{t.name}</span>
                    {t.forgotten && <span className="block text-xs font-semibold text-orange">Pas porté depuis {t.last_prayed_on ? `${diffDays(today(), t.last_prayed_on)} jours` : 'longtemps'}</span>}
                    {t.notes && <span className="block text-sm text-muted">{t.notes}</span>}
                  </span>
                  {t.category && <span className="chip">{t.category}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div>
        <SectionTitle action={<Button size="sm" icon={Plus} onClick={() => setAdding(true)}>Ajouter</Button>}>Ma rotation</SectionTitle>
        {[null, ...WEEK_ORDER].map((d) => {
          const list = targets.filter((t) => t.weekday === d);
          if (!list.length) return null;
          return (
            <div key={String(d)} className="mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{d == null ? 'Tous les jours' : DAY_LABELS[d]}</h3>
              <ul className="divide-y divide-line border-b border-line">
                {list.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 py-1.5">
                    <span className="flex-1 text-sm">{t.name}{t.notes && <span className="text-muted"> — {t.notes}</span>}</span>
                    <IconButton icon={Trash2} label="Retirer" className="h-8 w-8" onClick={() => remove.mutate(t.id)} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="flex gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4 shrink-0" /> Pour les personnes accompagnées par ECAA, un prénom ou une initiale suffit.</p>

      <AddTarget open={adding} onClose={() => setAdding(false)} onSave={(row) => save.mutate(row, { onSuccess: () => setAdding(false) })} />
      {praying && (
        <PrayerMode
          title="Intercession"
          items={todays.map((t) => ({ id: t.id, kicker: t.category || 'Intercession', title: t.name, body: t.notes, hint: t.forgotten ? 'Tu ne l\'as pas porté depuis longtemps.' : undefined }))}
          onPrayed={(it) => mark(it)}
          onFinish={() => autoCheck('intercession')}
          onClose={() => setPraying(false)}
        />
      )}
    </div>
  );
}

function AddTarget({ open, onClose, onSave }) {
  const [f, setF] = useState({ name: '', category: '', weekday: String(weekday(today())), notes: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Sheet open={open} onClose={onClose} title="Ajouter à ma rotation">
      <div className="space-y-3">
        <Field label="Personne ou cause"><Input value={f.name} onChange={set('name')} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jour"><Select value={f.weekday} onChange={set('weekday')} options={[['', 'Tous les jours'], ...WEEK_ORDER.map((d) => [String(d), DAY_LABELS[d]])]} /></Field>
          <Field label="Cercle"><Input value={f.category} onChange={set('category')} placeholder="Famille, Église…" /></Field>
        </div>
        <Field label="Ce que je demande pour elle / lui"><Textarea value={f.notes} onChange={set('notes')} rows={2} /></Field>
        <Button className="w-full" disabled={!f.name.trim()} onClick={() => {
          onSave({ ...f, name: f.name.trim(), weekday: f.weekday === '' ? null : Number(f.weekday) });
          setF({ ...f, name: '', notes: '' });
        }}>Ajouter</Button>
      </div>
    </Sheet>
  );
}

// ─── ECAA ──────────────────────────────────────────────────────────────────

function Ecaa() {
  const { data: [review] = [] } = useRows('week_reviews', { key: ['ecaa', weekStart()], build: (q) => q.in('week_start', [weekStart(), addDays(weekStart(), -7)]).order('week_start', { ascending: false }) });
  const { data: logs = [] } = useRows('listening_logs', { key: ['90j'], build: (q) => q.gte('day', addDays(today(), -89)) });
  const month = new Date().getMonth() + 1;
  const moments = ECAA_MOMENTS.filter((m) => m.month === month || m.month === (month % 12) + 1);
  const [draft, setDraft] = useState(null);
  const [group, setGroup] = useState(false);
  const groups = logs.filter((l) => l.kind === 'groupe').length;

  return (
    <div className="space-y-5">
      <Card domain="service" className="p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-ciel">Objectif ECAA de la semaine</p>
        <p className="mt-1 font-display text-xl font-bold">{review?.ecaa_goal || 'Fixe-le dans le bilan du dimanche (Semaine → Bilan).'}</p>
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
          <Stat label="Écoutes 90 j" value={logs.filter((l) => l.kind !== 'groupe').length} tone="ciel" />
          <Stat label="Groupes" value={groups} />
          <Stat label="Heures" value={(logs.reduce((s, l) => s + l.minutes, 0) / 60).toFixed(0)} />
        </div>
        <p className="mt-2 text-xs text-muted">L'impact d'ECAA, mesuré sans exposer personne. Utile pour les partenaires.</p>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" className="card flex items-center gap-3 p-3 text-left" onClick={() => setGroup(true)}>
          <Users className="h-6 w-6 text-ciel" />
          <span><span className="block font-semibold">Préparer un groupe de parole</span><span className="block text-sm text-muted">Modèle de séance de 90 min</span></span>
        </button>
        {moments.map((m) => (
          <div key={m.title} className="card flex flex-col p-3">
            <p className="font-semibold">{m.title}</p>
            <p className="flex-1 text-sm text-muted">{m.idea}</p>
            <Button size="sm" variant="secondary" className="mt-2 self-start" onClick={() => setDraft({ pillar: 'posts', title: m.title, details: m.idea })}>En faire un post</Button>
          </div>
        ))}
      </div>

      <Board board="ecaa" pillars={ECAA_PILLARS} tone="ciel" draft={draft} onDraftUsed={() => setDraft(null)} />
      {group && <GroupSheet onClose={() => setGroup(false)} onSave={(row) => setDraft(row)} />}
    </div>
  );
}

function GroupSheet({ onClose, onSave }) {
  const [theme, setTheme] = useState(GROUP_THEMES[0]);
  const [date, setDate] = useState('');
  const plan = GROUP_TEMPLATE.map(([t, m, d]) => `${t} (${m} min) : ${d}`).join('\n');
  return (
    <Sheet open onClose={onClose} title="Groupe de parole" wide>
      <div className="space-y-4">
        <Field label="Thème"><Chips options={GROUP_THEMES.map((t) => [t, t])} value={theme} onChange={(v) => v && setTheme(v)} /></Field>
        <ol className="divide-y divide-line border-y border-line">
          {GROUP_TEMPLATE.map(([t, m, d]) => (
            <li key={t} className="flex gap-3 py-2.5">
              <span className="w-12 shrink-0 font-display font-bold num text-ciel">{m} min</span>
              <span><b>{t}</b><span className="block text-sm text-muted">{d}</span></span>
            </li>
          ))}
        </ol>
        <p className="border-l-4 border-orange bg-orange-soft p-3 text-sm">Toujours à deux animateurs. Si quelqu'un est en crise, l'un sort avec la personne et suit le protocole de crise ; l'autre garde le groupe.</p>
        <Field label="Date prévue"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Button className="w-full" onClick={() => { onSave({ pillar: 'programme', title: `Groupe de parole : ${theme}`, details: plan, due_on: date || null }); onClose(); }}>
          Ajouter au programme ECAA
        </Button>
      </div>
    </Sheet>
  );
}

// ─── Ecoute : guide, protocole, journal, soin de l'ecoutante ───────────────

const KINDS = [['individuelle', 'En personne'], ['appel', 'Appel'], ['groupe', 'Groupe'], ['crise', 'Crise']];

function Listening() {
  const { data: logs = [] } = useRows('listening_logs', { build: (q) => q.order('created_at', { ascending: false }).limit(60) });
  const { data: resources = [] } = useRows('resources', { build: (q) => q.order('label') });
  const save = useSave('listening_logs');
  const saveRes = useSave('resources');
  const removeRes = useRemove('resources');
  const [f, setF] = useState({ kind: 'individuelle', minutes: 45, feeling: null, debrief: '', supervised: false });
  const [res, setRes] = useState({ label: '', contact: '', note: '' });
  const [sheet, setSheet] = useState(null); // 'crise' | 'guide' | 'check' | 'contact'
  const monthStart = `${today().slice(0, 8)}01`;
  const month = logs.filter((l) => l.day >= monthStart);
  const alert = listeningAlert(logs);
  const unsupervised = logs.filter((l) => !l.supervised && (l.kind === 'crise' || l.feeling <= 2)).slice(0, 5);

  return (
    <div className="space-y-5">
      <button type="button" data-tour="crise" onClick={() => setSheet('crise')} className="flex w-full items-center gap-3 bg-rouge p-4 text-left text-white">
        <LifeBuoy className="h-7 w-7" />
        <span className="flex-1">
          <span className="block font-display text-xl font-bold">Protocole de crise</span>
          <span className="block text-sm opacity-85">Quelqu'un parle de mourir ? Les 7 étapes, et tes contacts d'urgence.</span>
        </span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="card flex items-center gap-2 p-3 text-left text-sm font-semibold" onClick={() => setSheet('guide')}><ClipboardList className="h-5 w-5 text-ciel" />Guide d'écoute</button>
        <button type="button" className="card flex items-center gap-2 p-3 text-left text-sm font-semibold" onClick={() => setSheet('check')}><HeartHandshake className="h-5 w-5 text-orange" />Mon état d'écoutante</button>
      </div>

      {alert && (
        <div className="border-l-4 border-orange bg-orange-soft p-4">
          <p className="flex items-center gap-2 font-bold"><HeartHandshake className="h-5 w-5" /> Prends soin de toi aussi</p>
          <p className="mt-1 text-sm">Tes trois dernières écoutes t'ont laissée lourde. C'est le coût normal d'écouter la douleur des autres, mais elle ne se porte pas seule. Parles-en à ton référent ECAA cette semaine, et garde un vrai temps de repos.</p>
        </div>
      )}
      {unsupervised.length >= 2 && !alert && (
        <p className="border-l-4 border-jaune bg-jaune-soft p-3 text-sm">{unsupervised.length} écoutes difficiles n'ont pas encore été débriefées avec un référent.</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Ce mois" value={month.length} tone="ciel" />
        <Stat label="Heures" value={(month.reduce((s, l) => s + l.minutes, 0) / 60).toFixed(1).replace('.', ',')} />
        <Stat label="Ressenti" value={month.length ? `${(month.reduce((s, l) => s + l.feeling, 0) / month.length).toFixed(1).replace('.', ',')}/5` : '—'} />
      </div>

      <Card domain="service" className="p-4">
        <SectionTitle>Après une écoute</SectionTitle>
        <div className="space-y-3">
          <Chips options={KINDS} value={f.kind} onChange={(v) => v && setF({ ...f, kind: v })} />
          <Field label="Durée (minutes)"><Input type="number" inputMode="numeric" min={1} value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} /></Field>
          <Field label="Comment je me sens maintenant ?"><Scale value={f.feeling} onChange={(v) => setF({ ...f, feeling: v })} tone="ciel" labels={['Vidée', 'Lourde', 'Ça va', 'Bien', 'Paisible']} /></Field>
          <Field label="Débrief pour moi" hint="Sans nom ni détail qui permettrait de reconnaître la personne.">
            <Textarea value={f.debrief} onChange={(e) => setF({ ...f, debrief: e.target.value })} rows={3} placeholder="Ce qui m'a touchée, ce que j'ai bien fait, ce que je ferais autrement, l'orientation proposée." />
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="h-5 w-5 accent-[var(--ciel)]" checked={f.supervised} onChange={(e) => setF({ ...f, supervised: e.target.checked })} />
            Déjà débriefé avec mon référent
          </label>
          <Button className="w-full" disabled={!f.feeling || !f.minutes} loading={save.isPending}
            onClick={() => save.mutate({ ...f, minutes: Number(f.minutes) }, { onSuccess: () => { toast('Écoute notée. Prends un moment pour toi.'); setF({ kind: 'individuelle', minutes: 45, feeling: null, debrief: '', supervised: false }); } })}>
            Enregistrer
          </Button>
        </div>
      </Card>

      <div>
        <SectionTitle action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setSheet('contact')}>Ajouter</Button>}>Orienter</SectionTitle>
        <p className="mb-2 text-sm text-muted">Les contacts que tu as vérifiés : urgences, psychologues, psychiatres, lignes d'écoute, ton référent ECAA.</p>
        {!resources.length && <Empty title="Aucun contact">Commence par les urgences de ta ville et un professionnel de confiance. Appelle chaque numéro une fois pour le vérifier.</Empty>}
        <ResourceList resources={resources} onDelete={(id) => removeRes.mutate(id)} />
      </div>

      {logs.length > 0 && (
        <div>
          <SectionTitle>Mes débriefs</SectionTitle>
          <ul className="divide-y divide-line border-y border-line text-sm">
            {logs.slice(0, 15).map((l) => (
              <li key={l.id} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <span><b>{shortDate(l.day)}</b> · {KINDS.find(([k]) => k === l.kind)?.[1]} · {l.minutes} min · {l.feeling}/5</span>
                  {!l.supervised && (l.kind === 'crise' || l.feeling <= 2)
                    ? <button type="button" className="chip" onClick={() => save.mutate({ id: l.id, supervised: true })}>Débriefé ?</button>
                    : l.supervised && <span className="text-xs font-semibold text-herbe">débriefé</span>}
                </div>
                {l.debrief && <p className="text-muted">{l.debrief}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sheet === 'crise' && (
        <Sheet open onClose={() => setSheet(null)} title="Protocole de crise" wide>
          <ResourceList resources={resources} compact onDelete={null} />
          {!resources.length && <p className="mb-3 border-l-4 border-rouge bg-rouge-soft p-3 text-sm">Aucun contact enregistré. En Côte d'Ivoire, les numéros publics couramment indiqués sont le SAMU (185) et les pompiers (180) : vérifie-les, puis ajoute-les dans « Orienter ».</p>}
          <ol className="mt-3 space-y-3">
            {CRISIS_STEPS.map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-rouge font-display font-extrabold text-white">{i + 1}</span>
                <span><b>{s.t}</b><span className="block text-sm text-muted">{s.d}</span></span>
              </li>
            ))}
          </ol>
        </Sheet>
      )}
      {sheet === 'guide' && (
        <Sheet open onClose={() => setSheet(null)} title="Guide d'écoute" wide>
          {[['avant', 'Avant'], ['pendant', 'Pendant'], ['apres', 'Après']].map(([k, label]) => (
            <div key={k} className="mb-4">
              <h3 className="mb-1 font-display text-lg font-bold">{label}</h3>
              <ul className="space-y-1.5 text-sm">{LISTENING_GUIDE[k].map((x) => <li key={x} className="border-l-2 border-ciel pl-3">{x}</li>)}</ul>
            </div>
          ))}
        </Sheet>
      )}
      {sheet === 'check' && <SelfCheck onClose={() => setSheet(null)} />}
      {sheet === 'contact' && (
        <Sheet open onClose={() => setSheet(null)} title="Nouveau contact">
          <div className="space-y-3">
            <Field label="Nom"><Input value={res.label} onChange={(e) => setRes({ ...res, label: e.target.value })} placeholder="SAMU, psychologue, référent ECAA…" /></Field>
            <Field label="Téléphone"><Input type="tel" value={res.contact} onChange={(e) => setRes({ ...res, contact: e.target.value })} /></Field>
            <Field label="Note"><Input value={res.note} onChange={(e) => setRes({ ...res, note: e.target.value })} placeholder="Horaires, tarif, quand orienter vers lui" /></Field>
            <Button className="w-full" disabled={!res.label.trim()} onClick={() => saveRes.mutate(res, { onSuccess: () => { setRes({ label: '', contact: '', note: '' }); setSheet(null); } })}>Ajouter</Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function ResourceList({ resources, onDelete, compact }) {
  return (
    <ul className={clsx('divide-y divide-line', !compact && 'border-y border-line')}>
      {resources.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{r.label}</p>
            {r.note && !compact && <p className="text-sm text-muted">{r.note}</p>}
          </div>
          {r.contact && <a href={`tel:${r.contact.replace(/\s/g, '')}`} className="btn btn-secondary btn-sm"><Phone className="h-4 w-4" />{r.contact}</a>}
          {onDelete && <IconButton icon={Trash2} label="Supprimer" className="h-8 w-8" onClick={() => onDelete(r.id)} />}
        </li>
      ))}
    </ul>
  );
}

/** Auto-evaluation rapide de l'usure : un repere, pas un diagnostic. */
function SelfCheck({ onClose }) {
  const [answers, setAnswers] = useState({});
  const total = Object.values(answers).reduce((s, v) => s + v, 0);
  const complete = Object.keys(answers).length === SELF_CHECK.length;
  const level = total <= 5 ? ['herbe', 'Tu tiens bien. Garde tes rituels de sortie et ta supervision.']
    : total <= 11 ? ['jaune', 'Des signes d\'usure apparaissent. Réduis un peu le nombre d\'écoutes et parle à ton référent cette semaine.']
      : ['rouge', 'Tu portes trop en ce moment. Fais une pause dans les écoutes et parles-en à ton référent ou à un professionnel.'];
  return (
    <Sheet open onClose={onClose} title="Mon état d'écoutante">
      <p className="mb-3 text-sm text-muted">Sur les deux dernières semaines. 0 = jamais, 1 = parfois, 2 = souvent, 3 = presque toujours.</p>
      <div className="space-y-3">
        {SELF_CHECK.map((q, i) => (
          <div key={q}>
            <p className="mb-1 text-sm">{q}</p>
            <div className="grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map((v) => (
                <button key={v} type="button" className="chip h-9 justify-center" aria-pressed={answers[i] === v} onClick={() => setAnswers({ ...answers, [i]: v })}>{v}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {complete && (
        <div className="mt-4 border-l-4 p-3 text-sm" style={{ borderColor: `var(--${level[0]})`, background: `var(--${level[0]}-soft)` }}>
          <b className="num">{total}/18.</b> {level[1]}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Un repère personnel, pas un diagnostic. Refais-le chaque mois.</p>
    </Sheet>
  );
}
