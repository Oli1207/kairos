import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { supabase, unwrap } from '../lib/supabase';
import { addDays, today } from '../lib/dates';
import { Button, ErrorNote, Field, Input, Textarea } from '../components/ui';
import { Lisiere, MiniSoleil } from '../components/Soleil';

function defaultSeason() {
  const t = today();
  const year = Number(t.slice(0, 4));
  // Avant novembre : la saison Novembre–Decembre. Sinon, 8 semaines a partir d'aujourd'hui.
  if (t < `${year}-11-01`) return { start: `${year}-11-01`, end: `${year}-12-31`, title: 'Novembre – Décembre' };
  return { start: t, end: addDays(t, 55), title: 'Ma saison' };
}

const TEMPLATES = [
  {
    key: 'reprise',
    title: 'Saison de reprise',
    text: 'Méditation, prière et intercession à heures fixes, jeûne, ECAA, sport 2 à 3 fois, stop sucre et sel, études quotidiennes, lecture, vocabulaire, anglais 3 × 30 min, prise de parole, culture financière, contenu.',
  },
  { key: 'vide', title: 'Partir de zéro', text: 'Seulement le programme de culture financière. Tu crées tes rendez-vous toi-même dans les réglages.' },
];

export default function Onboarding({ profile }) {
  const qc = useQueryClient();
  const season = defaultSeason();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: profile.display_name || '',
    wake: '05:00',
    bed: '22:30',
    template: 'reprise',
    title: season.title,
    intention: '',
    start: season.start,
    end: season.end,
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      unwrap(await supabase.from('profiles').update({
        display_name: form.name.trim(),
        wake_time: form.wake,
        bed_time: form.bed,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Abidjan',
      }).eq('id', profile.id));
      unwrap(await supabase.rpc('start_season', {
        p_template: form.template, p_title: form.title, p_intention: form.intention, p_start: form.start, p_end: form.end,
      }));
      // Le modele a ancre le coucher a 22h30 : on l'aligne sur son heure a elle.
      await supabase.from('habits').update({ at_time: form.bed }).eq('kind', 'coucher');
      await qc.invalidateQueries();
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Lisiere />
      <div className="mx-auto max-w-lg px-5 pb-12 pt-[calc(env(safe-area-inset-top)+2rem)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <MiniSoleil size={22} /> Étape {step + 1} sur 3
        </div>

        {step === 0 && (
          <div className="mt-6 space-y-4">
            <h1 className="font-display text-4xl font-extrabold leading-none">Bienvenue{form.name ? `, ${form.name}` : ''}.</h1>
            <p className="text-muted">Kairos s'organise autour de ton rythme. Tes heures de réveil et de coucher servent à trouver tes créneaux libres et à protéger ton sommeil.</p>
            <Field label="Prénom"><Input value={form.name} onChange={set('name')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Réveil"><Input type="time" value={form.wake} onChange={set('wake')} /></Field>
              <Field label="Coucher"><Input type="time" value={form.bed} onChange={set('bed')} /></Field>
            </div>
            <Button size="lg" className="w-full" disabled={!form.name.trim()} onClick={() => setStep(1)}>Continuer</Button>
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 space-y-3">
            <h1 className="font-display text-4xl font-extrabold leading-none">Par où commencer ?</h1>
            <p className="text-muted">Tout reste modifiable ensuite : heures, fréquences, titres.</p>
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setForm({ ...form, template: t.key })}
                className={clsx('card block w-full p-4 text-left transition', form.template === t.key && 'border-ink ring-2 ring-ink')}
              >
                <span className="font-display text-xl font-bold">{t.title}</span>
                <span className="mt-1 block text-sm text-muted">{t.text}</span>
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" size="lg" onClick={() => setStep(0)}>Retour</Button>
              <Button size="lg" className="flex-1" onClick={() => setStep(2)}>Continuer</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <h1 className="font-display text-4xl font-extrabold leading-none">Ta saison</h1>
            <p className="text-muted">Une période avec un début et une fin. Assez courte pour rester concrète, assez longue pour changer quelque chose.</p>
            <Field label="Nom de la saison"><Input value={form.title} onChange={set('title')} /></Field>
            <Field label="Mon intention" hint="Une phrase à relire les jours difficiles.">
              <Textarea value={form.intention} onChange={set('intention')} placeholder="Revenir à l'essentiel : Dieu d'abord, et prendre soin de moi." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Début"><Input type="date" value={form.start} onChange={set('start')} /></Field>
              <Field label="Fin"><Input type="date" value={form.end} onChange={set('end')} /></Field>
            </div>
            <ErrorNote error={error} />
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" size="lg" onClick={() => setStep(1)}>Retour</Button>
              <Button size="lg" className="flex-1" loading={busy} onClick={finish}>Ouvrir ma saison</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
