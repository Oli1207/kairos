/**
 * Formation ECAA : ecouter et accompagner des personnes en souffrance
 * psychique, en aidante non professionnelle.
 *
 * Principes retenus :
 * - repérer, écouter, orienter : jamais diagnostiquer ni soigner seule ;
 * - premiers secours en santé mentale (démarche AÉRER, adaptée de ALGEE) ;
 * - demander directement si la personne pense au suicide : cela n'augmente pas
 *   le risque, cela soulage souvent ;
 * - communication publique « sûre » sur le suicide (pas de méthode, pas de
 *   glorification, toujours des ressources) ;
 * - la santé de l'écoutante fait partie du dispositif.
 */

export const TRACK = 'ecaa';

export const LESSONS = [
  {
    key: 'depression',
    title: 'Comprendre la dépression',
    minutes: 25,
    goal: 'Distinguer tristesse et dépression, et savoir ce qu\'elle n\'est pas.',
    points: [
      'La tristesse est une émotion normale, liée à un événement, qui passe. La dépression est un état qui dure (au moins deux semaines, presque tous les jours) et qui envahit toute la vie.',
      'Les deux signes centraux : une humeur triste ou vide, et la perte d\'intérêt ou de plaisir pour ce qu\'on aimait.',
      'Souvent avec : fatigue, sommeil perturbé (trop ou pas assez), appétit modifié, difficulté à se concentrer, sentiment d\'inutilité ou de culpabilité excessive, lenteur ou agitation, pensées de mort.',
      'Chez beaucoup de personnes, elle se dit avec le corps : maux de tête, douleurs, « je suis fatigué », irritabilité plutôt que larmes, surtout chez les hommes et les jeunes.',
      'Les causes sont multiples et mêlées : biologiques, psychologiques (deuils, violences, stress), sociales (précarité, isolement) et spirituelles. Ce n\'est ni une faiblesse, ni un manque de foi, ni une attaque mystique.',
      'Elle se soigne : psychothérapie, parfois médicaments prescrits par un médecin, soutien de l\'entourage. Ton rôle : repérer, écouter, orienter. Pas diagnostiquer.',
    ],
    practice: 'Cette semaine, repère dans une conversation ordinaire la différence entre « je suis triste » et « je ne ressens plus rien ». Note ce que tu as entendu, sans nom.',
    reflect: 'Quelles idées reçues sur la dépression as-tu entendues autour de toi (église, famille, université) ? Laquelle te semble la plus dangereuse ?',
    recall: [
      ['Les deux signes centraux de la dépression ?', 'Humeur triste ou vide, et perte d\'intérêt ou de plaisir, presque tous les jours pendant au moins deux semaines.'],
      ['Mon rôle face à une personne qui semble déprimée ?', 'Repérer, écouter, orienter. Pas diagnostiquer ni soigner seule.'],
    ],
  },
  {
    key: 'ecoute',
    title: 'L\'écoute active',
    minutes: 30,
    goal: 'Aider la personne à se sentir entendue, sans la diriger.',
    points: [
      'La posture avant la technique : présence entière (téléphone rangé), curiosité, non-jugement. La personne n\'a pas besoin d\'une solution, elle a besoin d\'être comprise.',
      'Questions ouvertes : « Qu\'est-ce qui se passe pour toi en ce moment ? », « Comment tu vis ça ? ». On évite les « pourquoi », qui sonnent comme un reproche.',
      'Reformuler : redire avec tes mots ce que tu as compris. « Si je te suis bien, depuis ton échec tu as l\'impression de décevoir tout le monde. »',
      'Refléter l\'émotion : nommer ce que tu perçois. « J\'entends beaucoup de fatigue dans ce que tu dis. » Si tu te trompes, la personne te corrige : c\'est utile.',
      'Résumer de temps en temps, pour structurer et montrer que tu suis.',
      'Accueillir les silences : compter jusqu\'à cinq avant de parler. C\'est souvent après un silence que vient l\'essentiel.',
      'Parler peu : vise 20 % de parole pour toi, 80 % pour elle ou lui.',
    ],
    practice: 'Dans une conversation de la semaine, fais au moins trois reformulations et un silence volontaire. Note l\'effet produit.',
    reflect: 'Qu\'est-ce qui te pousse le plus à interrompre ou à conseiller ? Comment le repérer en toi ?',
    recall: [
      ['Quatre outils de l\'écoute active ?', 'Questions ouvertes, reformulation, reflet des émotions, résumé (et les silences).'],
      ['Pourquoi éviter les « pourquoi » ?', 'Ils sonnent comme une demande de justification ou un reproche.'],
    ],
  },
  {
    key: 'pieges',
    title: 'Ce qu\'on évite de dire',
    minutes: 20,
    goal: 'Remplacer les réponses qui blessent par des réponses qui ouvrent.',
    points: [
      '« D\'autres ont pire que toi » : compare et culpabilise. À la place : « Ce que tu vis est vraiment lourd pour toi. »',
      '« Il faut te secouer / sortir / penser positif » : la dépression n\'est pas un manque de volonté. À la place : « Qu\'est-ce qui t\'aiderait un peu, aujourd\'hui ? »',
      '« Tu dois prier plus », « C\'est un esprit » : spiritualiser trop vite enferme dans la honte et retarde les soins. À la place : « Est-ce que tu aimerais qu\'on prie ensemble, en plus de chercher de l\'aide ? »',
      '« Je sais exactement ce que tu ressens » suivi de ta propre histoire : ça déplace l\'attention vers toi.',
      '« Je te promets de ne le dire à personne » : tu ne peux pas le promettre si sa vie est en danger. Dis plutôt : « Ce que tu me dis reste entre nous, sauf si ta sécurité est en jeu. »',
      'Les conseils précipités. Avant de proposer quoi que ce soit, demande : « Tu veux que je t\'écoute, ou que je t\'aide à chercher des pistes ? »',
    ],
    practice: 'Écris trois phrases que tu as déjà dites ou entendues et qui blessent, puis leur version qui ouvre.',
    reflect: 'Laquelle de ces réponses te vient le plus naturellement ? Pourquoi, selon toi ?',
    recall: [
      ['Que dire au lieu de promettre le secret absolu ?', '« Ça reste entre nous, sauf si ta sécurité est en jeu. »'],
      ['Question à poser avant de donner un conseil ?', '« Tu veux que je t\'écoute, ou que je t\'aide à chercher des pistes ? »'],
    ],
  },
  {
    key: 'validation',
    title: 'Valider les émotions',
    minutes: 20,
    goal: 'Reconnaître ce que la personne ressent comme compréhensible.',
    points: [
      'Valider ne veut pas dire approuver un comportement. C\'est dire : « Vu ce que tu vis, c\'est compréhensible que tu ressentes ça. »',
      'Une émotion validée baisse en intensité. Une émotion contestée (« ne pleure pas ») monte ou se cache.',
      'Formule simple : je vois + je comprends + c\'est normal. « Je vois que tu es épuisée. Avec tout ce que tu portes, je comprends. Beaucoup de gens le seraient. »',
      'Ne valide pas ce qui est faux (« oui, tu es nulle ») : valide l\'émotion, pas le jugement. « Tu te sens nulle en ce moment, et c\'est douloureux. »',
    ],
    practice: 'Réponds par écrit à : « Je n\'en peux plus, je rate tout. » Une réponse qui valide sans approuver le jugement.',
    reflect: 'Quand t\'es-tu sentie validée pour la dernière fois ? Qu\'est-ce que ça a changé ?',
    recall: [['Valider, est-ce approuver ?', 'Non : on reconnaît l\'émotion comme compréhensible, sans approuver un comportement ni un jugement faux.']],
  },
  {
    key: 'suicide',
    title: 'Repérer le risque suicidaire',
    minutes: 35,
    goal: 'Oser poser la question et évaluer l\'urgence.',
    points: [
      'Signaux d\'alerte : parler de mourir ou de disparaître ; dire qu\'on est un fardeau ; désespoir (« ça ne changera jamais ») ; s\'isoler ; donner ses affaires ; faire des adieux ; un calme soudain après une période très sombre.',
      'Facteurs de risque : tentative passée, dépression, alcool ou drogues, deuil, rupture, violences, humiliation, accès à un moyen. Facteurs de protection : liens, foi vécue comme soutien, projets, accès aux soins.',
      'Poser la question directement, avec des mots clairs : « Est-ce que tu penses à te suicider ? » ou « à te tuer ? ». Parler du suicide n\'en donne pas l\'idée. Pour la personne qui y pense, c\'est souvent un soulagement.',
      'Si oui, évaluer avec calme : « Est-ce que tu as pensé à comment ? » (plan), « Tu as ce qu\'il faut ? » (moyen), « Quand ? » (délai). Plus le plan est précis, le moyen accessible et le délai court, plus l\'urgence est grande.',
      'Ne jamais minimiser, ne jamais lancer un défi, ne jamais rester seule avec cette information.',
    ],
    practice: 'Entraîne-toi à voix haute (onglet Oral) à poser la question directe, jusqu\'à ce qu\'elle sorte sans hésiter.',
    reflect: 'Qu\'est-ce qui te fait peur dans l\'idée de poser la question ? Qu\'est-ce qui pourrait t\'aider ?',
    recall: [
      ['Parler du suicide augmente-t-il le risque ?', 'Non. Poser la question directement soulage souvent et ouvre la parole.'],
      ['Trois questions pour évaluer l\'urgence ?', 'Comment ? (plan) · As-tu le moyen ? · Quand ? (délai)'],
      ['Un signal d\'alerte souvent mal compris ?', 'Un calme soudain après une période très sombre.'],
    ],
  },
  {
    key: 'crise',
    title: 'Le protocole de crise',
    minutes: 25,
    goal: 'Savoir quoi faire, dans l\'ordre, quand une vie est en danger.',
    points: [
      'Le protocole complet est dans l\'onglet Écoute, bouton « Protocole de crise », accessible en un tap pendant un appel.',
      'Danger immédiat : ne pas laisser la personne seule. Si tu es à distance, garde-la en ligne pendant qu\'un proche va sur place.',
      'Éloigner les moyens (médicaments, produits, objets) avec l\'accord de la personne et l\'aide d\'un proche.',
      'Appeler les secours, un professionnel ou un proche de confiance. La confidentialité s\'arrête là où commence la sécurité.',
      'Après la crise : informer ton référent ECAA, débriefer, noter ce qui a été fait, prendre soin de toi. Une crise ne se garde pas pour soi.',
    ],
    practice: 'Remplis la fiche « Orienter » avec les numéros d\'urgence de ta ville et au moins un professionnel joignable. Vérifie chaque numéro en appelant.',
    reflect: 'Qui est ton référent à appeler après une écoute difficile ? Si tu n\'en as pas, qui pourrait l\'être ?',
    recall: [
      ['Première règle en cas de danger immédiat ?', 'Ne pas laisser la personne seule.'],
      ['Quand la confidentialité s\'arrête-t-elle ?', 'Quand la sécurité de la personne ou d\'autrui est en jeu.'],
    ],
  },
  {
    key: 'orienter',
    title: 'Orienter vers un professionnel',
    minutes: 20,
    goal: 'Transformer « tu devrais consulter » en un premier pas réel.',
    points: [
      'Psychologue : écoute et psychothérapie, sans médicaments. Psychiatre : médecin, peut prescrire. Médecin généraliste : souvent la première porte, peut orienter et vérifier une cause physique.',
      'Orienter quand : les symptômes durent plus de deux semaines, la vie quotidienne est touchée (cours, travail, hygiène), il y a des idées de mort, de l\'alcool ou des drogues, ou quand tu te sens dépassée.',
      'Lever les freins un par un : honte (« ce n\'est pas être fou »), coût (structures publiques, associations, consultations à tarif réduit), peur (« tu peux juste aller voir une fois »).',
      'Proposer d\'accompagner : chercher le numéro ensemble, être là pendant l\'appel, l\'accompagner au premier rendez-vous.',
      'Continuer à être présente après : orienter, ce n\'est pas se débarrasser.',
    ],
    practice: 'Identifie deux professionnels ou structures de santé mentale accessibles à Abidjan (ou dans ta ville) et ajoute-les dans « Orienter ».',
    reflect: 'Quel frein entends-tu le plus souvent ? Quelle réponse simple pourrais-tu y apporter ?',
    recall: [['Différence psychologue / psychiatre ?', 'Le psychiatre est médecin et peut prescrire. Le psychologue fait de l\'écoute et de la psychothérapie.']],
  },
  {
    key: 'foi',
    title: 'Foi et santé mentale',
    minutes: 20,
    goal: 'Unir accompagnement spirituel et soin, sans les opposer.',
    points: [
      'La Bible ne cache pas la détresse : les psaumes de lamentation (Psaumes 42, 88), Élie qui demande à mourir (1 Rois 19), Jésus « triste jusqu\'à la mort » (Matthieu 26.38).',
      'En 1 Rois 19, Dieu donne d\'abord à Élie du sommeil et de la nourriture, deux fois, avant de lui parler. Le soin du corps et du repos fait partie de la réponse.',
      'Prier avec quelqu\'un et l\'orienter vers un soin ne s\'opposent pas. On prie aussi pour un malade qu\'on emmène chez le médecin.',
      'Éviter de faire porter la faute (« péché », « manque de foi », « attaque ») : cela ajoute la honte à la souffrance et éloigne des soins.',
      'Travailler avec les pasteurs : les former, les informer, en faire des relais d\'orientation.',
    ],
    practice: 'Prépare un post ECAA à partir d\'Élie en 1 Rois 19 : « Dieu a commencé par du repos et du pain. »',
    reflect: 'Comment parler de santé mentale dans ton église sans heurter, et sans te taire ?',
    recall: [['Que fait Dieu en premier pour Élie épuisé (1 Rois 19) ?', 'Il lui donne du sommeil et de la nourriture, deux fois, avant de lui parler.']],
  },
  {
    key: 'cadre',
    title: 'Confidentialité et limites',
    minutes: 20,
    goal: 'Protéger les personnes écoutées et se protéger soi-même.',
    points: [
      'Ce qui est confié reste confidentiel. On n\'en parle qu\'en supervision, de façon anonyme. Jamais de nom, de capture d\'écran ou de détail reconnaissable, même dans un groupe de prière.',
      'Exception : danger pour la vie de la personne ou d\'autrui.',
      'Tu es une aidante, pas une thérapeute. Tu n\'as pas à tout résoudre, ni à être joignable jour et nuit.',
      'Fixe un cadre : horaires, canal (appel, rendez-vous), durée d\'une écoute (45 à 60 min), nombre d\'écoutes par semaine.',
      'Méfie-toi de la position de « sauveuse unique » : si une personne ne peut compter que sur toi, il faut élargir son réseau, pas t\'épuiser.',
    ],
    practice: 'Écris ton cadre personnel d\'écoute (horaires, durée, nombre par semaine) et partage-le avec ton référent ECAA.',
    reflect: 'Où se situe aujourd\'hui ta limite ? L\'as-tu déjà dépassée ?',
    recall: [['Seule exception à la confidentialité ?', 'Un danger pour la vie de la personne ou d\'autrui.']],
  },
  {
    key: 'soin-de-soi',
    title: 'Prendre soin de l\'écoutante',
    minutes: 20,
    goal: 'Durer dans le service sans s\'user.',
    points: [
      'La fatigue de compassion : épuisement, irritabilité, cynisme, troubles du sommeil, images des récits qui reviennent, envie de tout arrêter. Ce n\'est pas une faiblesse : c\'est le coût d\'écouter la douleur.',
      'Supervision ou intervision régulière : un temps pour déposer ce que tu as entendu, avec un professionnel ou d\'autres écoutantes.',
      'Rituel après chaque écoute : noter le débrief dans Kairos, marcher 5 minutes, boire de l\'eau, prier pour remettre la personne à Dieu, changer d\'activité.',
      'Protège tes piliers : sommeil, repas, sport, tes propres temps avec Dieu. Une écoutante épuisée écoute moins bien.',
      'Kairos te signale quand tes trois derniers ressentis après écoute sont bas. Prends ce signal au sérieux.',
    ],
    practice: 'Fais l\'auto-évaluation « Mon état d\'écoutante » dans l\'onglet Écoute. Refais-la dans un mois.',
    reflect: 'Quel est ton premier signe personnel d\'usure ?',
    recall: [['Trois signes de fatigue de compassion ?', 'Épuisement, irritabilité ou cynisme, troubles du sommeil, récits qui reviennent en tête.']],
  },
  {
    key: 'groupe',
    title: 'Animer un groupe de parole',
    minutes: 30,
    goal: 'Offrir un espace sûr où l\'on partage sans être jugé.',
    points: [
      'Le cadre, lu à chaque séance : confidentialité, bienveillance, on parle en « je », on ne conseille pas les autres sauf demande, droit de se taire, téléphones en silencieux.',
      'Structure d\'une séance de 90 minutes : accueil (10), météo émotionnelle (15), thème (15), partages (35), ressource (10), clôture (5). Le modèle est dans l\'onglet ECAA.',
      'Animer, c\'est réguler : distribuer la parole, recentrer avec douceur, protéger le groupe des conseils et des jugements.',
      'Si une personne est en crise pendant le groupe : un co-animateur sort avec elle, l\'autre garde le groupe. Toujours animer à deux.',
      'Après chaque séance : débrief entre animateurs, et jamais de détails sur les participants en dehors.',
    ],
    practice: 'Prépare une séance complète à partir du modèle, sur le thème « La fatigue de fin d\'année ».',
    reflect: 'Qu\'est-ce qui rendrait un groupe vraiment sûr pour toi, si tu étais participante ?',
    recall: [['Pourquoi animer à deux ?', 'Pour qu\'une personne puisse accompagner un participant en crise pendant que l\'autre garde le groupe.']],
  },
  {
    key: 'communiquer',
    title: 'Communiquer sans faire de mal',
    minutes: 20,
    goal: 'Sensibiliser et lutter contre la stigmatisation, sans mettre personne en danger.',
    points: [
      'Ne jamais décrire de méthode ni de lieu de suicide, ni montrer d\'image qui l\'évoque.',
      'Ne pas présenter le suicide comme une solution, un acte courageux ou romantique.',
      'Langage : « mort par suicide », pas « s\'est suicidé lâchement » ni « a commis » (comme un crime).',
      'Raconter des histoires d\'espoir et de rétablissement (anonymes et avec accord) : elles protègent.',
      'Toujours terminer par une ressource : où trouver de l\'aide, un contact ECAA, un numéro d\'urgence.',
      'Viser la stigmatisation : la dépression est une maladie qui se soigne ; demander de l\'aide est un acte de force.',
    ],
    practice: 'Passe ton prochain post ECAA à travers la checklist « Communication sûre » de la fiche du post.',
    reflect: 'Quel message de ton entourage sur la santé mentale voudrais-tu le plus corriger ?',
    recall: [
      ['Deux interdits des posts sur le suicide ?', 'Décrire une méthode ou un lieu, et présenter le suicide comme une solution.'],
      ['Comment terminer un post sur la santé mentale ?', 'Toujours avec une ressource d\'aide.'],
    ],
  },
  {
    key: 'association',
    title: 'Faire grandir ECAA',
    minutes: 30,
    goal: 'Passer de bonnes intentions à une association solide.',
    points: [
      'Clarifier : la vision (le monde que vous voulez), la mission (ce que vous faites, pour qui) et les limites (ce que vous ne faites pas : soigner, prescrire).',
      'Former chaque bénévole avant qu\'il écoute (ce parcours peut servir de base) et organiser une intervision mensuelle.',
      'Nouer des partenariats : psychologues et psychiatres (pour orienter et superviser), églises, universités, associations étudiantes.',
      'Mesurer l\'impact sans exposer personne : nombre d\'écoutes, d\'orientations, de séances de groupe, de personnes sensibilisées. Le journal d\'écoute de Kairos te donne déjà ces chiffres.',
      'Écrire des règles simples : charte du bénévole, protocole de crise, confidentialité, gestion des données.',
    ],
    practice: 'Rédige en une page la vision, la mission et trois limites d\'ECAA, et mets-la dans le pilier « Programme ».',
    reflect: 'Dans un an, qu\'est-ce qui te ferait dire qu\'ECAA a grandi ?',
    recall: [['Qu\'est-ce qu\'ECAA ne fait pas ?', 'Soigner, diagnostiquer, prescrire : elle écoute, accompagne et oriente.']],
  },
];

// ─── Fiches pratiques ──────────────────────────────────────────────────────

export const CRISIS_STEPS = [
  { t: 'Rester calme et présente', d: 'Respire. Ta voix posée aide la personne à redescendre. Tu n\'as pas besoin d\'avoir la réponse parfaite.' },
  { t: 'Poser la question directement', d: '« Est-ce que tu penses à te suicider ? » Puis : « Tu as pensé à comment ? Tu as ce qu\'il faut ? Quand ? »' },
  { t: 'Évaluer le danger', d: 'Plan précis + moyen disponible + délai court = danger immédiat. En cas de doute, considère qu\'il est immédiat.' },
  { t: 'Ne pas la laisser seule', d: 'À distance : garde-la en ligne, demande qui est près d\'elle, fais venir quelqu\'un sur place.' },
  { t: 'Éloigner les moyens', d: 'Avec son accord et l\'aide d\'un proche : médicaments, produits, objets dangereux.' },
  { t: 'Appeler de l\'aide', d: 'Secours, professionnel ou proche de confiance. La confidentialité s\'arrête là où commence la sécurité.' },
  { t: 'Après la crise', d: 'Informe ton référent ECAA, note ce qui a été fait dans le journal (type « crise »), et prends soin de toi.' },
];

export const LISTENING_GUIDE = {
  avant: [
    'Me poser : 3 respirations lentes, téléphone en silencieux.',
    'Prier brièvement si je le souhaite : « Donne-moi d\'écouter plus que de parler. »',
    'Avoir la fiche « Orienter » à portée de main.',
    'Prévoir la durée (45 à 60 min) et la dire au début.',
  ],
  pendant: [
    'Ouvrir : « Je suis là, prends ton temps. Qu\'est-ce qui se passe pour toi ? »',
    'Reformuler : « Si je comprends bien… »',
    'Refléter : « J\'entends beaucoup de… (fatigue, colère, peur). »',
    'Valider : « Avec ce que tu vis, c\'est compréhensible. »',
    'Si des signes d\'alerte : poser la question directe du suicide.',
    'Avant de proposer : « Tu veux que je t\'écoute, ou qu\'on cherche des pistes ensemble ? »',
  ],
  apres: [
    'Résumer et convenir de la suite (nouvel échange, orientation, contact).',
    'Noter le débrief dans Kairos, sans nom ni détail reconnaissable.',
    'Rituel de sortie : marcher, boire de l\'eau, remettre la personne à Dieu.',
    'Si c\'était lourd : en parler à mon référent dans les 24 h.',
  ],
};

export const GROUP_TEMPLATE = [
  ['Accueil', 10, 'Thé, prénoms, rappel du cadre (confidentialité, parler en « je », droit de se taire).'],
  ['Météo émotionnelle', 15, 'Chacun dit en une phrase comment il arrive (soleil, nuages, orage).'],
  ['Thème du jour', 15, 'Une courte introduction sur le thème, avec une question pour lancer.'],
  ['Partages', 35, 'Parole libre sur le thème. Les animateurs reformulent et protègent le cadre.'],
  ['Ressource', 10, 'Une technique concrète (respiration, écriture, sommeil) ou un texte d\'espoir.'],
  ['Clôture', 5, 'Un mot pour repartir. Rappel des contacts d\'aide. Débrief entre animateurs après.'],
];

export const SAFE_POST_CHECKLIST = [
  'Aucune méthode, aucun lieu, aucune image qui évoque un suicide.',
  'Le suicide n\'est pas présenté comme une solution ni comme courageux.',
  'Vocabulaire juste : « mort par suicide », « vivre avec une dépression ».',
  'Un message d\'espoir : on peut aller mieux, demander de l\'aide est une force.',
  'Une ressource à la fin : contact ECAA, professionnel, numéro d\'urgence.',
  'Aucune personne reconnaissable sans son accord écrit.',
];

/** Auto-evaluation de l'ecoutante (inspiree des echelles de fatigue de compassion, non diagnostique). */
export const SELF_CHECK = [
  'Je me sens épuisée après avoir écouté.',
  'Des récits entendus me reviennent en tête, même quand je ne veux pas.',
  'Je deviens irritable ou distante avec mes proches.',
  'Je dors moins bien depuis que j\'écoute davantage.',
  'J\'ai l\'impression que rien de ce que je fais ne sert à rien.',
  'J\'évite certaines personnes ou certains appels.',
];

export const GROUP_THEMES = [
  'La fatigue de fin d\'année', 'Quand les fêtes font mal', 'Dormir enfin', 'La pression des études',
  'La solitude au milieu des autres', 'Le regard des autres et la honte', 'Prier quand on n\'y arrive plus',
  'Dire non sans culpabiliser', 'Le deuil', 'Recommencer après un échec',
];
