-- ═══════════════════════════════════════════════════════════════════════════
-- Kairos — modeles de saison. Appele par le front a la fin de l'accueil :
--   supabase.rpc('start_season', { p_template: 'reprise', ... })
-- La fonction tourne avec les droits de l'utilisatrice (security invoker) :
-- tout ce qu'elle insere lui appartient grace au default auth.uid().
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.start_season(
  p_template text,
  p_title text,
  p_intention text,
  p_start date,
  p_end date
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_season uuid;
  -- Semaine 1 = premier lundi a partir du debut de saison.
  v_monday date := p_start + ((8 - extract(isodow from p_start)::int) % 7);
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;

  insert into seasons (title, intention, starts_on, ends_on)
  values (p_title, coalesce(p_intention, ''), p_start, p_end)
  returning id into v_season;

  -- Programme de culture financiere : un theme par semaine, quel que soit le modele.
  insert into finance_weeks (position, title, questions, action, week_start) values
  (1, 'Mon argent aujourd''hui',
     array['Combien gagne-je vraiment par mois, toutes sources comprises ?',
           'Où part mon argent ? Quelles dépenses me surprennent ?',
           'Qu''est-ce que je dois, et à qui ?'],
     'Noter chaque dépense pendant 7 jours, même 100 FCFA.', v_monday),
  (2, 'Le budget',
     array['Qu''est-ce que la règle 50/30/20 (besoins, envies, épargne) ?',
           'Qu''est-ce qu''un budget « à zéro » où chaque franc a un rôle ?',
           'Quelles sont mes dépenses fixes et variables ?'],
     'Faire mon budget du mois prochain sur papier ou dans un tableau.', v_monday + 7),
  (3, 'Épargne et fonds d''urgence',
     array['Pourquoi un fonds d''urgence de 3 à 6 mois de dépenses ?',
           'Où garder cette épargne pour ne pas y toucher ?',
           'Qu''est-ce que « se payer en premier » ?'],
     'Mettre en place une épargne automatique, même petite, le jour où l''argent arrive.', v_monday + 14),
  (4, 'Mobile money, banques et frais cachés',
     array['Combien m''ont coûté mes transferts et retraits le mois dernier ?',
           'Quelle différence entre compte courant, compte épargne et portefeuille mobile ?',
           'Quels frais bancaires paie-je sans le savoir ?'],
     'Additionner tous mes frais du mois dernier et trouver un moyen de les réduire.', v_monday + 21),
  (5, 'Dettes, credit et taux',
     array['Qu''est-ce qu''un taux d''intérêt annuel ? Et le coût total d''un credit ?',
           'Bonne dette ou mauvaise dette : quelle différence ?',
           'Méthode boule de neige ou avalanche pour rembourser ?'],
     'Lister mes dettes (même envers des proches) avec un plan de remboursement.', v_monday + 28),
  (6, 'Intérêts composés et inflation',
     array['Pourquoi commencer tôt change tout ?',
           'Que fait l''inflation à l''argent qui dort ?',
           'Qu''est-ce que la règle de 72 ?'],
     'Calculer ce que deviennent 10 000 FCFA par mois pendant 10 ans à 5 % par an.', v_monday + 35),
  (7, 'Investir : les bases',
     array['Action, obligation, fonds commun : c''est quoi ?',
           'Qu''est-ce que la BRVM, la bourse régionale basée à Abidjan ?',
           'Tontine, immobilier, entreprise : quels risques pour quels rendements ?'],
     'Suivre 3 sociétés cotées à la BRVM pendant la semaine et noter ce que je comprends.', v_monday + 42),
  (8, 'Créer des revenus',
     array['Quelles compétences ai-je déjà qui ont de la valeur ?',
           'Freelance, petit commerce, contenu : par où commencer sans capital ?',
           'Comment fixer un prix juste ?'],
     'Lister 3 idées de revenus à partir de mes talents (oral, contenu, écoute) et en tester une.', v_monday + 49),
  (9, 'Se protéger des arnaques',
     array['Comment reconnaître un système de Ponzi ou une promesse de gain trop belle ?',
           'Quelles sont les arnaques courantes au mobile money ?',
           'Comment protéger mes codes et mes comptes ?'],
     'Vérifier la sécurité de mes comptes (codes, double validation) et en parler à un proche.', v_monday + 56);

  if p_template = 'reprise' then
    insert into habits (domain, kind, title, schedule, at_time, per_week, per_week_min, duration_min,
                        full_version, light_version, sacred, position) values
    -- Esprit : rendez-vous sacres, heures non negociables
    ('esprit', 'meditation', 'Méditation', 'fixe', '05:30', null, null, 20,
       'Lire le chapitre du jour et remplir le journal É.O.A.P.', '', true, 1),
    ('esprit', 'priere', 'Prière', 'fixe', '06:00', null, null, 20,
       'Adoration, confession, gratitude, supplication.', '', true, 2),
    ('esprit', 'jeune', 'Jeûne', 'hebdo', null, 1, 1, 0,
       'Un jour de jeûne avec une intention claire.', '', true, 3),
    -- Service
    ('service', 'intercession', 'Intercession', 'fixe', '21:00', null, null, 20,
       'Prier pour la liste du jour.', '', true, 4),
    ('service', 'ecaa', 'Travail pour ECAA', 'hebdo', null, 3, 2, 45,
       'Avancer un élément du tableau ECAA.', 'Noter une idée de post.', false, 5),
    -- Corps
    ('corps', 'sport', 'Sport', 'hebdo', null, 3, 2, 30,
       'Une séance guidée complete.', '10 minutes de marche active.', false, 6),
    ('corps', 'sucre_sel', 'Sans sucre ni sel ajoutés', 'quotidien', null, null, null, 0,
       'Aucun sucre ajouté, aucun cube d''assaisonnement.', '', false, 7),
    ('corps', 'coucher', 'Coucher', 'fixe', '22:30', null, null, 0,
       'Écran coupé, au lit.', '', false, 8),
    -- Etudes et passion
    ('etudes', 'etude', 'Études du jour', 'quotidien', null, null, null, 120,
       '2 heures de travail personnel.', '30 minutes sur le chapitre le plus urgent.', false, 9),
    ('etudes', 'lecture', 'Lecture', 'quotidien', null, null, null, 20,
       '20 minutes de lecture.', '5 pages.', false, 10),
    ('etudes', 'mots', 'Vocabulaire', 'quotidien', null, null, null, 10,
       'Réviser mes cartes et ajouter 3 mots.', 'Réviser 5 cartes.', false, 11),
    ('etudes', 'anglais', 'Anglais', 'hebdo', null, 3, 3, 30,
       '30 minutes sur la compétence proposée.', '10 minutes de cartes.', false, 12),
    ('etudes', 'oral', 'Prise de parole', 'hebdo', null, 2, 1, 15,
       'S''enregistrer 2 minutes et s''évaluer.', 'S''enregistrer 1 minute.', false, 13),
    ('etudes', 'argument', 'Atelier argumentation', 'hebdo', null, 1, 1, 30,
       'Construire un argumentaire complet.', 'Trouver une thèse et un argument.', false, 14),
    ('etudes', 'finance', 'Culture financière', 'hebdo', null, 1, 1, 60,
       'Étudier le thème de la semaine et faire l''action.', 'Répondre à une question du thème.', false, 15),
    ('etudes', 'contenu', 'Création de contenu', 'hebdo', null, 3, 1, 15,
       'Un micro-creneau de 15 minutes sur une idée.', 'Noter une idée.', false, 16);

    insert into bible_plans (book, chapters) values ('Jean', 21);

    -- Liste d'intercession tournante : un cercle par jour.
    insert into intercession_targets (name, category, weekday) values
      ('Ma famille', 'Famille', 1),
      ('Mon église et ses responsables', 'Église', 2),
      ('Les personnes accompagnées par ECAA', 'ECAA', 3),
      ('Mes études et ma vocation', 'Moi', 4),
      ('Mon pays et ses dirigeants', 'Nation', 5),
      ('Mes amis', 'Amis', 6),
      ('Les chrétiens persécutés', 'Monde', 0);
  end if;

  update profiles set onboarded = true where id = auth.uid();
  return v_season;
end $$;

revoke execute on function public.start_season(text, text, text, date, date) from public, anon;
grant execute on function public.start_season(text, text, text, date, date) to authenticated;
