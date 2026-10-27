import { useState } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useRows, useSave } from '../../hooks/useData';
import { useAutoCheck } from '../../hooks/useCheck';
import { addDays, shortDate, today, weekStart } from '../../lib/dates';
import { Button, Card, Field, SectionTitle, Textarea } from '../../components/ui';

/** Culture financiere : un theme par semaine, avec ses questions, son action concrete et ses notes. */
export default function Finance({ habits }) {
  const { data: weeks = [] } = useRows('finance_weeks', { build: (q) => q.order('position') });
  const save = useSave('finance_weeks');
  const autoCheck = useAutoCheck(habits);
  const monday = weekStart();
  const current = weeks.find((w) => w.week_start === monday) || weeks.find((w) => w.week_start > monday) || weeks[weeks.length - 1];
  const [selected, setSelected] = useState(null);
  const week = weeks.find((w) => w.id === selected) || current;
  const [draft, setDraft] = useState({});
  const d = draft.id === week?.id ? draft : { id: week?.id, notes: week?.notes || '', takeaways: week?.takeaways || '' };

  if (!week) return <p className="text-sm text-muted">Le programme financier apparaît après l'accueil.</p>;
  const isCurrent = week.week_start === monday;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((w) => (
          <button key={w.id} type="button" onClick={() => setSelected(w.id)}
            className={clsx('flex h-10 w-10 shrink-0 items-center justify-center border font-display font-bold num',
              w.id === week.id ? 'border-ink bg-ink text-on-ink' : 'border-line bg-paper',
              w.week_start === monday && w.id !== week.id && 'border-rouge text-rouge')}>
            {w.action_done ? <Check className="h-4 w-4" /> : w.position}
          </button>
        ))}
      </div>

      <Card domain="etudes" className="p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-orange">
          Semaine {week.position}{week.week_start ? ` · du ${shortDate(week.week_start)} au ${shortDate(addDays(week.week_start, 6))}` : ''}{isCurrent ? ' · en cours' : ''}
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold">{week.title}</h2>
        <ol className="mt-3 space-y-1.5 text-sm">
          {week.questions.map((q, i) => <li key={i} className="flex gap-2"><span className="font-bold text-orange num">{i + 1}.</span>{q}</li>)}
        </ol>
      </Card>

      <div className={clsx('border-2 p-4', week.action_done ? 'border-herbe bg-herbe-soft' : 'border-ink')}>
        <p className="text-xs font-bold uppercase tracking-wider">Action de la semaine</p>
        <p className="mt-1 font-semibold">{week.action}</p>
        <Button className="mt-3" size="sm" variant={week.action_done ? 'secondary' : 'ink'} icon={Check}
          onClick={() => save.mutate({ id: week.id, action_done: !week.action_done }, { onSuccess: () => { if (!week.action_done) autoCheck('finance', null); } })}>
          {week.action_done ? 'Fait' : 'Je l\'ai faite'}
        </Button>
      </div>

      <div className="space-y-3">
        <SectionTitle>Mes notes</SectionTitle>
        <Field label="Ce que j'apprends (sources, chiffres, exemples)"><Textarea value={d.notes} onChange={(e) => setDraft({ ...d, notes: e.target.value })} rows={6} /></Field>
        <Field label="3 choses que je retiens"><Textarea value={d.takeaways} onChange={(e) => setDraft({ ...d, takeaways: e.target.value })} rows={3} /></Field>
        <Button className="w-full" disabled={draft.id !== week.id} loading={save.isPending}
          onClick={() => save.mutate({ id: week.id, notes: d.notes, takeaways: d.takeaways }, { onSuccess: () => { setDraft({}); if (week.week_start <= today()) autoCheck('finance', d.takeaways.trim() ? null : 0); } })}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
