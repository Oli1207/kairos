/**
 * Mode demo (npm run demo) : un faux client Supabase en memoire, sauvegarde
 * dans localStorage. Il imite le petit sous-ensemble de supabase-js dont
 * l'app se sert, pour montrer Kairos sans backend. Jamais utilise en production.
 */
import { addDays, today, weekStart } from './dates';

const KEY = 'kairos-demo-db-v2';
const uid = 'demo-user';
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

// Charge a la premiere requete (les constantes du module doivent exister avant le seed).
let db = null;
const getDb = () => (db ||= load());

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return seed();
}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } };

/** Valeurs par defaut des colonnes, comme dans le schema SQL. */
const DEFAULTS = {
  checkins: () => ({ note: '', late_min: null, minutes: null, done_at: new Date().toISOString() }),
  day_logs: () => ({ mode: 'plein', water: 0, gratitude: '', victory: '', lesson: '' }),
  devotions: () => ({ day: today(), passage: '', verse: '', observation: '', application: '', prayer: '' }),
  prayer_requests: () => ({ status: 'en_cours', category: 'personnel', details: '', testimony: '' }),
  fasts: () => ({ intention: '', journal: '', ended_at: null }),
  intercession_targets: () => ({ active: true, notes: '', category: '', weekday: null }),
  board_items: () => ({ status: 'idee', details: '', position: 0, due_on: null }),
  listening_logs: () => ({ day: today(), debrief: '', kind: 'individuelle', supervised: false }),
  assignments: () => ({ done: false, est_min: 60, priority: 2, course_id: null }),
  lesson_progress: () => ({ done: false, notes: '', practice: '' }),
  weigh_ins: () => ({ day: today() }),
  workouts: () => ({ day: today(), note: '' }),
  cravings: () => ({ at: new Date().toISOString(), trigger: '', resisted: null }),
  meals: () => ({ day: today(), sugar: false, salt: false }),
  chapters: () => ({ status: 'a_voir', position: 0, review_step: 0, next_review: null, explanation: '', confidence: null }),
  focus_sessions: () => ({ started_at: new Date().toISOString(), note: '', goal: '', distractions: '', focus: null }),
  cards: () => ({ box: 1, due_on: today(), back: '', example: '', source: '' }),
  books: () => ({ current_page: 0, status: 'en_cours', review: '' }),
  reading_logs: () => ({ day: today() }),
  speeches: () => ({ day: today(), note: '' }),
  arguments: () => ({ args: [] }),
  habits: () => ({ archived: false, days: [0, 1, 2, 3, 4, 5, 6], grace_min: 15, notify: true, sacred: false, full_version: '', light_version: '' }),
};

function withDefaults(table, row) {
  return { id: uuid(), user_id: uid, created_at: new Date().toISOString(), ...(DEFAULTS[table]?.() || {}), ...row };
}

class Query {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orders = [];
    this.op = 'select';
  }
  select() { if (this.op === 'select') this.op = 'select'; this.returning = true; return this; }
  insert(rows) { this.op = 'insert'; this.payload = rows; return this; }
  update(fields) { this.op = 'update'; this.payload = fields; return this; }
  upsert(rows, opts = {}) { this.op = 'upsert'; this.payload = rows; this.conflict = opts.onConflict; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c, v) { this.filters.push((r) => r[c] === v); return this; }
  neq(c, v) { this.filters.push((r) => r[c] !== v); return this; }
  gte(c, v) { this.filters.push((r) => r[c] != null && r[c] >= v); return this; }
  lte(c, v) { this.filters.push((r) => r[c] != null && r[c] <= v); return this; }
  in(c, vs) { this.filters.push((r) => vs.includes(r[c])); return this; }
  is(c, v) { this.filters.push((r) => (r[c] ?? null) === v); return this; }
  match(o) { Object.entries(o).forEach(([c, v]) => this.eq(c, v)); return this; }
  order(c, { ascending = true } = {}) { this.orders.push([c, ascending]); return this; }
  limit(n) { this.max = n; return this; }
  single() { this.one = 'single'; return this; }
  maybeSingle() { this.one = 'maybe'; return this; }

  run() {
    const rows = (getDb()[this.table] ||= []);
    const match = (r) => this.filters.every((f) => f(r));
    let out;
    if (this.op === 'insert' || this.op === 'upsert') {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p) => {
        const keys = this.conflict ? this.conflict.split(',') : ['id'];
        const existing = rows.find((r) => keys.every((k) => (k === 'user_id' ? true : p[k] !== undefined && r[k] === p[k])));
        if (existing && (this.op === 'upsert' || p.id)) return Object.assign(existing, p);
        const row = withDefaults(this.table, p);
        rows.push(row);
        return row;
      });
      out = list;
    } else if (this.op === 'update') {
      out = rows.filter(match);
      out.forEach((r) => Object.assign(r, this.payload));
    } else if (this.op === 'delete') {
      out = rows.filter(match);
      getDb()[this.table] = rows.filter((r) => !match(r));
    } else {
      out = rows.filter(match);
    }
    if (this.op !== 'select') persist();
    out = out.map((r) => ({ ...r }));
    for (const [c, asc] of [...this.orders].reverse()) {
      out.sort((a, b) => ((a[c] ?? '') < (b[c] ?? '') ? -1 : (a[c] ?? '') > (b[c] ?? '') ? 1 : 0) * (asc ? 1 : -1));
    }
    if (this.max) out = out.slice(0, this.max);
    if (this.one === 'single') return out[0] ? { data: out[0], error: null } : { data: null, error: { message: 'Aucune ligne' } };
    if (this.one === 'maybe') return { data: out[0] ?? null, error: null };
    return { data: out, error: null };
  }
  then(resolve, reject) {
    // Un brin de latence, comme un vrai reseau.
    return new Promise((r) => setTimeout(r, 60)).then(() => this.run()).then(resolve, reject);
  }
}

const session = { user: { id: uid, email: 'demo@kairos.app' }, access_token: 'demo' };

export function createDemoClient() {
  return {
    from: (t) => new Query(t),
    rpc: async () => ({ data: null, error: null }),
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: { session }, error: null }),
      signUp: async () => ({ data: { session }, error: null }),
      signOut: async () => { localStorage.removeItem(KEY); location.reload(); },
    },
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: null } }),
        remove: async () => ({ error: null }),
      }),
    },
  };
}

// ─── Donnees de demonstration ──────────────────────────────────────────────

function seed() {
  const t = today();
  const year = t.slice(0, 4);
  const h = (domain, kind, title, schedule, extra = {}) => withDefaults('habits', { domain, kind, title, schedule, ...extra });
  const habits = [
    h('esprit', 'meditation', 'Méditation', 'fixe', { at_time: '05:30:00', duration_min: 20, sacred: true, full_version: 'Lire le chapitre du jour et remplir le journal É.O.A.P.', position: 1 }),
    h('esprit', 'priere', 'Prière', 'fixe', { at_time: '06:00:00', duration_min: 20, sacred: true, full_version: 'Adoration, confession, gratitude, supplication.', position: 2 }),
    h('esprit', 'jeune', 'Jeûne', 'hebdo', { per_week: 1, per_week_min: 1, duration_min: 0, sacred: true, position: 3 }),
    h('service', 'intercession', 'Intercession', 'fixe', { at_time: '21:00:00', duration_min: 20, sacred: true, full_version: 'Prier pour la liste du jour.', position: 4 }),
    h('service', 'ecaa', 'Travail pour ECAA', 'hebdo', { per_week: 3, per_week_min: 2, duration_min: 45, full_version: 'Avancer un élément du tableau ECAA.', light_version: 'Noter une idée de post.', position: 5 }),
    h('corps', 'sport', 'Sport', 'hebdo', { per_week: 3, per_week_min: 2, duration_min: 30, full_version: 'Une séance guidée complète.', light_version: '10 minutes de marche active.', position: 6 }),
    h('corps', 'sucre_sel', 'Sans sucre ni sel ajoutés', 'quotidien', { duration_min: 0, position: 7 }),
    h('corps', 'coucher', 'Coucher', 'fixe', { at_time: '22:30:00', duration_min: 0, full_version: 'Écran coupé, au lit.', position: 8 }),
    h('etudes', 'etude', 'Études du jour', 'quotidien', { duration_min: 120, full_version: '2 heures de travail personnel.', light_version: '30 minutes sur le chapitre le plus urgent.', position: 9 }),
    h('etudes', 'lecture', 'Lecture', 'quotidien', { duration_min: 20, full_version: '20 minutes de lecture.', light_version: '5 pages.', position: 10 }),
    h('etudes', 'mots', 'Vocabulaire', 'quotidien', { duration_min: 10, full_version: 'Réviser mes cartes et ajouter 3 mots.', light_version: 'Réviser 5 cartes.', position: 11 }),
    h('etudes', 'anglais', 'Anglais', 'hebdo', { per_week: 3, per_week_min: 3, duration_min: 30, full_version: '30 minutes sur la compétence proposée.', light_version: '10 minutes de cartes.', position: 12 }),
    h('etudes', 'oral', 'Prise de parole', 'hebdo', { per_week: 2, per_week_min: 1, duration_min: 15, full_version: 'S\'enregistrer 2 minutes et s\'évaluer.', light_version: 'S\'enregistrer 1 minute.', position: 13 }),
    h('etudes', 'argument', 'Atelier argumentation', 'hebdo', { per_week: 1, per_week_min: 1, duration_min: 30, position: 14 }),
    h('etudes', 'finance', 'Culture financière', 'hebdo', { per_week: 1, per_week_min: 1, duration_min: 60, position: 15 }),
    h('etudes', 'contenu', 'Création de contenu', 'hebdo', { per_week: 3, per_week_min: 1, duration_min: 15, full_version: 'Un micro-créneau de 15 minutes sur une idée.', light_version: 'Noter une idée.', position: 16 }),
  ];
  // Quelques jours passes pointes, pour que les jauges et la fidelite aient de quoi montrer.
  const checkins = [];
  for (let i = 1; i <= 12; i += 1) {
    const d = addDays(t, -i);
    habits.filter((x) => x.schedule === 'fixe').forEach((x, j) => {
      if ((i + j) % 4 === 0) return;
      checkins.push(withDefaults('checkins', { habit_id: x.id, day: d, status: 'fait', late_min: (i + j) % 3 === 0 ? 25 : 4 }));
    });
  }
  const monday = weekStart(t);
  const sport = habits.find((x) => x.kind === 'sport');
  if (monday < t) checkins.push(withDefaults('checkins', { habit_id: sport.id, day: monday, status: 'fait' }));

  const finance = [
    ['Mon argent aujourd\'hui', ['Combien gagne-je vraiment par mois ?', 'Où part mon argent ?', 'Qu\'est-ce que je dois, et à qui ?'], 'Noter chaque dépense pendant 7 jours, même 100 FCFA.'],
    ['Le budget', ['Qu\'est-ce que la règle 50/30/20 ?', 'Qu\'est-ce qu\'un budget « à zéro » ?', 'Quelles sont mes dépenses fixes et variables ?'], 'Faire mon budget du mois prochain.'],
    ['Épargne et fonds d\'urgence', ['Pourquoi 3 à 6 mois de dépenses ?', 'Où garder cette épargne ?', 'Qu\'est-ce que « se payer en premier » ?'], 'Mettre en place une épargne automatique.'],
  ].map(([title, questions, action], i) => withDefaults('finance_weeks', { position: i + 1, title, questions, action, action_done: false, notes: '', takeaways: '', week_start: addDays(monday, i * 7) }));

  const courses = [
    withDefaults('courses', { name: 'Droit des obligations', exam_on: addDays(t, 24), position: 0 }),
    withDefaults('courses', { name: 'Histoire du droit', exam_on: addDays(t, 31), position: 1 }),
  ];
  const ch = (c, title, i, extra = {}) => withDefaults('chapters', { course_id: c.id, title, position: i, ...extra });
  const chapters = [
    ch(courses[0], 'Formation du contrat', 0, { status: 'vu', review_step: 1, next_review: t, confidence: 3 }),
    ch(courses[0], 'Vices du consentement', 1, { status: 'vu', review_step: 0, next_review: addDays(t, -1) }),
    ch(courses[0], 'Effets du contrat', 2),
    ch(courses[0], 'Responsabilité contractuelle', 3),
    ch(courses[1], 'Le droit romain', 0, { status: 'revise', review_step: 5 }),
    ch(courses[1], 'Le droit coutumier', 1, { status: 'vu', review_step: 2, next_review: addDays(t, 4), confidence: 4 }),
    ch(courses[1], 'La codification', 2),
  ];
  const book = withDefaults('books', { title: "L'Enfant noir", author: 'Camara Laye', kind: 'roman', total_pages: 220, current_page: 64, started_on: addDays(t, -10) });

  return {
    profiles: [{ id: uid, display_name: 'Grâce', timezone: 'Africa/Abidjan', wake_time: '05:00:00', bed_time: '22:30:00', weigh_day: 6, onboarded: true, start_weight: 78, target_weight: 72 }],
    seasons: [withDefaults('seasons', { title: 'Novembre – Décembre', intention: 'Revenir à l\'essentiel : Dieu d\'abord, et prendre soin de moi.', starts_on: `${year}-11-01`, ends_on: `${year}-12-31` })],
    habits,
    checkins,
    day_logs: Array.from({ length: 18 }, (_, k) => withDefaults('day_logs', { day: addDays(t, -(k + 1)), energy: [3, 4, 2, 3, 4, 3][k % 6], mood: [4, 3, 3, 4, 5, 3][k % 6], sleep_hours: [7, 6, 5, 7.5, 8, 6.5][k % 6], sugar_free: k % 3 !== 0, salt_free: k % 4 !== 0 })),
    schedule_blocks: [1, 2, 3, 4, 5].flatMap((wd) => [
      withDefaults('schedule_blocks', { title: 'Cours', weekday: wd, start_time: '08:00:00', end_time: '12:00:00', kind: 'cours', location: 'Université' }),
      ...(wd % 2 ? [withDefaults('schedule_blocks', { title: 'TD', weekday: wd, start_time: '14:00:00', end_time: '16:00:00', kind: 'cours', location: '' })] : []),
    ]),
    planned_sessions: [],
    bible_plans: [withDefaults('bible_plans', { book: 'Jean', chapters: 21, current: 4, active: true })],
    devotions: [withDefaults('devotions', { day: addDays(t, -1), passage: 'Jean 3', verse: 'Car Dieu a tant aimé le monde…', observation: 'Nicodème vient de nuit.', application: 'Venir à Dieu même avec mes questions.', prayer: 'Merci pour ton amour.' })],
    prayer_requests: [
      withDefaults('prayer_requests', { title: 'Réussir mes partiels', category: 'etudes' }),
      withDefaults('prayer_requests', { title: 'La santé de maman', category: 'famille', status: 'exauce', answered_on: addDays(t, -3), testimony: 'Les analyses sont bonnes.', created_at: new Date(Date.now() - 20 * 864e5).toISOString() }),
    ],
    fasts: [],
    intercession_targets: [['Ma famille', 'Famille', 1], ['Mon église', 'Église', 2], ['Les personnes accompagnées par ECAA', 'ECAA', 3], ['Mes études et ma vocation', 'Moi', 4], ['Mon pays', 'Nation', 5], ['Mes amis', 'Amis', 6], ['Les chrétiens persécutés', 'Monde', 0]]
      .map(([name, category, weekday]) => withDefaults('intercession_targets', { name, category, weekday })),
    board_items: [
      withDefaults('board_items', { board: 'ecaa', pillar: 'posts', title: 'Movember : un homme a le droit de pleurer', status: 'en_cours', due_on: addDays(t, 5) }),
      withDefaults('board_items', { board: 'ecaa', pillar: 'programme', title: 'Plan d\'un atelier « écouter sans juger »', status: 'idee' }),
      withDefaults('board_items', { board: 'contenu', pillar: 'instagram', title: '3 versets pour les jours sans force', status: 'idee' }),
    ],
    listening_logs: [withDefaults('listening_logs', { day: addDays(t, -2), minutes: 50, feeling: 2, debrief: "Beaucoup de colère contre sa famille. J'ai proposé un psychologue." })],
    resources: [],
    weigh_ins: [[-21, 78.4], [-14, 77.9], [-7, 77.6], [0, 77.1]].map(([d, w]) => withDefaults('weigh_ins', { day: addDays(t, d), weight_kg: w })),
    workouts: [],
    cravings: [],
    meals: [],
    courses,
    chapters,
    assignments: [
      withDefaults('assignments', { course_id: courses[1].id, title: 'TD n°4 : la responsabilité', due_on: addDays(t, 1), est_min: 120, priority: 1 }),
      withDefaults('assignments', { course_id: courses[0].id, title: 'Exposé : le consentement', due_on: addDays(t, 6), est_min: 240 }),
    ],
    lesson_progress: [withDefaults('lesson_progress', { track: 'ecaa', lesson: 'depression', done: true })],
    focus_sessions: Array.from({ length: 40 }, (_, k) => {
      const d = new Date(Date.now() - (Math.floor(k * 1.9) + 1) * 864e5);
      d.setHours([9, 14, 16, 20][k % 4], 0, 0, 0);
      return withDefaults('focus_sessions', { kind: 'etude', minutes: [25, 45, 50, 30][k % 4], started_at: d.toISOString(), focus: [4, 3, 2, 3][k % 4], course_id: courses[k % 2].id });
    }),
    cards: [
      withDefaults('cards', { deck: 'mots', front: 'Prolixe', back: 'Qui parle ou écrit trop longuement.', example: 'Sois concise, pas prolixe.' }),
      withDefaults('cards', { deck: 'mots', front: 'Éloquence', back: 'Art de bien parler, de persuader.' }),
      withDefaults('cards', { deck: 'english', front: 'to overcome', back: 'surmonter' }),
      withDefaults('cards', { deck: 'cours', course_id: courses[0].id, chapter_id: chapters[0].id, front: "Quelles sont les conditions de validité d'un contrat ?", back: 'Consentement, capacité, contenu licite et certain.' }),
      withDefaults('cards', { deck: 'cours', course_id: courses[0].id, chapter_id: chapters[0].id, front: "Qu'est-ce qu'une offre ?", back: 'Une proposition ferme et précise de conclure un contrat.' }),
    ],
    books: [withDefaults('books', { title: 'L\'Enfant noir', author: 'Camara Laye', kind: 'roman', total_pages: 220, current_page: 64, started_on: addDays(t, -10) })],
    reading_logs: [withDefaults('reading_logs', { book_id: null, day: addDays(t, -2), pages: 18 })],
    quotes: [],
    speeches: [],
    arguments: [],
    finance_weeks: finance,
    push_subscriptions: [],
  };
}
