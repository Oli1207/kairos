import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Bell, BellOff, LifeBuoy, LogOut, Plus, Trash2 } from 'lucide-react';
import { useHabits, useProfile, useRemove, useRows, useSave, useSeason } from '../hooks/useData';
import { useAuth } from '../store/auth';
import { usePrefs } from '../store/prefs';
import { DAY_LABELS, dayShort, hhmm } from '../lib/dates';
import { DOMAINS, KINDS } from '../lib/engine';
import { currentSubscription, isIos, isStandalone, pushSupport, subscribePush, unsubscribePush } from '../lib/push';
import { Button, Card, Chips, ErrorNote, Field, IconButton, Input, SectionTitle, Select, Sheet, Textarea } from '../components/ui';
import { PageHeader } from '../components/Layout';

const WEEK = [1, 2, 3, 4, 5, 6, 0];

export default function Settings() {
  const signOut = useAuth((s) => s.signOut);
  const email = useAuth((s) => s.session?.user.email);
  return (
    <div className="space-y-8">
      <PageHeader title="Réglages" sub={email} />
      <Link to="/guide" className="card flex items-center gap-3 p-4">
        <LifeBuoy className="h-6 w-6 text-rouge" />
        <span className="flex-1"><span className="block font-display text-lg font-bold">Le guide de Kairos</span><span className="block text-sm text-muted">Le didacticiel complet, et la visite d'accueil.</span></span>
      </Link>
      <Notifications />
      <Habits />
      <Timetable />
      <Profile />
      <SeasonEdit />
      <Theme />
      <Button variant="secondary" icon={LogOut} className="w-full" onClick={signOut}>Se déconnecter</Button>
    </div>
  );
}

function Notifications() {
  const [sub, setSub] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const support = pushSupport();
  useEffect(() => { currentSubscription().then(setSub).catch(() => {}); }, []);
  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (sub) { await unsubscribePush(); setSub(null); } else setSub(await subscribePush());
    } catch (e) { setError(e); }
    setBusy(false);
  };
  return (
    <section>
      <SectionTitle>Rappels</SectionTitle>
      <Card domain="esprit" className="p-4">
        <p className="text-sm">À l'heure exacte de chaque rendez-vous, puis une relance si rien n'est pointé après la marge de grâce. Aussi : rupture du jeûne, bilan du soir avant le coucher, bilan du dimanche.</p>
        {support.ok ? (
          <Button className="mt-3" variant={sub ? 'secondary' : 'primary'} icon={sub ? BellOff : Bell} loading={busy} onClick={toggle}>
            {sub ? 'Couper les rappels sur cet appareil' : 'Activer les rappels'}
          </Button>
        ) : <p className="mt-3 border-l-4 border-jaune bg-jaune-soft px-3 py-2 text-sm">{support.reason}</p>}
        <ErrorNote error={error} />
        {isIos() && !isStandalone() && (
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Ouvre Kairos dans Safari.</li>
            <li>Touche le bouton Partager (carré avec une flèche).</li>
            <li>Choisis « Sur l'écran d'accueil ».</li>
            <li>Ouvre Kairos depuis la nouvelle icône, puis reviens ici.</li>
          </ol>
        )}
      </Card>
    </section>
  );
}

function Habits() {
  const { data: habits = [] } = useHabits();
  const [editing, setEditing] = useState(null);
  return (
    <section>
      <SectionTitle action={<Button size="sm" icon={Plus} onClick={() => setEditing({})}>Ajouter</Button>}>Ma règle de vie</SectionTitle>
      {Object.entries(DOMAINS).map(([key, d]) => {
        const list = habits.filter((h) => h.domain === key);
        if (!list.length) return null;
        return (
          <div key={key} className="mb-3">
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wider" style={{ color: `var(--${d.color})` }}>{d.label}</h3>
            <ul className="divide-y divide-line border-y border-line">
              {list.map((h) => (
                <li key={h.id}>
                  <button type="button" className="flex w-full items-center justify-between gap-2 py-2.5 text-left" onClick={() => setEditing(h)}>
                    <span className="font-semibold">{h.title}{h.sacred && <span className="ml-1.5 text-[0.6rem] font-bold uppercase text-rouge">sacré</span>}</span>
                    <span className="shrink-0 text-sm text-muted">{describe(h)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {editing && <HabitSheet habit={editing} onClose={() => setEditing(null)} count={habits.length} />}
    </section>
  );
}

function describe(h) {
  if (h.schedule === 'fixe') {
    const days = h.days.length === 7 ? 'tous les jours' : WEEK.filter((d) => h.days.includes(d)).map(dayShort).join(' ');
    return `${hhmm(h.at_time)} · ${days}`;
  }
  if (h.schedule === 'hebdo') return `${h.per_week_min && h.per_week_min !== h.per_week ? `${h.per_week_min} à ` : ''}${h.per_week}×/sem · ${h.duration_min} min`;
  return `chaque jour${h.duration_min ? ` · ${h.duration_min} min` : ''}`;
}

function HabitSheet({ habit, onClose, count }) {
  const save = useSave('habits');
  const [f, setF] = useState({
    title: '', domain: 'esprit', kind: 'libre', schedule: 'fixe', at_time: '06:00', days: [0, 1, 2, 3, 4, 5, 6], per_week: 3, per_week_min: 2,
    duration_min: 20, full_version: '', light_version: '', sacred: false, grace_min: 15, notify: true, ...habit,
  });
  const set = (k, v) => setF({ ...f, [k]: v });
  const submit = () => {
    const { id, title, domain, kind, schedule, at_time, days, per_week, per_week_min, duration_min, full_version, light_version, sacred, grace_min, notify } = f;
    const row = {
      title: title.trim(), domain, kind, schedule, days, duration_min: Number(duration_min) || 0, full_version, light_version, sacred, notify,
      grace_min: Number(grace_min) || 15,
      at_time: schedule === 'fixe' ? at_time : null,
      per_week: schedule === 'hebdo' ? Number(per_week) || 1 : null,
      per_week_min: schedule === 'hebdo' ? Number(per_week_min) || Number(per_week) || 1 : null,
    };
    save.mutate(id ? { id, ...row } : { ...row, position: count + 1 }, { onSuccess: onClose });
  };
  return (
    <Sheet open onClose={onClose} title={habit.id ? habit.title : 'Nouvelle habitude'}>
      <div className="space-y-3">
        <Field label="Titre"><Input value={f.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Domaine"><Select value={f.domain} onChange={(e) => set('domain', e.target.value)} options={Object.entries(DOMAINS).map(([k, d]) => [k, d.label])} /></Field>
          <Field label="Type" hint="Relie l'habitude à son module."><Select value={f.kind} onChange={(e) => set('kind', e.target.value)} options={KINDS} /></Field>
        </div>
        <Field label="Rythme">
          <Chips options={[['fixe', 'Heure fixe'], ['quotidien', 'Chaque jour'], ['hebdo', 'X fois / semaine']]} value={f.schedule} onChange={(v) => v && set('schedule', v)} />
        </Field>
        {f.schedule === 'fixe' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Heure"><Input type="time" value={hhmm(f.at_time)} onChange={(e) => set('at_time', e.target.value)} /></Field>
            <Field label="Marge de grâce (min)"><Input type="number" min={0} value={f.grace_min} onChange={(e) => set('grace_min', e.target.value)} /></Field>
          </div>
        )}
        {f.schedule !== 'hebdo' && (
          <Field label="Jours">
            <div className="flex gap-1">
              {WEEK.map((d) => (
                <button key={d} type="button" className="chip flex-1 justify-center" aria-pressed={f.days.includes(d)}
                  onClick={() => set('days', f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d])}>{dayShort(d)}</button>
              ))}
            </div>
          </Field>
        )}
        {f.schedule === 'hebdo' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum / semaine"><Input type="number" min={1} value={f.per_week_min ?? ''} onChange={(e) => set('per_week_min', e.target.value)} /></Field>
            <Field label="Idéal / semaine"><Input type="number" min={1} value={f.per_week ?? ''} onChange={(e) => set('per_week', e.target.value)} /></Field>
          </div>
        )}
        <Field label="Durée (min)"><Input type="number" min={0} value={f.duration_min} onChange={(e) => set('duration_min', e.target.value)} /></Field>
        <Field label="Version complète"><Textarea rows={2} value={f.full_version} onChange={(e) => set('full_version', e.target.value)} /></Field>
        {!f.sacred && <Field label="Version légère" hint="Ce qui compte quand l'énergie est basse. Jamais zéro."><Textarea rows={2} value={f.light_version} onChange={(e) => set('light_version', e.target.value)} /></Field>}
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-[var(--rouge)]" checked={f.sacred} onChange={(e) => set('sacred', e.target.checked)} /> Sacré : jamais de version légère</label>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-[var(--rouge)]" checked={f.notify} onChange={(e) => set('notify', e.target.checked)} /> Me rappeler à l'heure</label>
        <Button className="w-full" disabled={!f.title.trim() || (f.schedule !== 'hebdo' && !f.days.length)} loading={save.isPending} onClick={submit}>Enregistrer</Button>
        {habit.id && (
          <Button variant="ghost" icon={Archive} className="w-full" onClick={() => save.mutate({ id: habit.id, archived: true }, { onSuccess: onClose })}>Archiver (l'historique est gardé)</Button>
        )}
      </div>
    </Sheet>
  );
}

function Timetable() {
  const { data: blocks = [] } = useRows('schedule_blocks', { build: (q) => q.order('weekday').order('start_time') });
  const save = useSave('schedule_blocks');
  const remove = useRemove('schedule_blocks');
  const [f, setF] = useState(null);
  return (
    <section>
      <SectionTitle action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setF({ title: '', weekday: 1, start_time: '08:00', end_time: '10:00', location: '' })}>Cours</Button>}>Mon emploi du temps</SectionTitle>
      <p className="mb-2 text-sm text-muted">Tes cours et engagements réguliers. Kairos s'en sert pour trouver tes créneaux libres.</p>
      {WEEK.map((d) => {
        const list = blocks.filter((b) => b.weekday === d);
        if (!list.length) return null;
        return (
          <div key={d} className="mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{DAY_LABELS[d]}</h3>
            <ul className="divide-y divide-line border-b border-line">
              {list.map((b) => (
                <li key={b.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="w-24 num">{hhmm(b.start_time)}–{hhmm(b.end_time)}</span>
                  <span className="flex-1 font-semibold">{b.title}{b.location && <span className="font-normal text-muted"> · {b.location}</span>}</span>
                  <IconButton icon={Trash2} label="Supprimer" className="h-8 w-8" onClick={() => remove.mutate(b.id)} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {f && (
        <Sheet open onClose={() => setF(null)} title="Nouveau créneau">
          <div className="space-y-3">
            <Field label="Intitulé"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Droit civil, travail, répétition…" /></Field>
            <Field label="Jour"><Select value={String(f.weekday)} onChange={(e) => setF({ ...f, weekday: Number(e.target.value) })} options={WEEK.map((d) => [String(d), DAY_LABELS[d]])} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Début"><Input type="time" value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} /></Field>
              <Field label="Fin"><Input type="time" value={f.end_time} onChange={(e) => setF({ ...f, end_time: e.target.value })} /></Field>
            </div>
            <Field label="Lieu"><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
            <Button className="w-full" disabled={!f.title.trim() || f.end_time <= f.start_time} onClick={() => save.mutate(f, { onSuccess: () => setF((x) => ({ ...x, title: '' })) })}>
              Ajouter (et en saisir un autre)
            </Button>
          </div>
        </Sheet>
      )}
    </section>
  );
}

function Profile() {
  const { data: profile } = useProfile();
  const save = useSave('profiles');
  const [f, setF] = useState(null);
  if (!profile) return null;
  const v = f || { display_name: profile.display_name, wake_time: hhmm(profile.wake_time), bed_time: hhmm(profile.bed_time) };
  return (
    <section>
      <SectionTitle>Mon rythme</SectionTitle>
      <div className="space-y-3">
        <Field label="Prénom"><Input value={v.display_name} onChange={(e) => setF({ ...v, display_name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Réveil"><Input type="time" value={v.wake_time} onChange={(e) => setF({ ...v, wake_time: e.target.value })} /></Field>
          <Field label="Coucher"><Input type="time" value={v.bed_time} onChange={(e) => setF({ ...v, bed_time: e.target.value })} /></Field>
        </div>
        {f && <Button onClick={() => save.mutate({ id: profile.id, ...v }, { onSuccess: () => setF(null) })}>Enregistrer</Button>}
      </div>
    </section>
  );
}

function SeasonEdit() {
  const { data: [season] = [] } = useSeason();
  const save = useSave('seasons');
  const [f, setF] = useState(null);
  if (!season) return null;
  const v = f || season;
  return (
    <section>
      <SectionTitle>Ma saison</SectionTitle>
      <div className="space-y-3">
        <Field label="Nom"><Input value={v.title} onChange={(e) => setF({ ...v, title: e.target.value })} /></Field>
        <Field label="Intention"><Textarea rows={2} value={v.intention} onChange={(e) => setF({ ...v, intention: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début"><Input type="date" value={v.starts_on} onChange={(e) => setF({ ...v, starts_on: e.target.value })} /></Field>
          <Field label="Fin"><Input type="date" value={v.ends_on} onChange={(e) => setF({ ...v, ends_on: e.target.value })} /></Field>
        </div>
        {f && <Button onClick={() => save.mutate({ id: season.id, title: v.title, intention: v.intention, starts_on: v.starts_on, ends_on: v.ends_on }, { onSuccess: () => setF(null) })}>Enregistrer</Button>}
      </div>
    </section>
  );
}

function Theme() {
  const { theme, setTheme } = usePrefs();
  return (
    <section>
      <SectionTitle>Apparence</SectionTitle>
      <Chips options={[['light', 'Ciel (jour)'], ['dark', 'Pagne (nuit)'], ['auto', 'Comme le téléphone']]} value={theme} onChange={(v) => v && setTheme(v)} />
    </section>
  );
}
