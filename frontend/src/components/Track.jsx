import { useState } from 'react';
import { BookCheck, Check, ChevronRight, Clock, Layers } from 'lucide-react';
import { useRows, useSave } from '../hooks/useData';
import { useToast } from './toast';
import { Button, Card, Field, Sheet, Textarea } from './ui';
import Soleil from './Soleil';
import Deck from './Deck';

/**
 * Parcours de formation : des lecons livrees avec l'app, et pour chacune la
 * progression, les notes et la mise en pratique gardees en base. Les questions
 * de rappel de chaque lecon peuvent rejoindre un paquet de cartes (revision espacee).
 */
export default function Track({ track, lessons, deck, tone = 'ciel', habits }) {
  const { data: progress = [] } = useRows('lesson_progress', { key: [track], build: (q) => q.eq('track', track) });
  const save = useSave('lesson_progress', { onConflict: 'user_id,track,lesson' });
  const saveCard = useSave('cards');
  const toast = useToast();
  const [open, setOpen] = useState(null);
  const [cards, setCards] = useState(false);
  const state = (key) => progress.find((p) => p.lesson === key);
  const done = lessons.filter((l) => state(l.key)?.done).length;
  const next = lessons.find((l) => !state(l.key)?.done);

  const addRecall = (lesson) => {
    lesson.recall.forEach(([front, back]) => saveCard.mutate({ deck, front, back, source: lesson.title }));
    toast(`${lesson.recall.length} carte${lesson.recall.length > 1 ? 's' : ''} ajoutée${lesson.recall.length > 1 ? 's' : ''} à tes révisions`);
  };

  if (cards) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setCards(false)}>← Retour au parcours</Button>
        <Deck deck={deck} habits={habits} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-4 p-4" style={{ borderTop: `3px solid var(--${tone})` }}>
        <Soleil value={done / lessons.length} size={84} petals={lessons.length} tones={[tone, 'jaune']}>
          <span className="text-xs font-bold num">{done}/{lessons.length}</span>
        </Soleil>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: `var(--${tone})` }}>Ma formation</p>
          <p className="font-display text-lg font-bold leading-tight">{next ? `Prochaine leçon : ${next.title}` : 'Parcours terminé. Bravo.'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {next && <Button size="sm" onClick={() => setOpen(next)}>Continuer</Button>}
            <Button size="sm" variant="secondary" icon={Layers} onClick={() => setCards(true)}>Mes cartes</Button>
          </div>
        </div>
      </Card>

      <ol className="divide-y divide-line border-y border-line">
        {lessons.map((l, i) => {
          const s = state(l.key);
          return (
            <li key={l.key}>
              <button type="button" className="flex w-full items-center gap-3 py-3 text-left" onClick={() => setOpen(l)}>
                <span className="check h-8 w-8 font-display text-sm font-bold" data-state={s?.done ? 'fait' : undefined}>
                  {s?.done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{l.title}</span>
                  <span className="block truncate text-sm text-muted">{l.goal}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted"><Clock className="h-3.5 w-3.5" />{l.minutes}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
              </button>
            </li>
          );
        })}
      </ol>

      {open && (
        <Lesson
          key={open.key}
          lesson={open}
          state={state(open.key)}
          index={lessons.indexOf(open)}
          tone={tone}
          onClose={() => setOpen(null)}
          onRecall={() => addRecall(open)}
          onSave={(fields, close) => save.mutate({ track, lesson: open.key, updated_at: new Date().toISOString(), ...fields }, {
            onSuccess: () => {
              if (fields.done) toast('Leçon terminée');
              if (close) {
                const following = lessons[lessons.indexOf(open) + 1];
                setOpen(fields.done && following ? following : null);
              }
            },
          })}
        />
      )}
    </div>
  );
}

function Lesson({ lesson, state, index, tone, onClose, onSave, onRecall }) {
  const [notes, setNotes] = useState(state?.notes || '');
  const [practice, setPractice] = useState(state?.practice || '');
  return (
    <Sheet open onClose={onClose} title={`Leçon ${index + 1}`} wide>
      <div key={lesson.key} className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-extrabold leading-tight">{lesson.title}</h2>
          <p className="mt-1 text-sm font-semibold" style={{ color: `var(--${tone})` }}>Objectif : {lesson.goal}</p>
        </div>
        <ol className="space-y-3">
          {lesson.points.map((p, i) => (
            <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed">
              <span className="mt-0.5 font-display font-extrabold num" style={{ color: `var(--${tone})` }}>{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
        <div className="border-l-4 bg-paper-2 p-3" style={{ borderColor: `var(--${tone})` }}>
          <p className="text-xs font-bold uppercase tracking-wider">À pratiquer cette semaine</p>
          <p className="mt-1 text-sm">{lesson.practice}</p>
        </div>
        <Field label="Ce que j'ai mis en pratique"><Textarea rows={3} value={practice} onChange={(e) => setPractice(e.target.value)} /></Field>
        <Field label="Réflexion personnelle" hint={lesson.reflect}><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        {lesson.recall?.length > 0 && (
          <div className="card p-3">
            <p className="text-sm font-semibold">{lesson.recall.length} question{lesson.recall.length > 1 ? 's' : ''} de rappel</p>
            <p className="text-xs text-muted">Se tester fixe mieux que relire. Elles reviendront à J+1, J+2, J+4…</p>
            <Button className="mt-2" size="sm" variant="secondary" icon={BookCheck} onClick={onRecall}>Ajouter à mes cartes</Button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => onSave({ notes, practice, done: state?.done || false }, true)}>Enregistrer</Button>
          <Button variant="ink" icon={Check} onClick={() => onSave({ notes, practice, done: true }, true)}>{state?.done ? 'Leçon suivante' : 'Terminer la leçon'}</Button>
        </div>
      </div>
    </Sheet>
  );
}
