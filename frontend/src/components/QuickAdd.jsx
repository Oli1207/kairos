import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Droplet, Feather, HandHeart, HeartHandshake, Lightbulb, NotebookPen, Plus, Siren, Timer } from 'lucide-react';
import { useSave } from '../hooks/useData';
import { useDayLog } from '../hooks/useDayLog';
import { addDays, today } from '../lib/dates';
import { toast } from './toast';
import { Button, Field, Input, Sheet } from './ui';

/**
 * Bouton + flottant : capturer en deux taps, ou que l'on soit dans l'app.
 * Les captures rapides s'ecrivent directement ; les actions plus longues
 * menent a leur ecran.
 */
const ACTIONS = [
  { key: 'idee', label: 'Une idée', icon: Lightbulb, tone: 'orange' },
  { key: 'mot', label: 'Un mot', icon: Feather, tone: 'orange' },
  { key: 'priere', label: 'Sujet de prière', icon: HandHeart, tone: 'rouge' },
  { key: 'devoir', label: 'Un devoir', icon: NotebookPen, tone: 'orange' },
  { key: 'eau', label: '+1 verre d\'eau', icon: Droplet, tone: 'ciel' },
  { key: 'sos', label: 'SOS envie', icon: Siren, tone: 'rouge', to: '/corps?onglet=sucre&sos=1' },
  { key: 'lecture', label: 'Pages lues', icon: BookOpen, tone: 'orange', to: '/etudes?onglet=lecture' },
  { key: 'ecoute', label: 'Après une écoute', icon: HeartHandshake, tone: 'ciel', to: '/service?onglet=ecoute' },
  { key: 'focus', label: 'Étudier', icon: Timer, tone: 'orange', to: '/etudes?onglet=plan' },
];

export default function QuickAdd() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const { log, patch } = useDayLog();
  const close = () => { setOpen(false); setForm(null); };

  const pick = (a) => {
    if (a.to) { close(); navigate(a.to); return; }
    if (a.key === 'eau') {
      const water = (log?.water || 0) + 1;
      patch({ water });
      toast(`${water} verre${water > 1 ? 's' : ''} d'eau aujourd'hui`);
      close();
      return;
    }
    setForm(a.key);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Ajouter rapidement"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-rouge text-white shadow-[0_4px_14px_rgba(23,18,14,0.35)] transition active:scale-95 md:bottom-8 md:right-8"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
      <Sheet open={open} onClose={close} title={form ? ACTIONS.find((a) => a.key === form).label : 'Ajouter rapidement'}>
        {!form && (
          <div className="grid grid-cols-3 gap-2">
            {ACTIONS.map((a) => (
              <button key={a.key} type="button" onClick={() => pick(a)} className="card flex flex-col items-center gap-2 px-1 py-4 text-center text-sm font-semibold transition active:scale-[0.97]">
                <a.icon className="h-6 w-6" style={{ color: `var(--${a.tone})` }} />
                {a.label}
              </button>
            ))}
          </div>
        )}
        {form === 'idee' && <QuickForm table="board_items" fields={[['title', 'Mon idée de contenu']]} extra={{ board: 'contenu', pillar: 'instagram', status: 'idee' }} done="Idée gardée dans Contenu" onDone={close} />}
        {form === 'mot' && <QuickForm table="cards" fields={[['front', 'Le mot'], ['back', 'Sa définition']]} extra={{ deck: 'mots' }} done="Mot ajouté à ton carnet" onDone={close} />}
        {form === 'priere' && <QuickForm table="prayer_requests" fields={[['title', 'Je prie pour…']]} extra={{}} done="Sujet ajouté" onDone={close} />}
        {form === 'devoir' && <QuickForm table="assignments" fields={[['title', 'Quoi'], ['due_on', 'À rendre le', 'date']]} extra={{ est_min: 60 }} defaults={{ due_on: addDays(today(), 7) }} done="Devoir ajouté" onDone={close} />}
      </Sheet>
    </>
  );
}

function QuickForm({ table, fields, extra, defaults = {}, done, onDone }) {
  const save = useSave(table);
  const [v, setV] = useState(() => Object.fromEntries(fields.map(([k]) => [k, defaults[k] || ''])));
  const first = fields[0][0];
  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault();
      if (!v[first].trim()) return;
      save.mutate({ ...extra, ...v, [first]: v[first].trim() }, { onSuccess: () => { toast(done); onDone(); } });
    }}>
      {fields.map(([k, label, type], i) => (
        <Field key={k} label={label}><Input type={type || 'text'} value={v[k]} autoFocus={i === 0} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></Field>
      ))}
      <Button type="submit" className="w-full" loading={save.isPending} disabled={!v[first].trim()}>Garder</Button>
    </form>
  );
}
