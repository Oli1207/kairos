import { useMemo, useState } from 'react';
import { Check, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useRemove, useRows, useSave } from '../hooks/useData';
import { useAutoCheck } from '../hooks/useCheck';
import { reviewCard } from '../lib/engine';
import { today } from '../lib/dates';
import { Button, Empty, Field, IconButton, Input, Sheet, Textarea } from './ui';

const LABELS = {
  mots: { front: 'Mot', back: 'Définition', example: 'Exemple dans une phrase', empty: 'Ton carnet de mots est vide', kind: 'mots' },
  english: { front: 'Word / expression', back: 'Traduction', example: 'Example sentence', empty: 'Aucun mot anglais pour l\'instant', kind: 'anglais' },
  versets: { front: 'Référence', back: 'Texte du verset', example: 'Ce qu\'il me dit', empty: 'Aucun verset à mémoriser', kind: null },
  ecaa: { front: 'Question', back: 'Réponse', example: 'Exemple vécu', empty: 'Ajoute les questions de rappel depuis les leçons', kind: null },
  cours: { front: 'Question', back: 'Réponse attendue', example: 'Indice', empty: 'Aucune question pour ce cours', kind: null },
};

/**
 * Paquet de cartes en revision espacee (5 boites de Leitner).
 * Une bonne reponse fait monter la carte d'une boite (revue plus tard),
 * une erreur la renvoie en boite 1 (revue demain).
 */
export default function Deck({ deck, habits, scope }) {
  // scope : { course_id, chapter_id } pour les questions de rappel d'un cours.
  const L = LABELS[deck];
  const { data: cards = [] } = useRows('cards', {
    key: [deck, scope?.course_id || '', scope?.chapter_id || ''],
    build: (q) => {
      let r = q.eq('deck', deck);
      if (scope?.course_id) r = r.eq('course_id', scope.course_id);
      if (scope?.chapter_id) r = r.eq('chapter_id', scope.chapter_id);
      return r.order('created_at', { ascending: false });
    },
  });
  const save = useSave('cards');
  const remove = useRemove('cards');
  const autoCheck = useAutoCheck(habits);
  const due = useMemo(() => cards.filter((c) => c.due_on <= today()), [cards]);
  const [session, setSession] = useState(null); // { queue, i, shown, ok }
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ front: '', back: '', example: '', source: '' });

  const boxes = [1, 2, 3, 4, 5].map((b) => cards.filter((c) => c.box === b).length);

  const answer = (ok) => {
    const card = session.queue[session.i];
    save.mutate(reviewCard(card, ok));
    const next = { ...session, i: session.i + 1, shown: false, ok: session.ok + (ok ? 1 : 0) };
    if (next.i >= session.queue.length && L.kind) autoCheck(L.kind, null);
    setSession(next);
  };

  const add = (e) => {
    e.preventDefault();
    if (!form.front.trim()) return;
    save.mutate({ deck, ...(scope || {}), ...form }, { onSuccess: () => setForm({ front: '', back: '', example: '', source: '' }) });
  };

  if (session) {
    const card = session.queue[session.i];
    if (!card) {
      return (
        <div className="card p-6 text-center">
          <p className="font-display text-2xl font-extrabold">{session.ok} / {session.queue.length}</p>
          <p className="mt-1 text-sm text-muted">Les cartes ratées reviennent demain, les autres plus tard.</p>
          <Button className="mt-4" variant="secondary" onClick={() => setSession(null)}>Retour au carnet</Button>
        </div>
      );
    }
    return (
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between text-xs text-muted">
          <span>Carte {session.i + 1} / {session.queue.length}</span>
          <span>Boîte {card.box}</span>
        </div>
        <p className="text-center font-display text-3xl font-extrabold">{card.front}</p>
        {session.shown ? (
          <div className="mt-5 border-t border-line pt-4 text-center">
            <p className="text-lg">{card.back || '—'}</p>
            {card.example && <p className="mt-2 text-sm italic text-muted">« {card.example} »</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="secondary" icon={X} onClick={() => answer(false)}>À revoir</Button>
              <Button variant="ink" icon={Check} onClick={() => answer(true)}>Je savais</Button>
            </div>
          </div>
        ) : (
          <Button className="mt-6 w-full" variant="secondary" onClick={() => setSession({ ...session, shown: true })}>Voir la réponse</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between gap-3 p-4">
        <div>
          <p className="font-display text-2xl font-extrabold num">{due.length} <span className="text-base font-semibold text-muted">à réviser</span></p>
          <div className="mt-2 flex items-end gap-1" aria-label="Cartes par boîte">
            {boxes.map((n, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="w-5 bg-orange" style={{ height: 4 + Math.min(28, n * 3) }} />
                <span className="text-[0.6rem] text-muted">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button icon={RotateCcw} disabled={!due.length} onClick={() => setSession({ queue: [...due].sort(() => Math.random() - 0.5), i: 0, shown: false, ok: 0 })}>Réviser</Button>
          <Button variant="secondary" icon={Plus} onClick={() => setAdding(true)}>Ajouter</Button>
        </div>
      </div>

      {!cards.length && <Empty title={L.empty}>Ajoute ce que tu croises dans tes lectures, tes cours, tes conversations.</Empty>}
      <ul className="divide-y divide-line border-y border-line">
        {cards.map((c) => (
          <li key={c.id} className="flex items-start gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.front}</p>
              <p className="truncate text-sm text-muted">{c.back}</p>
            </div>
            <span className="chip shrink-0">B{c.box}</span>
            <IconButton icon={Trash2} label="Supprimer" onClick={() => remove.mutate(c.id)} />
          </li>
        ))}
      </ul>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Nouvelle carte">
        <form onSubmit={add} className="space-y-3">
          <Field label={L.front}><Input value={form.front} onChange={(e) => setForm({ ...form, front: e.target.value })} autoFocus /></Field>
          <Field label={L.back}><Textarea value={form.back} onChange={(e) => setForm({ ...form, back: e.target.value })} /></Field>
          <Field label={L.example}><Input value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} /></Field>
          <Field label="Source (livre, cours…)"><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
          <Button type="submit" className="w-full" loading={save.isPending}>Ajouter et continuer</Button>
        </form>
      </Sheet>
    </div>
  );
}
