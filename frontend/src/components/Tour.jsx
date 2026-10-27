import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Plus, Share } from 'lucide-react';
import { TOUR } from '../data/guide';
import { useScrollLock } from '../hooks/useScrollLock';
import Soleil, { Lisiere, MiniSoleil } from './Soleil';

const KEY = 'kairos-tour-v1';
export const tourSeen = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ } };

/** Visite d'accueil : 9 ecrans a faire defiler du doigt, rejouable depuis le guide. */
export default function Tour({ onClose }) {
  const [i, setI] = useState(0);
  const from = useRef(null);
  const slide = TOUR[i];
  const last = i === TOUR.length - 1;
  const go = (n) => setI(Math.max(0, Math.min(TOUR.length - 1, n)));
  const close = () => { markSeen(); onClose(); };
  useScrollLock();

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-sky"
      onPointerDown={(e) => { from.current = e.clientX; }}
      onPointerUp={(e) => { if (from.current == null) return; const d = e.clientX - from.current; from.current = null; if (d < -50) go(i + 1); if (d > 50) go(i - 1); }}
    >
      <Lisiere />
      <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <span className="text-sm font-semibold text-muted num">{i + 1}/{TOUR.length}</span>
        <button type="button" className="text-sm font-semibold text-muted" onClick={close}>Passer</button>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
        <div key={slide.key} className="fade-in">
          <div className="mb-8 flex h-48 items-center justify-center"><Art kind={slide.art} /></div>
          <h2 className="font-display text-3xl font-extrabold leading-tight">{slide.title}</h2>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">{slide.text}</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <div className="mb-4 flex justify-center gap-1.5">
          {TOUR.map((s, k) => (
            <button key={s.key} type="button" aria-label={`Écran ${k + 1}`} onClick={() => go(k)} className="h-1.5 transition-all" style={{ width: k === i ? 22 : 8, background: k === i ? 'var(--rouge)' : 'var(--line)' }} />
          ))}
        </div>
        <div className="flex gap-2">
          {i > 0 && <button type="button" className="btn btn-secondary btn-lg" onClick={() => go(i - 1)}>Retour</button>}
          <button type="button" className="btn btn-primary btn-lg flex-1" onClick={() => (last ? close() : go(i + 1))}>{last ? 'Commencer ma saison' : 'Suivant'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Petites illustrations faites avec les briques de l'app elle-meme. */
function Art({ kind }) {
  if (kind === 'soleil') return <Soleil value={0.7} size={170} petals={24} tones={['rouge', 'orange', 'jaune']}><MiniSoleil size={40} /></Soleil>;
  if (kind === 'frise') {
    return (
      <div className="w-full max-w-xs border-l-2 border-ink">
        {[['05:30', 'Méditation', 'fait'], ['06:00', 'Prière', 'retard'], ['now'], ['17:30', 'Sport', null]].map(([t, l, s]) => (t === 'now'
          ? <div key="n" className="-ml-[5px] flex items-center gap-2 py-1"><span className="h-2 w-2 rounded-full bg-rouge" /><span className="h-px flex-1 bg-rouge" /><span className="text-[0.6rem] font-bold text-rouge">MAINTENANT</span></div>
          : (
            <div key={t} className="flex items-center gap-3 py-2 pl-3">
              <span className="w-10 text-sm font-bold num">{t}</span>
              <span className="flex-1 font-semibold">{l}</span>
              <span className="check h-8 w-8" data-state={s || undefined}>{s && <Check className="h-4 w-4" strokeWidth={3} />}</span>
            </div>
          )))}
      </div>
    );
  }
  if (kind === 'leger') {
    return (
      <div className="w-full max-w-xs space-y-2">
        <div className="flex gap-1.5"><span className="chip">Jour plein</span><span className="chip" aria-pressed="true">Jour léger</span></div>
        <div className="card p-3"><p className="font-semibold">Sport</p><p className="text-sm text-muted line-through">Une séance guidée complète</p><p className="text-sm font-semibold text-herbe">10 minutes de marche active</p></div>
        <div className="card p-3"><p className="font-semibold">Lecture</p><p className="text-sm font-semibold text-herbe">5 pages</p></div>
      </div>
    );
  }
  if (kind === 'semaine') {
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const fill = [['herbe'], ['orange'], ['herbe', 'ciel'], ['orange'], [], ['herbe', 'ciel'], ['orange']];
    return (
      <div className="flex w-full max-w-xs justify-between">
        {days.map((d, k) => (
          <div key={k} className="flex flex-col items-center gap-1">
            <div className="flex h-28 w-7 flex-col justify-end gap-1 bg-paper-2 p-0.5">
              {fill[k].map((c, j) => <span key={j} className="h-6 w-full" style={{ background: `var(--${c})` }} />)}
            </div>
            <span className="text-xs font-bold">{d}</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'priere') {
    return (
      <div className="relative h-44 w-64">
        <div className="absolute inset-0 translate-x-3 rotate-3 border border-[#3b3129] bg-[#29211b]" />
        <div className="absolute inset-0 flex flex-col justify-center bg-[#1f1914] p-5 text-[#f3ebdc]">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[#f5c847]">Famille</p>
          <p className="mt-1 font-display text-2xl font-extrabold">Ma famille</p>
          <p className="mt-2 text-sm opacity-70">← glisse pour passer</p>
        </div>
      </div>
    );
  }
  if (kind === 'ecaa') {
    return (
      <div className="w-full max-w-xs space-y-2">
        <div className="bg-rouge p-3 font-display font-bold text-white">Protocole de crise</div>
        <div className="card flex items-center gap-3 p-3"><Soleil value={0.4} size={44} petals={13} tones={['ciel', 'jaune']} /><span className="font-semibold">Formation · 5/13</span></div>
        <div className="card p-3 text-sm"><b>Après une écoute</b><span className="block text-muted">ressenti, débrief sans nom</span></div>
      </div>
    );
  }
  if (kind === 'etudes') {
    return (
      <div className="w-full max-w-xs">
        <div className="flex items-end gap-2">
          {[1, 3, 7, 14, 30].map((d, k) => (
            <div key={d} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full" style={{ height: 24 + k * 22, background: k < 3 ? 'var(--orange)' : 'var(--paper-2)', border: '1px solid var(--line)' }} />
              <span className="text-xs font-bold num">J+{d}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm font-semibold">Rappel actif espacé</p>
      </div>
    );
  }
  if (kind === 'plus') {
    return <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rouge text-white shadow-lg"><Plus className="h-10 w-10" strokeWidth={2.5} /></div>;
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-20 w-20 items-center justify-center border-2 border-ink"><Share className="h-9 w-9" /></div>
      <p className="text-sm font-semibold">Partager → Sur l'écran d'accueil</p>
    </div>
  );
}
