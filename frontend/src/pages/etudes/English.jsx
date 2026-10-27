import { useState } from 'react';
import { useRows, useSave } from '../../hooks/useData';
import { useAutoCheck } from '../../hooks/useCheck';
import { addDays, shortDate, today, weekStart } from '../../lib/dates';
import { ENGLISH_SKILLS, nextEnglishSkill } from '../../lib/engine';
import { Card, Chips, Gauge, SectionTitle, Tabs } from '../../components/ui';
import Timer from '../../components/Timer';
import Deck from '../../components/Deck';

/**
 * Anglais : 3 seances de 30 min par semaine, en tournant sur 5 competences.
 * L'app propose celle qui a ete la moins travaillee sur 4 semaines.
 */
export default function English({ habits }) {
  const { data: sessions = [] } = useRows('focus_sessions', { key: ['anglais'], build: (q) => q.eq('kind', 'anglais').gte('started_at', addDays(today(), -28)).order('started_at', { ascending: false }) });
  const save = useSave('focus_sessions');
  const autoCheck = useAutoCheck(habits);
  const [view, setView] = useState('seance');
  const { skill, count } = nextEnglishSkill(sessions);
  const [chosen, setChosen] = useState(null);
  const current = ENGLISH_SKILLS.find((s) => s.key === (chosen || skill.key));
  const habit = habits.find((h) => h.kind === 'anglais');
  const monday = weekStart();
  const thisWeek = sessions.filter((s) => s.started_at.slice(0, 10) >= monday);
  const max = Math.max(1, ...Object.values(count));

  return (
    <div className="space-y-5">
      <Card domain="etudes" className="p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">Cette semaine</h2>
          <span className="num text-muted">{thisWeek.length}/{habit?.per_week || 3} séances</span>
        </div>
        <Gauge done={thisWeek.length} target={habit?.per_week || 3} tone="orange" />
        <div className="mt-4 grid grid-cols-5 gap-2">
          {ENGLISH_SKILLS.map((s) => (
            <div key={s.key} className="text-center">
              <div className="mx-auto flex h-16 w-5 items-end bg-paper-2"><div className="w-full bg-orange" style={{ height: `${(count[s.key] / max) * 100}%` }} /></div>
              <p className="mt-1 text-[0.65rem] font-semibold">{s.label}</p>
              <p className="text-[0.6rem] text-muted num">{count[s.key]} min</p>
            </div>
          ))}
        </div>
      </Card>

      <Tabs tabs={[['seance', 'Séance'], ['mots', 'Mes mots'], ['historique', 'Historique']]} value={view} onChange={setView} />

      {view === 'seance' && (
        <div className="space-y-4">
          <div>
            <p className="field-label">Compétence</p>
            <Chips options={ENGLISH_SKILLS.map((s) => [s.key, s.key === skill.key ? `${s.label} (proposée)` : s.label])} value={current.key} onChange={(v) => setChosen(v)} />
          </div>
          <p className="border-l-4 border-orange bg-paper p-3 text-sm">{current.idea}</p>
          <Timer storageKey="anglais" minutes={habit?.duration_min || 30} label={current.label} onStop={(minutes) => save.mutate(
            { kind: 'anglais', minutes, skill: current.key },
            { onSuccess: () => { autoCheck('anglais', minutes); setChosen(null); } },
          )} />
        </div>
      )}
      {view === 'mots' && <Deck deck="english" habits={habits} />}
      {view === 'historique' && (
        <div>
          <SectionTitle>4 dernières semaines</SectionTitle>
          <ul className="divide-y divide-line border-y border-line text-sm">
            {sessions.map((s) => (
              <li key={s.id} className="flex justify-between py-2">
                <span><b>{ENGLISH_SKILLS.find((x) => x.key === s.skill)?.label || 'Anglais'}</b> · {s.minutes} min</span>
                <span className="text-muted">{shortDate(s.started_at.slice(0, 10))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
