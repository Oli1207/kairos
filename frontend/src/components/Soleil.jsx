import clsx from 'clsx';
/**
 * Le soleil du pagne : un rond central, un anneau, puis des petales qui
 * rayonnent. Il sert de jauge : les petales se colorent avec la progression,
 * dans l'ordre des aiguilles d'une montre, en alternant rouge et orange
 * comme sur le tissu.
 */
export default function Soleil({ value = 0, size = 120, petals = 24, children, tones = ['rouge', 'orange'], className, core = 19 }) {
  const c = 50;
  // `core` : rayon du disque central (sur 100). Plus grand pour loger un minuteur.
  const ring = core + 5;
  const top = 2;
  const bottom = 50 - (ring + 3);
  const mid = (top + bottom) / 2;
  const w = Math.max(2.2, (bottom - top) / 6);
  const petal = `M50 ${top} C${50 + w} ${mid - 3} ${50 + w} ${mid + 3} 50 ${bottom} C${50 - w} ${mid + 3} ${50 - w} ${mid - 3} 50 ${top} Z`;
  const lit = Math.round(Math.max(0, Math.min(1, value)) * petals);
  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        {Array.from({ length: petals }, (_, i) => {
          const a = (i / petals) * 360;
          const on = i < lit;
          const tone = tones[i % tones.length];
          return (
            <path
              key={i}
              d={petal}
              transform={`rotate(${a} ${c} ${c})`}
              fill={on ? `var(--${tone})` : 'none'}
              stroke={on ? `var(--${tone})` : 'var(--line)'}
              strokeWidth="1"
            />
          );
        })}
        <circle cx={c} cy={c} r={ring} fill="none" stroke="var(--jaune)" strokeWidth="3" />
        <circle cx={c} cy={c} r={core} fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.2" />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">{children}</div>
      )}
    </div>
  );
}

/** Petit soleil plein, decor de titre ou puce. */
export function MiniSoleil({ size = 22, tone = 'rouge' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M50 2 C55 12 55 20 50 30 C45 20 45 12 50 2 Z" transform={`rotate(${i * 30} 50 50)`} fill={`var(--${i % 2 ? 'orange' : tone})`} />
      ))}
      <circle cx="50" cy="50" r="18" fill="var(--jaune)" />
      <circle cx="50" cy="50" r="10" fill="var(--ink)" />
    </svg>
  );
}

/** Lisiere du pagne : une rangee de demi-soleils, en bas d'un en-tete. */
export function Lisiere({ className }) {
  const n = 18;
  return (
    <svg viewBox={`0 0 ${n * 40} 22`} preserveAspectRatio="none" className={clsx('block', className)} style={{ width: '100%', height: 14 }} aria-hidden="true">
      <rect width={n * 40} height="22" fill="var(--ink)" />
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${i * 40 + 20} 22)`}>
          {[-60, -30, 0, 30, 60].map((a, j) => (
            <path key={a} d="M0 -3 C3 -8 3 -14 0 -19 C-3 -14 -3 -8 0 -3 Z" transform={`rotate(${a})`} fill={`var(--${['rouge', 'orange', 'jaune', 'orange', 'rouge'][j]})`} />
          ))}
        </g>
      ))}
    </svg>
  );
}
