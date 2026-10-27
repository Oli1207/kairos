/**
 * Le didacticiel : visite d'accueil, guide complet et aide de chaque page.
 * Ecrit pour elle, au tutoiement, sans jargon.
 */

export const TOUR = [
  {
    key: 'bienvenue',
    title: 'Bienvenue dans Kairos',
    text: 'Kairos, c\'est « le temps fixé ». Ta saison tient sur une idée : des rendez-vous sacrés à heure fixe, et tout le reste s\'organise autour. Cette visite prend 1 minute.',
    art: 'soleil',
  },
  {
    key: 'jour',
    title: 'Ton jour, d\'un coup d\'œil',
    text: 'L\'écran Jour montre ta frise : rendez-vous, cours et séances placées, avec la ligne rouge « maintenant ». Touche le rond à droite pour pointer. Touche-le encore pour choisir « version légère », « manqué » ou « jour de repos ».',
    art: 'frise',
  },
  {
    key: 'leger',
    title: 'Jour plein ou jour léger',
    text: 'Chaque matin, un check-in de 10 secondes : sommeil, énergie, humeur. Si l\'énergie est basse, Kairos passe en jour léger : chaque habitude affiche sa version minimale. Faire un peu compte : on ne casse pas la chaîne. Tes rendez-vous avec Dieu, eux, restent.',
    art: 'leger',
  },
  {
    key: 'semaine',
    title: 'Le dimanche, tu prends le volant',
    text: 'Dans Semaine : le bilan (ce qui a tenu, ce que je remarque), puis le Planning. « Placer automatiquement » range sport, anglais, ECAA et contenu dans tes vrais créneaux libres, calculés à partir de ton emploi du temps.',
    art: 'semaine',
  },
  {
    key: 'esprit',
    title: 'Esprit et service',
    text: 'Méditation guidée (Écriture, Observation, Application, Prière), sujets de prière et mur des exaucements, jeûne avec compteur. Pour l\'intercession, le Mode prière te présente une carte à la fois : tu glisses, tu passes à la suivante.',
    art: 'priere',
  },
  {
    key: 'ecaa',
    title: 'ECAA, comme une pro',
    text: 'Une formation complète d\'aidante (écoute active, repérage du risque suicidaire, orientation, prendre soin de toi), un protocole de crise en un tap, un journal d\'écoute sans données sur les personnes, et le tableau de la vision d\'ECAA.',
    art: 'ecaa',
  },
  {
    key: 'etudes',
    title: 'Étudier mieux, pas plus',
    text: 'Le tableau de bord te dit quoi étudier maintenant. Kairos utilise ce qui marche : se tester plutôt que relire, revoir chaque chapitre à J+1, J+3, J+7, J+14, J+30, et alterner les matières. Les devoirs et les examens sont suivis jour par jour.',
    art: 'etudes',
  },
  {
    key: 'plus',
    title: 'Le bouton +',
    text: 'En bas à droite, partout : noter une idée, un mot, un sujet de prière, un devoir, un verre d\'eau, ou lancer le SOS envie. Deux taps, et tu retournes à ta vie.',
    art: 'plus',
  },
  {
    key: 'iphone',
    title: 'Dernière étape : l\'installer',
    text: 'Dans Safari : bouton Partager, puis « Sur l\'écran d\'accueil ». Ouvre Kairos depuis l\'icône, puis Réglages → Activer les rappels. Le guide complet reste dans Réglages → Guide, et chaque page a un bouton « ? ».',
    art: 'iphone',
  },
];

export const GUIDE = [
  {
    key: 'demarrer',
    title: 'Bien démarrer (15 minutes, une seule fois)',
    intro: 'Ces réglages rendent tout le reste intelligent. Fais-les avant le 1er novembre.',
    steps: [
      ['Installe l\'app', 'Safari → Partager → « Sur l\'écran d\'accueil ». Ouvre-la toujours depuis l\'icône.'],
      ['Active les rappels', 'Réglages → Rappels → Activer. Accepte les notifications.'],
      ['Règle tes heures', 'Réglages → Mon rythme : réveil et coucher. Elles servent à trouver tes créneaux libres et à protéger ton sommeil.'],
      ['Saisis ton emploi du temps', 'Réglages → Mon emploi du temps : chaque cours, une fois. Kairos en déduit tes trous.'],
      ['Vérifie tes rendez-vous', 'Réglages → Ma règle de vie : ajuste les heures de méditation, prière, intercession. Touche une habitude pour la modifier.'],
      ['Ajoute tes matières', 'Études → Matières : chaque matière, ses chapitres, et la date d\'examen si tu la connais.'],
      ['Place ta première semaine', 'Semaine → Planning → Placer automatiquement, puis Valider.'],
    ],
  },
  {
    key: 'jour',
    title: 'L\'écran Jour',
    intro: 'Ton point de départ, matin, midi et soir.',
    steps: [
      ['Le check-in du matin', 'Sommeil, énergie, humeur. 10 secondes. Si l\'énergie est à 1 ou 2, Kairos te propose un jour léger.'],
      ['Pointer', 'Touche le rond à droite d\'une activité : il devient vert. Pour un rendez-vous à heure fixe, Kairos note ton éventuel retard : orange veut dire « rattrapé ».'],
      ['Corriger un pointage', 'Touche le rond déjà coché : fait, version légère, manqué, jour de repos ou effacer.'],
      ['Jour de repos', 'Malade, en voyage, en période difficile ? « Jour de repos » ne casse pas ta série. Utilise-le honnêtement, pas pour éviter.'],
      ['Sucre et sel', 'Le soir, réponds « Tenu » ou « Écart » pour chacun. Les séries se calculent seules.'],
      ['Le bilan du soir', 'À partir de 18 h : un merci, une victoire, une chose à mieux faire demain. Une minute.'],
    ],
    tips: ['La pastille rouge sur l\'icône de l\'app indique ce qu\'il te reste à pointer aujourd\'hui.'],
  },
  {
    key: 'semaine',
    title: 'La semaine',
    intro: 'Le dimanche soir, 15 minutes qui font toute la différence.',
    steps: [
      ['Progrès', 'Une jauge par habitude. Les rendez-vous fragiles (souvent en retard) sont signalés en orange.'],
      ['Bilan', 'Tes chiffres, ce que Kairos remarque (sommeil, envies, retards), tes victoires. Écris ta leçon et ton focus pour la semaine suivante.'],
      ['Planning', 'Passe à la semaine suivante (flèche), puis « Placer automatiquement ». Kairos espace les séances d\'une même activité et ne surcharge aucune soirée. Retire ou ajoute à la main avec le +.'],
    ],
  },
  {
    key: 'esprit',
    title: 'Esprit',
    intro: 'Des heures fixes, non négociables.',
    steps: [
      ['Méditer', 'Esprit → Méditation. Le passage du jour est déjà prêt grâce au plan de lecture. Remplis É, O, A, P. Le verset peut aller dans « Versets à mémoriser ».'],
      ['Prier', 'Esprit → Prière. Ajoute tes sujets. Quand Dieu répond, touche « Exaucé » et écris ton témoignage : il rejoint le mur des exaucements.'],
      ['Mode prière', 'Le bouton Mode prière te présente l\'A.C.T.S. puis tes sujets, une carte à la fois. Glisse vers la gauche ou touche « Amen ».'],
      ['Jeûner', 'Esprit → Jeûne → Planifier : type, horaires, intention. Pendant le jeûne, le compteur s\'affiche aussi sur l\'écran Jour. À la rupture, écris ce que Dieu t\'a montré.'],
      ['Mémoriser des versets', 'Esprit → Versets → Réviser. « Je savais » éloigne la carte, « À revoir » la ramène demain.'],
    ],
  },
  {
    key: 'service',
    title: 'Service et ECAA',
    intro: 'Servir longtemps, et bien.',
    steps: [
      ['L\'intercession tournante', 'Service → Intercession. Chaque personne ou cause a son jour. Kairos y ajoute ceux que tu n\'as pas portés depuis 10 jours. Lance le Mode prière.'],
      ['La formation', 'Service → Formation : 13 leçons courtes. Pour chacune, lis, mets en pratique dans la semaine, note ta réflexion, et ajoute les questions de rappel à tes cartes.'],
      ['Après une écoute', 'Service → Écoute : type, durée, ton ressenti, un débrief sans nom ni détail reconnaissable. Coche « débriefé » quand tu en as parlé à ton référent.'],
      ['En cas de crise', 'Le bouton rouge « Protocole de crise » : les 7 étapes et tes contacts d\'urgence, appelables d\'un tap. Remplis « Orienter » dès maintenant.'],
      ['Le tableau ECAA', 'Service → ECAA : posts, activisme, programme. Fais avancer chaque idée vers « Fait ». Les posts ont une checklist de communication sûre.'],
      ['Groupe de parole', 'Service → ECAA → Préparer un groupe de parole : modèle de séance de 90 minutes, à ajouter au programme.'],
    ],
    tips: ['Tu es une aidante, pas une thérapeute : repérer, écouter, orienter. Et prendre soin de toi fait partie du service.'],
  },
  {
    key: 'corps',
    title: 'Corps',
    intro: 'Bouger, manger simple, couper le sucre et le sel.',
    steps: [
      ['Faire une séance', 'Corps → Séances → choisis une séance. Le minuteur enchaîne les exercices et vibre à chaque changement. Garde le téléphone posé devant toi.'],
      ['SOS envie', 'Une envie de sucré ou de salé ? SOS envie (aussi via le bouton +). Note le déclencheur, laisse passer 10 minutes avec une alternative, puis dis si tu as tenu.'],
      ['Les repas', 'Corps → Repas : équilibré, moyen ou écart, en un tap. Vise la règle de l\'assiette : ½ légumes, ¼ protéines, ¼ féculents.'],
      ['La pesée', 'Une fois par semaine, le même jour, le matin. Regarde la courbe verte (la moyenne), pas chaque chiffre.'],
    ],
  },
  {
    key: 'etudes',
    title: 'Études',
    intro: 'Moins de stress, plus de mémoire.',
    steps: [
      ['Quoi étudier maintenant ?', 'Études → Tableau de bord. Touche « Commencer » : Kairos choisit entre une révision due, un devoir urgent ou le prochain chapitre de la matière la plus pressée.'],
      ['La session de concentration', 'Annonce un objectif précis, travaille, gare tes pensées parasites dans le champ prévu, puis note ta concentration. Kairos trouvera tes meilleures heures.'],
      ['Le cycle d\'un chapitre', '« Je l\'ai vu » après ton premier passage. Ensuite, le rappel actif revient à J+1, J+3, J+7, J+14, J+30. Après J+30 réussi : maîtrisé.'],
      ['Le rappel actif', 'Réponds de tête aux questions du chapitre, ou fais la page blanche : cours fermé, écris tout ce que tu sais, puis compare. Tes oublis deviennent des questions.'],
      ['Expliquer simplement', 'Explique le chapitre comme à un enfant de 12 ans. Là où tu bloques, c\'est ce qu\'il faut revoir.'],
      ['Plan d\'examen', 'Matières → une matière → date d\'examen → Plan d\'examen : les chapitres à voir sont répartis jusqu\'à la veille.'],
      ['Devoirs', 'Études → Devoirs : note chaque devoir dès qu\'il est donné. La barre des 14 jours montre les jours chargés à anticiper.'],
    ],
    tips: ['Relire et surligner donnent l\'impression de savoir. Se tester, même mal, fait vraiment retenir.'],
  },
  {
    key: 'passion',
    title: 'Art oratoire, anglais, finance, contenu',
    intro: 'Tes passions, un peu chaque semaine.',
    steps: [
      ['Vocabulaire', 'Études → Mots : ajoute les mots croisés en lisant. Chaque jour, l\'écran Jour te propose un mot à placer dans une vraie conversation.'],
      ['Lecture', 'Études → Lecture : note la page où tu t\'arrêtes. Kairos calcule ton rythme et ta date de fin. Garde les citations qui te parlent.'],
      ['Prise de parole', 'Études → Oral : choisis un sujet, enregistre-toi, réécoute, note-toi sur 6 critères. La courbe montre tes progrès.'],
      ['Argumenter', 'Études → Argumenter : thèse, 3 arguments, l\'objection la plus forte et ta réponse. Puis défends-le à l\'oral.'],
      ['Anglais', 'Études → Anglais : la compétence la moins travaillée est proposée. 30 minutes, 3 fois par semaine.'],
      ['Culture financière', 'Études → Finance : un thème par semaine, des questions, une action concrète à cocher.'],
      ['Contenu', 'Études → Contenu : note tes idées en 5 secondes, travaille-les par micro-créneaux de 15 minutes.'],
    ],
  },
  {
    key: 'journee',
    title: 'Une journée type avec Kairos',
    intro: 'Un exemple, à adapter.',
    steps: [
      ['5 h 30', 'Notification : méditation. Journal É.O.A.P. Pointé automatiquement à l\'enregistrement.'],
      ['6 h', 'Prière en Mode prière : A.C.T.S., puis tes sujets.'],
      ['6 h 30', 'Check-in du matin. Coup d\'œil sur l\'écran Jour.'],
      ['Entre les cours', 'Une session de concentration, ou un rappel actif de 20 minutes.'],
      ['17 h 30', 'Séance de sport placée dimanche.'],
      ['21 h', 'Intercession en Mode prière.'],
      ['21 h 45', 'Bilan du soir : sucre, sel, merci, victoire. Écran coupé.'],
      ['22 h 30', 'Coucher. Tes matins se décident le soir.'],
    ],
  },
  {
    key: 'faq',
    title: 'Questions fréquentes',
    intro: '',
    steps: [
      ['J\'ai raté un jour, tout est fichu ?', 'Non. Une journée manquée ne compte pas, deux de suite commencent une habitude. Reprends le lendemain, en version légère s\'il le faut.'],
      ['Je ne reçois pas les notifications', 'Sur iPhone, elles ne marchent que si l\'app est ouverte depuis l\'icône de l\'écran d\'accueil. Vérifie aussi Réglages iPhone → Notifications → Kairos.'],
      ['Je veux changer une heure ou une habitude', 'Réglages → Ma règle de vie → touche l\'habitude. Tu peux aussi l\'archiver : l\'historique est gardé.'],
      ['Mes données sont-elles privées ?', 'Oui. Chaque compte ne voit que ses propres données, et les débriefs d\'écoute ne doivent jamais contenir de nom.'],
      ['Ça marche sans internet ?', 'Tu peux consulter les dernières données. Pour enregistrer, il faut le réseau : un message te le dit si ça échoue.'],
    ],
  },
];

/** Aide contextuelle : quelle section du guide ouvre le « ? » de chaque page. */
export const PAGE_HELP = { jour: 'jour', semaine: 'semaine', esprit: 'esprit', service: 'service', corps: 'corps', etudes: 'etudes' };
