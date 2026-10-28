/**
 * La visite guidee : un parcours dans la vraie app. Chaque etape ouvre une
 * page (`route`), eclaire un element (`target`, selecteurs data-tour par ordre
 * de preference) et l'explique. Sans cible trouvee, la bulle s'affiche au centre.
 */
export const GUIDED_TOUR = [
  {
    key: 'bienvenue', route: '/', kicker: 'Bienvenue',
    title: 'On fait le tour ensemble ?',
    text: 'Deux minutes pour découvrir Kairos là où tu vas t\'en servir. Je te montre chaque endroit, tu n\'as rien à toucher.',
  },
  {
    key: 'checkin', route: '/', target: ['[data-tour="checkin"]', '[data-tour="journee"]'], kicker: 'Ton jour',
    title: 'Le check-in du matin',
    text: 'Chaque matin : sommeil, énergie, humeur. 10 secondes. Si l\'énergie est basse, Kairos passe en jour léger et te propose la version minimale de chaque habitude.',
  },
  {
    key: 'frise', route: '/', target: ['[data-tour="frise"]'], kicker: 'Ton jour',
    title: 'Ta frise',
    text: 'Tes rendez-vous à heure fixe, tes cours et les séances placées, dans l\'ordre. La ligne rouge « maintenant » te montre où tu en es.',
  },
  {
    key: 'pointer', route: '/', target: ['[data-tour="check"]'], kicker: 'Ton jour',
    title: 'Pointer',
    text: 'Touche ce rond quand c\'est fait : il devient vert. Touche-le encore pour choisir version légère, manqué ou jour de repos (maladie, voyage) qui ne casse pas ta série.',
  },
  {
    key: 'sos', route: '/', target: ['[data-tour="sos"]'], kicker: 'Ton jour',
    title: 'SOS envie',
    text: 'Une envie de sucré ou de salé ? Touche ici : 10 minutes et une alternative pour la laisser passer.',
  },
  {
    key: 'plus', route: '/', target: ['[data-tour="plus"]'], kicker: 'Partout',
    title: 'Le bouton +',
    text: 'Sur chaque page : noter une idée, un mot, un sujet de prière, un devoir, un verre d\'eau. Deux taps, et tu continues ta journée.',
  },
  {
    key: 'semaine', route: '/semaine?onglet=planning', target: ['[data-tour="placer"]'], kicker: 'Semaine',
    title: 'Le dimanche, tu places ta semaine',
    text: 'Ce bouton range sport, anglais, ECAA et contenu dans tes vrais créneaux libres, calculés depuis ton emploi du temps. Tu ajustes, puis tu valides.',
  },
  {
    key: 'bilan', route: '/semaine?onglet=bilan', target: ['[data-tour="bilan"]'], kicker: 'Semaine',
    title: 'Le bilan du dimanche',
    text: 'Tes chiffres, ce que Kairos remarque (sommeil, retards, envies), et ta leçon de la semaine. 10 minutes qui changent la suivante.',
  },
  {
    key: 'meditation', route: '/esprit?onglet=meditation', target: ['[data-tour="plan-lecture"]'], kicker: 'Esprit',
    title: 'Ta méditation est prête',
    text: 'Le chapitre du jour est déjà choisi par ton plan de lecture. Tu écris en dessous : Écriture, Observation, Application, Prière.',
  },
  {
    key: 'priere', route: '/esprit?onglet=priere', target: ['[data-tour="mode-priere"]'], kicker: 'Esprit',
    title: 'Le mode prière',
    text: 'Plein écran, une carte à la fois : l\'adoration, la confession, la gratitude, puis tes sujets. Tu glisses pour passer. Les prières exaucées rejoignent ton mur des exaucements.',
  },
  {
    key: 'intercession', route: '/service?onglet=intercession', target: ['[data-tour="intercession"]'], kicker: 'Service',
    title: 'L\'intercession tournante',
    text: 'Chaque jour, une liste courte, plus ceux que tu n\'as pas portés depuis longtemps. Personne n\'est oublié sur la semaine.',
  },
  {
    key: 'formation', route: '/service?onglet=formation', target: ['[data-tour="formation"]'], kicker: 'ECAA',
    title: 'Ta formation d\'écoutante',
    text: '13 leçons courtes : la dépression, l\'écoute active, le risque suicidaire, orienter, prendre soin de toi. Une par semaine suffit.',
  },
  {
    key: 'crise', route: '/service?onglet=ecoute', target: ['[data-tour="crise"]'], kicker: 'ECAA',
    title: 'En cas de crise',
    text: 'Si quelqu\'un parle de mourir : ce bouton donne les 7 étapes et tes contacts d\'urgence, appelables d\'un tap. Remplis tes contacts dès cette semaine.',
  },
  {
    key: 'seances', route: '/corps?onglet=seances', target: ['[data-tour="seances"]'], kicker: 'Corps',
    title: 'Des séances guidées',
    text: 'Choisis une séance, pose le téléphone : le minuteur enchaîne les exercices et vibre à chaque changement. La séance « Découverte » est parfaite pour reprendre.',
  },
  {
    key: 'etudes', route: '/etudes?onglet=plan', target: ['[data-tour="quoi-etudier"]'], kicker: 'Études',
    title: 'Quoi étudier maintenant ?',
    text: 'Kairos choisit pour toi : une révision qui arrive à échéance, un devoir urgent, ou le chapitre le plus pressé. Tu touches « Commencer ».',
  },
  {
    key: 'matieres', route: '/etudes?onglet=matieres', target: ['[data-tour="ajout-matiere"]'], kicker: 'Études',
    title: 'Ajoute tes matières',
    text: 'Puis leurs chapitres et la date d\'examen. Chaque chapitre vu revient en révision à J+1, J+3, J+7, J+14, J+30 : c\'est ce qui fait vraiment retenir.',
  },
  {
    key: 'rappels', route: '/reglages', target: ['[data-tour="rappels"]'], kicker: 'Réglages',
    title: 'Active tes rappels',
    text: 'Pour que la méditation, la prière et l\'intercession t\'appellent à l\'heure exacte. Sur iPhone, ouvre d\'abord Kairos depuis l\'icône de l\'écran d\'accueil.',
  },
  {
    key: 'emploi', route: '/reglages', target: ['[data-tour="emploi"]'], kicker: 'Réglages',
    title: 'Ton emploi du temps',
    text: 'Saisis tes cours une fois : Kairos en déduit tes créneaux libres pour placer tes séances. Juste au-dessus, « Ma règle de vie » te laisse changer tes heures.',
  },
  {
    key: 'fin', route: '/', kicker: 'C\'est parti',
    title: 'Fidèle dans les petites choses',
    text: 'Le guide complet est dans Réglages → Guide, et chaque page a un bouton « ? ». Tu peux refaire cette visite quand tu veux depuis le guide.',
  },
];
