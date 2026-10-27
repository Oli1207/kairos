import { ChevronDown } from 'lucide-react';

/** Une section du guide : depliable dans la page Guide, a plat dans l'aide d'une page. */
export default function GuideSection({ section, index, open, onToggle, flat }) {
  const body = (
    <div className="space-y-4 pb-5">
      {section.intro && <p className="text-muted">{section.intro}</p>}
      <ol className="space-y-3">
        {section.steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-ink font-display text-sm font-bold text-on-ink num">{i + 1}</span>
            <span><b>{t}</b><span className="block text-[0.95rem] leading-relaxed text-muted">{d}</span></span>
          </li>
        ))}
      </ol>
      {section.tips?.map((t) => <p key={t} className="border-l-4 border-jaune bg-jaune-soft px-3 py-2 text-sm">{t}</p>)}
    </div>
  );
  if (flat) return body;
  return (
    <section>
      <button type="button" className="flex w-full items-center gap-3 py-4 text-left" onClick={onToggle} aria-expanded={open}>
        <span className="font-display text-2xl font-extrabold text-rouge num">{String(index + 1).padStart(2, '0')}</span>
        <span className="flex-1 font-display text-lg font-bold leading-tight">{section.title}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && body}
    </section>
  );
}
