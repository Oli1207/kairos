/**
 * Contenus livres avec l'app : seances guidees, banque de sujets, livres de la
 * Bible, idees pour ECAA. Tout ce qui est personnel vit en base.
 */

// ─── Seances guidees sans materiel ─────────────────────────────────────────

/** Construit un circuit : chaque exercice `work` secondes, `rest` de repos, `rounds` tours. */
function circuit(exercises, { work, rest, rounds, roundRest = 60 }) {
  const steps = [{ name: 'Échauffement', sec: 180, cue: 'Marche sur place, cercles de bras, rotations des hanches.' }];
  for (let r = 1; r <= rounds; r += 1) {
    exercises.forEach(([name, cue], i) => {
      steps.push({ name, sec: work, cue, round: r });
      const last = i === exercises.length - 1;
      if (!last) steps.push({ name: 'Repos', sec: rest, rest: true });
      else if (r < rounds) steps.push({ name: 'Récupération', sec: roundRest, rest: true, cue: 'Bois une gorgée d\'eau.' });
    });
  }
  steps.push({ name: 'Étirements', sec: 180, cue: 'Cuisses, mollets, dos, épaules. Respire lentement.' });
  return steps;
}

export const ROUTINES = [
  {
    key: 'decouverte', title: 'Découverte', level: 'Douce', tone: 'herbe',
    note: 'Pour reprendre sans se blesser. Idéale les jours de jeûne ou de fatigue.',
    steps: circuit([
      ['Squat sur chaise', 'Assieds-toi et relève-toi sans les mains, dos droit.'],
      ['Pompes contre le mur', 'Corps gainé, descends la poitrine vers le mur.'],
      ['Montées de genoux lentes', 'Alterne, bras qui accompagnent.'],
      ['Pont fessier', 'Allongée, pieds au sol, monte le bassin et serre.'],
    ], { work: 40, rest: 20, rounds: 2 }),
  },
  {
    key: 'tonus', title: 'Tonus', level: 'Moyenne', tone: 'orange',
    note: 'Renforcement de tout le corps. Le cœur de la semaine.',
    steps: circuit([
      ['Squats', 'Pieds largeur d\'épaules, descends comme pour t\'asseoir.'],
      ['Pompes sur les genoux', 'Mains sous les épaules, descends lentement.'],
      ['Fentes alternées', 'Grand pas en avant, genou arrière vers le sol.'],
      ['Gainage', 'Sur les avant-bras, corps en planche, ne creuse pas le dos.'],
      ['Jumping jacks', 'Ou version sans saut : pas de côté + bras.'],
      ['Superman', 'Sur le ventre, lève bras et jambes, tiens 2 s.'],
    ], { work: 40, rest: 20, rounds: 3 }),
  },
  {
    key: 'danse', title: 'Cardio danse', level: 'Énergique', tone: 'rouge',
    note: 'Mets ta playlist (coupé-décalé, gospel, afrobeat) et suis le minuteur.',
    steps: circuit([
      ['Pas chassés', 'De gauche à droite, bras libres.'],
      ['Genoux hauts en rythme', 'Sur le temps de la musique.'],
      ['Talons-fesses', 'Rapide et léger.'],
      ['Pas libre', 'Danse comme tu veux, mais ne t\'arrête pas.'],
      ['Squat + bras en l\'air', 'Descends, remonte et lève les bras.'],
    ], { work: 60, rest: 15, rounds: 3, roundRest: 45 }),
  },
  {
    key: 'marche', title: 'Marche active', level: 'Douce', tone: 'ciel',
    note: 'La version légère du jour : 10 minutes comptent.',
    steps: [
      { name: 'Marche tranquille', sec: 120, cue: 'Épaules relâchées.' },
      { name: 'Marche rapide', sec: 360, cue: 'Tu dois pouvoir parler, mais pas chanter.' },
      { name: 'Retour au calme', sec: 120, cue: 'Ralentis, respire par le nez.' },
    ],
  },
];

export const routineMinutes = (r) => Math.round(r.steps.reduce((s, x) => s + x.sec, 0) / 60);

// ─── Sucre et sel ──────────────────────────────────────────────────────────

export const SOS_ALTERNATIVES = {
  sucre: [
    'Un grand verre d\'eau, d\'un trait',
    'Un fruit entier (orange, papaye, banane)',
    'Une poignée d\'arachides grillées non salées',
    'Marcher 5 minutes dehors',
    'Se brosser les dents',
    'Appeler ou écrire à quelqu\'un',
  ],
  sel: [
    'Un grand verre d\'eau',
    'Assaisonner avec citron, ail, oignon, gingembre ou piment',
    'Des légumes crus (concombre, carotte)',
    'Goûter avant de saler : souvent ça suffit',
  ],
};

export const HIDDEN_SOURCES = {
  sucre: ['Sodas et jus en poudre', 'Sucre dans la bouillie, le thé, le café', 'Biscuits, gâteaux, beignets sucrés', 'Lait concentré sucré', 'Yaourts sucrés et « jus de fruits » industriels'],
  sel: ['Cubes d\'assaisonnement (première source cachée)', 'Chips, cacahuètes salées', 'Charcuterie, sardines en boîte', 'Sauces industrielles, mayonnaise', 'Pain et attiéké du commerce (souvent salés)'],
};

// ─── Esprit ────────────────────────────────────────────────────────────────

export const BIBLE_BOOKS = [
  ['Genèse', 50], ['Exode', 40], ['Josué', 24], ['Ruth', 4], ['1 Samuel', 31], ['Néhémie', 13], ['Esther', 10],
  ['Job', 42], ['Psaumes', 150], ['Proverbes', 31], ['Ecclésiaste', 12], ['Ésaïe', 66], ['Jérémie', 52], ['Daniel', 12],
  ['Jonas', 4], ['Matthieu', 28], ['Marc', 16], ['Luc', 24], ['Jean', 21], ['Actes', 28], ['Romains', 16],
  ['1 Corinthiens', 16], ['2 Corinthiens', 13], ['Galates', 6], ['Éphésiens', 6], ['Philippiens', 4],
  ['Colossiens', 4], ['1 Thessaloniciens', 5], ['1 Timothée', 6], ['2 Timothée', 4], ['Hébreux', 13],
  ['Jacques', 5], ['1 Pierre', 5], ['1 Jean', 5], ['Apocalypse', 22],
];

export const ACTS = [
  { k: 'A', t: 'Adoration', q: 'Qui est Dieu pour moi aujourd\'hui ? Je le loue pour ce qu\'il est.' },
  { k: 'C', t: 'Confession', q: 'Qu\'est-ce que je dois lui remettre ? Je reçois son pardon.' },
  { k: 'T', t: 'Gratitude', q: 'Trois choses précises pour lesquelles je dis merci.' },
  { k: 'S', t: 'Supplication', q: 'Mes sujets en cours, puis ceux des autres.' },
];

export const FAST_KINDS = {
  partiel: { label: 'Partiel', hint: 'Rien jusqu\'à l\'heure choisie, puis repas normal.' },
  total: { label: 'Total', hint: 'Eau seulement, sur la durée choisie.' },
  daniel: { label: 'Daniel', hint: 'Légumes, fruits, céréales et eau. Ni viande, ni sucreries, ni vin.' },
  sec: { label: 'Sec', hint: 'Ni eau ni nourriture. 24 h maximum : écoute ton corps.' },
};

// ─── Service ───────────────────────────────────────────────────────────────

export const ECAA_PILLARS = [
  ['posts', 'Posts'],
  ['activisme', 'Activisme'],
  ['programme', 'Programme'],
];

/** Repères de la saison pour le calendrier editorial d'ECAA (mois 1 a 12). */
export const ECAA_MOMENTS = [
  { month: 11, title: 'Movember', idea: 'La santé mentale des hommes : briser le « un homme ne pleure pas ».' },
  { month: 11, title: 'Fatigue de fin de semestre', idea: 'Épuisement des étudiants : reconnaître les signes, oser demander de l\'aide.' },
  { month: 12, title: 'Le blues des fêtes', idea: 'Les fêtes peuvent être douloureuses : solitude, deuil, pression. Comment entourer quelqu\'un.' },
  { month: 12, title: 'Bilan de fin d\'année', idea: 'Témoignages (anonymes) d\'espoir et ce qu\'ECAA a vécu cette année.' },
  { month: 1, title: 'Nouveau départ', idea: 'Les résolutions sans culpabilité : avancer à son rythme.' },
  { month: 10, title: '10 octobre — Journée mondiale de la santé mentale', idea: 'Campagne phare de l\'année.' },
];

export const BOARD_STATUSES = [
  ['idee', 'Idées'],
  ['en_cours', 'En cours'],
  ['pret', 'Prêt'],
  ['fait', 'Fait'],
];

export const CONTENT_PLATFORMS = ['Instagram', 'TikTok', 'WhatsApp', 'Facebook', 'YouTube', 'LinkedIn', 'Autre'];

// ─── Art oratoire ──────────────────────────────────────────────────────────

export const DEBATE_TOPICS = [
  'Les réseaux sociaux rapprochent-ils ou isolent-ils ?',
  'Faut-il parler de santé mentale à l\'église ?',
  'L\'école prépare-t-elle vraiment à la vie ?',
  'Vaut-il mieux être aimé ou respecté ?',
  'La réussite se mesure-t-elle à l\'argent ?',
  'Faut-il tout pardonner ?',
  'Les jeunes Africains doivent-ils partir pour réussir ?',
  'Le français est-il un atout ou un frein pour nos langues locales ?',
  'La discipline vaut-elle mieux que le talent ?',
  'Doit-on toujours dire la vérité ?',
  'L\'intelligence artificielle menace-t-elle la créativité ?',
  'Le mariage est-il encore une priorité pour notre génération ?',
  'Faut-il rendre le service civique obligatoire ?',
  'La foi et la science s\'opposent-elles ?',
];

export const SPEECH_KINDS = [
  ['impro', 'Improvisation'],
  ['prepare', 'Discours préparé'],
  ['expose', 'Exposé'],
  ['debat', 'Argumentaire'],
  ['lecture', 'Lecture à voix haute'],
];

export const SPEECH_PROMPTS = [
  'Présente-toi en 1 minute comme devant un jury.',
  'Raconte un moment où tu as eu peur et ce que tu en as appris.',
  'Défends ton livre préféré en 2 minutes.',
  'Explique ECAA à quelqu\'un qui n\'en a jamais entendu parler.',
  'Le mot du jour : utilise-le trois fois dans une histoire.',
  'Convaincs-moi de faire du sport cette semaine.',
  'Un verset qui t\'habite : explique-le simplement.',
  'Décris ton quartier pour qu\'on s\'y voie.',
];

export const SPEECH_CRITERIA = [
  ['clarity', 'Clarté', 'Les idées sont faciles à suivre.'],
  ['pace', 'Débit', 'Ni trop vite, ni trop lent, avec des silences.'],
  ['structure', 'Structure', 'Une intro, un fil, une conclusion.'],
  ['voice', 'Voix', 'Volume, intonation, articulation.'],
  ['presence', 'Présence', 'Assurance, conviction.'],
  ['fillers', 'Sans tics', 'Peu de « euh », « en fait », « du coup ».'],
];
