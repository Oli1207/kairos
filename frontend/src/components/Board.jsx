import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Plus, Trash2 } from 'lucide-react';
import { useRemove, useRows, useSave } from '../hooks/useData';
import { diffDays, shortDate, today } from '../lib/dates';
import { BOARD_STATUSES } from '../data/contenus';
import { SAFE_POST_CHECKLIST } from '../data/ecaa';
import { Button, Chips, Field, IconButton, Input, Select, Sheet, Textarea } from './ui';

/**
 * Pipeline idee -> en cours -> pret -> fait. Sert au tableau ECAA (piliers :
 * posts, activisme, programme) et a la creation de contenu (piliers : plateformes).
 */
export default function Board({ board, pillars, tone = 'ciel', draft, onDraftUsed }) {
  const { data: items = [] } = useRows('board_items', { key: [board], build: (q) => q.eq('board', board).order('position').order('created_at') });
  const save = useSave('board_items');
  const remove = useRemove('board_items');
  const [pillar, setPillar] = useState(null);
  const [editing, setEditing] = useState(null);
  const shown = items.filter((i) => !pillar || i.pillar === pillar);
  const upcoming = items.filter((i) => i.due_on && i.status !== 'fait' && diffDays(i.due_on, today()) <= 14)
    .sort((a, b) => (a.due_on < b.due_on ? -1 : 1));

  const move = (item, dir) => {
    const idx = BOARD_STATUSES.findIndex(([k]) => k === item.status) + dir;
    if (idx >= 0 && idx < BOARD_STATUSES.length) save.mutate({ id: item.id, status: BOARD_STATUSES[idx][0] });
  };

  const sheetItem = editing || (draft ? { board, pillar: draft.pillar || pillars[0][0], title: draft.title || '', details: draft.details || '', due_on: draft.due_on || null, status: 'idee' } : null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Chips options={pillars} value={pillar} onChange={setPillar} />
        <Button size="sm" icon={Plus} onClick={() => setEditing({ board, pillar: pillar || pillars[0][0], title: '', details: '', status: 'idee', due_on: null })}>Ajouter</Button>
      </div>

      {upcoming.length > 0 && (
        <div className="border-l-4 bg-paper p-3" style={{ borderColor: `var(--${tone})` }}>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><CalendarDays className="h-3.5 w-3.5" /> 14 prochains jours</p>
          <ul className="text-sm">
            {upcoming.map((i) => (
              <li key={i.id} className="flex justify-between gap-2 py-0.5">
                <span className="truncate">{i.title}</span>
                <span className={diffDays(i.due_on, today()) < 0 ? 'shrink-0 font-semibold text-rouge' : 'shrink-0 text-muted'}>{shortDate(i.due_on)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4 md:gap-3">
        {BOARD_STATUSES.map(([status, label], col) => {
          const list = shown.filter((i) => i.status === status);
          return (
            <div key={status}>
              <h3 className="mb-1.5 flex items-center justify-between border-b-2 border-ink pb-1 text-sm font-bold uppercase tracking-wider">
                {label}<span className="num text-muted">{list.length}</span>
              </h3>
              <ul className="space-y-1.5">
                {list.map((i) => (
                  <li key={i.id} className="card p-2.5">
                    <button type="button" className="block w-full text-left" onClick={() => setEditing(i)}>
                      <p className="text-sm font-semibold leading-snug">{i.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {pillars.find(([k]) => k === i.pillar)?.[1]}{i.due_on && ` · ${shortDate(i.due_on)}`}
                      </p>
                    </button>
                    <div className="mt-1.5 flex justify-end gap-1">
                      {col > 0 && <IconButton icon={ArrowLeft} label="Reculer" className="h-8 w-8" onClick={() => move(i, -1)} />}
                      {col < BOARD_STATUSES.length - 1 && <IconButton icon={ArrowRight} label="Avancer" className="h-8 w-8" onClick={() => move(i, 1)} />}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <ItemSheet
        item={sheetItem}
        pillars={pillars}
        onClose={() => { setEditing(null); onDraftUsed?.(); }}
        onSave={(row) => save.mutate(row, { onSuccess: () => { setEditing(null); onDraftUsed?.(); } })}
        onDelete={(id) => remove.mutate(id, { onSuccess: () => setEditing(null) })}
      />
    </div>
  );
}

function ItemSheet({ item, pillars, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  if (!item) return null;
  const f = form?.key === (item.id || 'new') ? form : { key: item.id || 'new', ...item };
  const set = (k) => (e) => setForm({ ...f, [k]: e.target.value || null });
  const submit = () => {
    const { key, created_at, user_id, ...row } = f; // eslint-disable-line no-unused-vars
    onSave({ ...row, title: (row.title || '').trim(), details: row.details || '' });
    setForm(null);
  };
  return (
    <Sheet open onClose={() => { setForm(null); onClose(); }} title={item.id ? 'Modifier' : 'Nouvel élément'}>
      <div className="space-y-3">
        <Field label="Titre"><Input value={f.title || ''} onChange={set('title')} autoFocus={!item.id} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pilier"><Select value={f.pillar} onChange={set('pillar')} options={pillars} /></Field>
          <Field label="Échéance"><Input type="date" value={f.due_on || ''} onChange={set('due_on')} /></Field>
        </div>
        <Field label="Statut"><Select value={f.status} onChange={set('status')} options={BOARD_STATUSES} /></Field>
        <Field label="Détails, plan, texte"><Textarea value={f.details || ''} onChange={set('details')} rows={5} /></Field>
        {f.board === 'ecaa' && f.pillar === 'posts' && <SafeChecklist />}
        <Button className="w-full" disabled={!(f.title || '').trim()} onClick={submit}>Enregistrer</Button>
        {item.id && <Button variant="ghost" icon={Trash2} className="w-full" onClick={() => onDelete(item.id)}>Supprimer</Button>}
      </div>
    </Sheet>
  );
}

/** Avant de publier sur la sante mentale : les regles de communication sure. */
function SafeChecklist() {
  const [checked, setChecked] = useState([]);
  const all = checked.length === SAFE_POST_CHECKLIST.length;
  return (
    <div className="border-l-4 bg-paper-2 p-3" style={{ borderColor: all ? 'var(--herbe)' : 'var(--orange)' }}>
      <p className="text-xs font-bold uppercase tracking-wider">Communication sûre — avant de publier</p>
      <ul className="mt-2 space-y-1.5">
        {SAFE_POST_CHECKLIST.map((item, i) => (
          <li key={item}>
            <label className="flex gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--herbe)]" checked={checked.includes(i)}
                onChange={(e) => setChecked(e.target.checked ? [...checked, i] : checked.filter((x) => x !== i))} />
              {item}
            </label>
          </li>
        ))}
      </ul>
      {all && <p className="mt-2 text-sm font-semibold text-herbe">Prêt à publier en sécurité.</p>}
    </div>
  );
}
