import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { BookOpen, CalendarRange, CircleHelp, Flame, HandHeart, Leaf, LifeBuoy, Settings, Sun } from 'lucide-react';
import { Lisiere, MiniSoleil } from './Soleil';
import { IconButton, Sheet } from './ui';
import QuickAdd from './QuickAdd';
import { GUIDE } from '../data/guide';
import GuideSection from './GuideSection';

const NAV = [
  { to: '/', label: 'Jour', icon: Sun, end: true },
  { to: '/semaine', label: 'Semaine', icon: CalendarRange },
  { to: '/esprit', label: 'Esprit', icon: Flame },
  { to: '/service', label: 'Service', icon: HandHeart },
  { to: '/corps', label: 'Corps', icon: Leaf },
  { to: '/etudes', label: 'Études', icon: BookOpen },
];

export default function Layout() {
  return (
    <div className="min-h-screen md:flex">
      {/* Bureau : colonne noire comme le pagne */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[#17120e] text-[#fbf9f3] md:flex">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <MiniSoleil size={30} />
          <span className="font-display text-2xl font-extrabold tracking-tight">Kairos</span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {[...NAV, { to: '/guide', label: 'Guide', icon: LifeBuoy }, { to: '/reglages', label: 'Réglages', icon: Settings }].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 border-l-4 px-3 py-2.5 font-semibold transition',
                isActive ? 'border-[#e5493c] bg-white/10' : 'border-transparent text-white/70 hover:text-white',
              )}
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <Lisiere />
      </aside>

      <div className="min-w-0 flex-1">
        <main className="safe-bottom mx-auto w-full max-w-3xl px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:px-8 md:pb-24 md:pt-8 lg:max-w-5xl">
          <Outlet />
        </main>
      </div>

      <QuickAdd />

      {/* Mobile : barre du bas */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => clsx(
                'flex flex-col items-center gap-0.5 border-t-[3px] pb-1.5 pt-2 text-[0.65rem] font-semibold',
                isActive ? 'border-rouge text-ink' : 'border-transparent text-muted',
              )}
            >
              <n.icon className="h-[1.3rem] w-[1.3rem]" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/**
 * En-tete de page : titre, sous-titre, action. `help` ouvre la section du
 * guide correspondante, sans quitter la page.
 */
export function PageHeader({ title, sub, action, kicker, help }) {
  const [open, setOpen] = useState(false);
  const section = help && GUIDE.find((g) => g.key === help);
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {kicker && <p className="text-xs font-bold uppercase tracking-[0.14em] text-rouge">{kicker}</p>}
        <h1 className="font-display text-[2rem] font-extrabold leading-[1.05]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      <div className="flex shrink-0">
        {section && <IconButton icon={CircleHelp} label="Comment ça marche ?" onClick={() => setOpen(true)} />}
        {action}
      </div>
      {section && (
        <Sheet open={open} onClose={() => setOpen(false)} title={section.title} wide>
          <GuideSection section={section} flat />
          <Link to={`/guide?section=${section.key}`} className="text-sm font-semibold text-rouge" onClick={() => setOpen(false)}>Ouvrir le guide complet →</Link>
        </Sheet>
      )}
    </header>
  );
}
