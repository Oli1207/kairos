import { useEffect, useState } from 'react';
import { Lightbulb, Timer as TimerIcon } from 'lucide-react';
import { useProfile, useRows, useSave } from '../../hooks/useData';
import { useAutoCheck } from '../../hooks/useCheck';
import { addDays, today, toTime, weekStart } from '../../lib/dates';
import { freeSlots } from '../../lib/engine';
import { CONTENT_PLATFORMS } from '../../data/contenus';
import { Button, Card, Input, SectionTitle, Sheet } from '../../components/ui';
import Board from '../../components/Board';
import Timer from '../../components/Timer';

const PILLARS = CONTENT_PLATFORMS.map((p) => [p.toLowerCase(), p]);

/**
 * Creation de contenu, pensee contre le manque de temps : capturer une idee en
 * 5 secondes, montrer les vrais trous de la journee, travailler par micro-creneaux.
 */
export default function Content({ habits, openIdea }) {
  const { data: profile } = useProfile();
  const { data: blocks = [] } = useRows('schedule_blocks');
  const monday = weekStart();
  const { data: planned = [] } = useRows('planned_sessions', { key: [monday], build: (q) => q.gte('day', monday).lte('day', addDays(monday, 6)) });
  const save = useSave('board_items');
  const saveSession = useSave('focus_sessions');
  const autoCheck = useAutoCheck(habits);
  const [idea, setIdea] = useState('');
  const [capture, setCapture] = useState(openIdea);
  const [micro, setMicro] = useState(false);
  useEffect(() => { if (openIdea) setCapture(true); }, [openIdea]);

  const slots = freeSlots(today(), { blocks, habits, planned }, profile, 15);
  const free = slots.reduce((s, [a, b]) => s + (b - a), 0);

  const quickSave = () => {
    if (!idea.trim()) return;
    save.mutate({ board: 'contenu', pillar: 'instagram', title: idea.trim(), status: 'idee' }, { onSuccess: () => { setIdea(''); setCapture(false); } });
  };

  return (
    <div className="space-y-5">
      <Card domain="etudes" className="p-4">
        <p className="font-display text-xl font-bold">
          {free >= 15 ? `Tu as encore ${Math.floor(free / 60) ? `${Math.floor(free / 60)} h ` : ''}${free % 60} min libres aujourd'hui.` : 'Journée pleine : note juste tes idées.'}
        </p>
        {slots.length > 0 && <p className="mt-1 text-sm text-muted">Créneaux : {slots.slice(0, 4).map(([a, b]) => `${toTime(a)}–${toTime(b)}`).join(', ')}</p>}
        <p className="mt-2 text-sm">15 minutes suffisent pour avancer une idée : un plan, un brouillon, une photo, une légende.</p>
        <div className="mt-3 flex gap-2">
          <Button icon={Lightbulb} onClick={() => setCapture(true)}>Noter une idée</Button>
          <Button variant="secondary" icon={TimerIcon} onClick={() => setMicro(true)}>Micro-créneau 15 min</Button>
        </div>
      </Card>

      <div>
        <SectionTitle>Mon pipeline</SectionTitle>
        <Board board="contenu" pillars={PILLARS} tone="orange" />
      </div>

      <Sheet open={capture} onClose={() => setCapture(false)} title="Une idée, vite">
        <form onSubmit={(e) => { e.preventDefault(); quickSave(); }} className="space-y-3">
          <Input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ex. : vidéo « 3 versets pour les jours sans force »" autoFocus />
          <Button type="submit" className="w-full" disabled={!idea.trim()}>Garder l'idée</Button>
          <p className="text-xs text-muted">Elle arrive dans la colonne « Idées ». Tu la trieras pendant un micro-créneau.</p>
        </form>
      </Sheet>

      <Sheet open={micro} onClose={() => setMicro(false)} title="Micro-créneau">
        <Timer storageKey="contenu" minutes={15} onStop={(minutes) => saveSession.mutate({ kind: 'contenu', minutes }, { onSuccess: () => { autoCheck('contenu', minutes); setMicro(false); } })} />
      </Sheet>
    </div>
  );
}
