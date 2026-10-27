/**
 * Le cerveau de Kairos : tout ce qui transforme des lignes de base en
 * decisions (ce qui est au programme, ou placer une seance, quoi reviser,
 * que retenir de la semaine). Fonctions pures, sans appel reseau.
 */
import { addDays, diffDays, nowMin, today, toMin, toTime, weekday } from './dates';

export const DOMAINS = {
  esprit: { label: 'Esprit', color: 'rouge', path: '/esprit' },
  service: { label: 'Service', color: 'ciel', path: '/service' },
  corps: { label: 'Corps', color: 'herbe', path: '/corps' },
  etudes: { label: 'Études', color: 'orange', path: '/etudes' },
};

/** Ou mene chaque type d'habitude quand on la touche. */
export const KIND_LINK = {
  meditation: '/esprit?onglet=meditation',
  priere: '/esprit?onglet=priere',
  jeune: '/esprit?onglet=jeune',
  intercession: '/service?onglet=intercession',
  ecaa: '/service?onglet=ecaa',
  sport: '/corps?onglet=seances',
  sucre_sel: '/corps?onglet=sucre',
  etude: '/etudes?onglet=plan',
  lecture: '/etudes?onglet=lecture',
  mots: '/etudes?onglet=mots',
  anglais: '/etudes?onglet=anglais',
  oral: '/etudes?onglet=oral',
  argument: '/etudes?onglet=argument',
  finance: '/etudes?onglet=finance',
  contenu: '/etudes?onglet=contenu',
};

export const KINDS = [
  ['meditation', 'Méditation'], ['priere', 'Prière'], ['jeune', 'Jeûne'], ['intercession', 'Intercession'],
  ['ecaa', 'ECAA'], ['sport', 'Sport'], ['sucre_sel', 'Sucre et sel'], ['coucher', 'Coucher'],
  ['etude', 'Études'], ['lecture', 'Lecture'], ['mots', 'Vocabulaire'], ['anglais', 'Anglais'],
  ['oral', 'Prise de parole'], ['argument', 'Argumentation'], ['finance', 'Culture financière'],
  ['contenu', 'Contenu'], ['libre', 'Autre'],
];

// ─── Le programme d'un jour ────────────────────────────────────────────────

/**
 * timed   : ce qui a une heure (rendez-vous fixes, seances placees, cours), trie.
 * untimed : les habitudes quotidiennes sans heure.
 */
export function agenda(day, habits = [], planned = [], blocks = []) {
  const wd = weekday(day);
  const timed = [];
  const untimed = [];
  for (const h of habits) {
    if (h.archived || !h.days?.includes(wd)) continue;
    if (h.schedule === 'fixe') timed.push({ id: `h-${h.id}`, type: 'habit', habit: h, at: toMin(h.at_time) });
    if (h.schedule === 'quotidien') untimed.push({ id: `h-${h.id}`, type: 'habit', habit: h, at: null });
  }
  for (const p of planned) {
    if (p.day !== day) continue;
    const h = habits.find((x) => x.id === p.habit_id);
    if (h && !h.archived) timed.push({ id: `p-${p.id}`, type: 'habit', habit: h, at: toMin(p.at_time), planned: p });
  }
  for (const b of blocks) {
    if (b.weekday === wd) timed.push({ id: `b-${b.id}`, type: 'block', block: b, at: toMin(b.start_time), end: toMin(b.end_time) });
  }
  timed.sort((a, b) => a.at - b.at);
  return { timed, untimed };
}

/** Etat visuel d'un pointage : fait, leger, retard (fait hors marge), manque, ou rien. */
export function checkState(checkin, habit) {
  if (!checkin) return null;
  if (checkin.status === 'fait' && habit?.schedule === 'fixe' && (checkin.late_min ?? 0) > habit.grace_min) return 'retard';
  return checkin.status;
}

/** Retard en minutes si on pointe maintenant un rendez-vous de l'heure `at` (aujourd'hui). */
export function lateness(day, at) {
  if (at == null || day !== today()) return null;
  return Math.max(0, nowMin() - at);
}

// ─── Fidelite et progression ───────────────────────────────────────────────

/** Jours ou l'habitude etait due entre `from` et `to` inclus. */
function dueDays(habit, from, to, planned = []) {
  const days = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (habit.schedule === 'hebdo') {
      if (planned.some((p) => p.habit_id === habit.id && p.day === d)) days.push(d);
    } else if (habit.days.includes(weekday(d))) days.push(d);
  }
  return days;
}

/**
 * Pour une semaine : fait / attendu, et pour les rendez-vous fixes la part a l'heure.
 * Les habitudes hebdo comptent leurs pointages contre per_week.
 */
export function weekProgress(habit, checkins, monday, until = today()) {
  const end = addDays(monday, 6) < until ? addDays(monday, 6) : until;
  const mine = checkins.filter((c) => c.habit_id === habit.id && c.day >= monday && c.day <= addDays(monday, 6));
  const done = mine.filter((c) => c.status === 'fait' || c.status === 'leger');
  // Les jours de repos (maladie, voyage) sont dispenses : ils sortent de l'objectif.
  const rest = mine.filter((c) => c.status === 'repos').length;
  if (habit.schedule === 'hebdo') {
    return { done: done.length, target: habit.per_week || 1, min: habit.per_week_min || habit.per_week || 1 };
  }
  const due = dueDays(habit, monday, end);
  const fullWeek = dueDays(habit, monday, addDays(monday, 6)).length;
  const onTime = habit.schedule === 'fixe'
    ? done.filter((c) => c.status === 'fait' && (c.late_min ?? 0) <= habit.grace_min).length
    : null;
  return { done: done.length, target: Math.max(0, fullWeek - rest), elapsed: due.length - rest, onTime };
}

/** Fidelite sur les 14 derniers jours (hors aujourd'hui s'il n'est pas encore pointe). */
export function fidelity(habit, checkins, days = 14) {
  const end = addDays(today(), -1);
  const from = addDays(end, -(days - 1));
  const excused = new Set(checkins.filter((c) => c.habit_id === habit.id && c.status === 'repos').map((c) => c.day));
  const due = dueDays(habit, from, end).filter((d) => !excused.has(d));
  if (!due.length) return null;
  const mine = checkins.filter((c) => c.habit_id === habit.id && due.includes(c.day));
  const kept = mine.filter((c) => c.status !== 'manque').length;
  const onTime = mine.filter((c) => c.status === 'fait' && (c.late_min ?? 0) <= habit.grace_min).length;
  return { due: due.length, kept, onTime, rate: kept / due.length, onTimeRate: onTime / due.length };
}

/** Serie de jours consecutifs verifiant `ok(day)`, en partant d'aujourd'hui (ou d'hier si aujourd'hui n'est pas encore acquis). */
export function streak(ok, max = 400) {
  let d = today();
  if (!ok(d)) d = addDays(d, -1);
  let n = 0;
  while (n < max && ok(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

// ─── Creneaux libres et placement automatique ──────────────────────────────

/** Occupations d'un jour, en minutes : cours, rendez-vous fixes, seances deja placees. */
export function busyRanges(day, { blocks = [], habits = [], planned = [] }) {
  const wd = weekday(day);
  const ranges = [];
  blocks.filter((b) => b.weekday === wd).forEach((b) => ranges.push([toMin(b.start_time), toMin(b.end_time)]));
  habits.filter((h) => h.schedule === 'fixe' && !h.archived && h.days.includes(wd) && h.kind !== 'coucher')
    .forEach((h) => ranges.push([toMin(h.at_time), toMin(h.at_time) + Math.max(h.duration_min, 10)]));
  planned.filter((p) => p.day === day).forEach((p) => {
    const h = habits.find((x) => x.id === p.habit_id);
    ranges.push([toMin(p.at_time), toMin(p.at_time) + (h?.duration_min || 30)]);
  });
  return ranges.sort((a, b) => a[0] - b[0]);
}

/** Trous d'au moins `minLen` minutes entre le reveil et le coucher. */
export function freeSlots(day, ctx, profile, minLen = 15) {
  let start = toMin(profile?.wake_time || '05:00') + 30;
  const end = toMin(profile?.bed_time || '22:30') - 15;
  if (day === today()) start = Math.max(start, Math.ceil(nowMin() / 5) * 5);
  const slots = [];
  let cursor = start;
  for (const [a, b] of busyRanges(day, ctx)) {
    if (a - cursor >= minLen) slots.push([cursor, Math.min(a, end)]);
    cursor = Math.max(cursor, b);
    if (cursor >= end) break;
  }
  if (end - cursor >= minLen) slots.push([cursor, end]);
  return slots.filter(([a, b]) => b - a >= minLen);
}

const MAX_DAY_LOAD = 150;

/** Heure preferee par type d'activite (en minutes) : le placement s'en approche. */
const PREFERRED = {
  sport: 17 * 60 + 30, anglais: 19 * 60, contenu: 13 * 60, ecaa: 18 * 60, oral: 19 * 60 + 30,
  argument: 16 * 60, finance: 16 * 60, libre: 15 * 60,
};

/**
 * Propose un placement des seances hebdo restantes sur les jours a venir de la semaine.
 * Les seances d'une meme habitude sont espacees au maximum ; le sport evite les jours de jeune.
 */
export function autoPlace({ days, habits, planned, checkins, blocks, profile, fasts = [] }) {
  const upcoming = days.filter((d) => d >= today());
  const placed = [...planned];
  const proposals = [];
  const fastDays = new Set();
  fasts.forEach((f) => {
    for (let d = f.starts_at.slice(0, 10); d <= f.ends_at.slice(0, 10); d = addDays(d, 1)) fastDays.add(d);
  });

  const weekly = habits.filter((h) => h.schedule === 'hebdo' && !h.archived && h.kind !== 'jeune');
  for (const h of weekly) {
    const doneCount = checkins.filter((c) => c.habit_id === h.id && days.includes(c.day) && c.status !== 'manque').length;
    const already = placed.filter((p) => p.habit_id === h.id && days.includes(p.day));
    let need = (h.per_week || 1) - Math.max(doneCount, already.length);
    const chosen = already.map((p) => p.day);
    while (need > 0) {
      const candidates = upcoming.filter((d) => !chosen.includes(d) && !(h.kind === 'sport' && fastDays.has(d)));
      if (!candidates.length) break;
      // D'abord espacer les seances d'une meme habitude, ensuite choisir le jour le moins charge.
      const spread = (d) => (chosen.length ? Math.min(3, ...chosen.map((c) => Math.abs(diffDays(d, c)))) : 3);
      const load = (d) => placed.filter((p) => p.day === d)
        .reduce((sum, p) => sum + (habits.find((x) => x.id === p.habit_id)?.duration_min || 30), 0);
      candidates.sort((a, b) => spread(b) - spread(a) || load(a) - load(b) || (a < b ? -1 : 1));
      let done = false;
      for (const d of candidates) {
        // Pas plus de 2 h 30 de seances placees par jour : une soiree reste vivable.
        if (load(d) + h.duration_min > MAX_DAY_LOAD) continue;
        const slots = freeSlots(d, { blocks, habits, planned: placed }, profile, Math.max(h.duration_min, 15));
        if (!slots.length) continue;
        const pref = PREFERRED[h.kind] ?? PREFERRED.libre;
        const best = slots
          .map(([a, b]) => [Math.min(Math.max(pref, a), b - h.duration_min), a, b])
          .sort((x, y) => Math.abs(x[0] - pref) - Math.abs(y[0] - pref))[0];
        const at = toTime(Math.round(best[0] / 5) * 5);
        const row = { habit_id: h.id, day: d, at_time: at };
        placed.push(row);
        proposals.push(row);
        chosen.push(d);
        done = true;
        break;
      }
      if (!done) break;
      need -= 1;
    }
  }
  return proposals;
}

// ─── Revision espacee (Leitner) ────────────────────────────────────────────

export const BOX_DAYS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15 };

export function reviewCard(card, ok) {
  const box = ok ? Math.min(5, card.box + 1) : 1;
  return { id: card.id, box, due_on: addDays(today(), BOX_DAYS[box]), reviewed_at: new Date().toISOString() };
}

// ─── Etudes ────────────────────────────────────────────────────────────────

/** Repartit les chapitres non revises entre aujourd'hui et la veille de l'examen. */
export function revisionPlan(chapters, examOn) {
  const todo = chapters.filter((c) => c.status !== 'revise').sort((a, b) => a.position - b.position);
  if (!examOn || !todo.length) return [];
  const span = Math.max(1, diffDays(examOn, today()));
  return todo.map((c, i) => ({
    id: c.id,
    planned_on: addDays(today(), Math.min(span - 1, Math.floor((i * span) / todo.length))),
  }));
}

export const ENGLISH_SKILLS = [
  { key: 'ecoute', label: 'Écoute', idea: 'Un podcast ou une vidéo de 15 min avec sous-titres anglais, puis résumer à voix haute.' },
  { key: 'oral', label: 'Oral', idea: 'Parler 5 min d\'un sujet du jour en s\'enregistrant, puis noter les mots qui ont manqué.' },
  { key: 'vocabulaire', label: 'Vocabulaire', idea: 'Ajouter 10 mots croisés dans la semaine et réviser le paquet English.' },
  { key: 'grammaire', label: 'Grammaire', idea: 'Un point de grammaire (temps, prépositions…) et 10 phrases à soi.' },
  { key: 'ecrit', label: 'Écrit', idea: 'Écrire 150 mots : journal de la journée ou réponse à une question ouverte.' },
];

/** Competence la moins travaillee sur 4 semaines. */
export function nextEnglishSkill(sessions) {
  const since = addDays(today(), -28);
  const count = Object.fromEntries(ENGLISH_SKILLS.map((s) => [s.key, 0]));
  sessions.filter((s) => s.kind === 'anglais' && s.started_at.slice(0, 10) >= since)
    .forEach((s) => { if (s.skill in count) count[s.skill] += s.minutes; });
  const key = Object.entries(count).sort((a, b) => a[1] - b[1])[0][0];
  return { skill: ENGLISH_SKILLS.find((s) => s.key === key), count };
}

/** Rythme de lecture sur 14 jours et date de fin estimee. */
export function readingPace(book, logs) {
  const since = addDays(today(), -13);
  const pages = logs.filter((l) => l.book_id === book.id && l.day >= since).reduce((s, l) => s + l.pages, 0);
  const perDay = pages / 14;
  const left = Math.max(0, (book.total_pages || 0) - (book.current_page || 0));
  const eta = perDay > 0 && left > 0 ? addDays(today(), Math.ceil(left / perDay)) : null;
  return { perDay, left, eta };
}

// ─── Sucre et sel : comprendre les envies ──────────────────────────────────

export const TRIGGERS = ['Stress', 'Fatigue', 'Ennui', 'Faim', 'Émotion', 'Social', 'Habitude'];

function moment(iso) {
  const h = new Date(iso).getHours();
  if (h < 12) return 'le matin';
  if (h < 18) return "l'après-midi";
  if (h < 22) return 'le soir';
  return 'tard le soir';
}

export function cravingInsights(cravings, kind) {
  const list = cravings.filter((c) => !kind || c.kind === kind);
  if (list.length < 3) return [];
  const tally = (f) => Object.entries(list.reduce((m, c) => { const k = f(c); if (k) m[k] = (m[k] || 0) + 1; return m; }, {}))
    .sort((a, b) => b[1] - a[1]);
  const out = [];
  const [trig] = tally((c) => c.trigger);
  if (trig) out.push(`${Math.round((trig[1] / list.length) * 100)} % de tes envies viennent avec : ${trig[0].toLowerCase()}.`);
  const [when] = tally((c) => moment(c.at));
  if (when) out.push(`Elles arrivent surtout ${when} (${when[1]} sur ${list.length}).`);
  const decided = list.filter((c) => c.resisted != null);
  if (decided.length) {
    const r = decided.filter((c) => c.resisted).length;
    out.push(`Tu as tenu ${r} fois sur ${decided.length}.`);
  }
  return out;
}

// ─── Bilan de la semaine ───────────────────────────────────────────────────

/** Lien sommeil / rendez-vous du matin : ne parle que si l'ecart est net. */
export function sleepInsight(habits, checkins, dayLogs) {
  const early = habits.filter((h) => h.schedule === 'fixe' && toMin(h.at_time) < 8 * 60);
  if (!early.length) return null;
  const rows = dayLogs.filter((l) => l.sleep_hours != null).map((l) => {
    const due = early.filter((h) => h.days.includes(weekday(l.day)));
    const ok = due.filter((h) => checkins.some((c) => c.habit_id === h.id && c.day === l.day && c.status === 'fait' && (c.late_min ?? 0) <= h.grace_min));
    return { short: l.sleep_hours < 6.5, rate: due.length ? ok.length / due.length : null };
  }).filter((r) => r.rate != null);
  const avg = (a) => a.reduce((s, r) => s + r.rate, 0) / a.length;
  const short = rows.filter((r) => r.short);
  const long = rows.filter((r) => !r.short);
  if (short.length < 2 || long.length < 2) return null;
  const a = avg(short);
  const b = avg(long);
  if (b - a < 0.25) return null;
  return `Après une nuit de moins de 6 h 30, tu tiens tes rendez-vous du matin ${Math.round(a * 100)} % du temps, contre ${Math.round(b * 100)} % quand tu dors assez. Ton heure de coucher décide de tes matins.`;
}

/** Trois nuits d'ecoute difficiles d'affilee : il faut prendre soin de l'ecoutante. */
export function listeningAlert(logs) {
  const last = [...logs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 3);
  return last.length === 3 && last.every((l) => l.feeling <= 2);
}
