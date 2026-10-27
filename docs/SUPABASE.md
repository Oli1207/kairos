# Mettre Kairos en ligne — gratuitement

Il n'y a pas de serveur Django. Supabase fournit la base PostgreSQL, l'API, les comptes, le
stockage des audios et l'envoi des rappels. Le front React est hébergé gratuitement sur Netlify.

Compte environ **30 minutes** la première fois.

---

## 1. Créer le projet Supabase (5 min)

1. Va sur **supabase.com**, puis *Start your project*, et connecte-toi avec GitHub.
2. Clique sur *New project* :
   - **Name** : `kairos`
   - **Database password** : génère-le et **garde-le** dans un gestionnaire de mots de passe.
   - **Region** : *West EU (Paris)* ou *London*, les plus proches d'Abidjan.
   - **Plan** : Free.
3. Attends environ 2 minutes que le projet soit prêt.

## 2. Créer la base (3 min)

Dans le menu de gauche, ouvre **SQL Editor** puis *New query*.

1. Colle tout le contenu de `supabase/migrations/01_schema.sql`, puis clique sur **Run**.
   Le résultat attendu est *Success. No rows returned*.
2. Ouvre une nouvelle requête, colle `supabase/migrations/02_modeles.sql`, puis **Run**.

Va ensuite dans **Table Editor** : les tables `habits`, `checkins`, `fasts`, etc. doivent
apparaître, toutes marquées *RLS enabled*.

> **Pourquoi c'est sûr.** Le front parle directement à la base avec une clé publique. Ce qui protège
> les données, c'est la *Row Level Security* : chaque table a une règle « je ne vois que les lignes
> où `user_id` = moi ». Une autre utilisatrice ne peut ni lire ni modifier les données de ton amie,
> même en bidouillant le JavaScript.

## 3. Régler la connexion (2 min)

Va dans **Authentication**, puis **Sign In / Providers**, puis **Email** :
- **Confirm email** : laisse cette option activée pour la vraie mise en ligne (chaque inscrite
  confirme son email). Pour tester vite, tu peux la désactiver.

Va ensuite dans **Authentication**, puis **URL Configuration** (à faire après l'étape 7, quand
tu connais l'adresse Netlify) :
- **Site URL** : `https://kairos-saison.netlify.app` (ton adresse Netlify)
- **Redirect URLs** : ajoute `https://kairos-saison.netlify.app/**` et `http://localhost:5181/**` (pour tester en local).

## 4. Brancher le front en local (2 min)

Va dans **Project Settings**, puis **API**, et copie **Project URL** et la clé **anon public**.

Ensuite :

```bash
cd frontend
cp .env.example .env
```

Remplis `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `frontend/.env`, puis lance :

```bash
npm run dev
```

Crée un compte : l'accueil en 3 étapes démarre la saison.

> `npm run demo` lance l'app avec des données factices, sans Supabase. C'est pratique pour
> montrer l'app avant la mise en ligne.

## 5. Clés des notifications (2 min)

Les notifications push utilisent une paire de clés VAPID. Génère-les une seule fois :

```bash
npx web-push generate-vapid-keys
```

- La **Public Key** va dans `frontend/.env` → `VITE_VAPID_PUBLIC_KEY`, et sur Netlify (étape 7).
- La **Private Key** ne va **que** dans les secrets Supabase (étape 6). Elle ne doit jamais être
  mise dans le front ni dans Git.

## 6. Déployer la fonction de rappels (10 min)

**a. Les secrets.** Va dans **Edge Functions**, puis **Secrets**, et ajoute :

| Nom | Valeur |
|---|---|
| `VAPID_PUBLIC_KEY` | la clé publique |
| `VAPID_PRIVATE_KEY` | la clé privée |
| `VAPID_SUBJECT` | `mailto:ton.email@gmail.com` |
| `CRON_SECRET` | une longue chaîne au hasard (par exemple un mot de passe généré de 40 caractères) |

**b. La fonction.** Va dans **Edge Functions**, puis **Deploy a new function**, puis **Via Editor** :
- **Nom** : `rappels` (exactement) ;
- colle le contenu de `supabase/functions/rappels/index.ts` ;
- clique sur **Deploy** ;
- dans les réglages de la fonction, **désactive « Enforce JWT verification »**. Le cron
  s'authentifie avec `CRON_SECRET` à la place.

**c. Le déclenchement chaque minute.** Ouvre **SQL Editor**, puis colle
`supabase/migrations/03_rappels.sql`. Remplace `<PROJECT_URL>` et `<CRON_SECRET>`, puis **Run**.

Pour vérifier : va dans **Integrations**, puis **Cron**. Le job `kairos-rappels` doit tourner
chaque minute, avec des exécutions *succeeded*.

## 7. Mettre le front en ligne sur Netlify (5 min)

1. Sur **netlify.com**, connecte-toi avec GitHub.
2. *Add new site* → *Import an existing project* → GitHub → choisis `Oli1207/kairos`.
3. Les réglages de build sont lus dans `netlify.toml` (dossier `frontend`, commande `npm run build`, dossier `dist`) : ne change rien.
4. **Environment variables** → *Add a variable*, trois fois (copie les valeurs de `frontend/.env`) :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY`
5. **Deploy**. Tu obtiens `https://xxx.netlify.app` en HTTPS, sans domaine à acheter.
   Pour une adresse plus jolie : *Site configuration* → *Change site name* → `kairos-saison` → `https://kairos-saison.netlify.app`.
6. Reporte cette adresse dans Supabase (étape 3, URL Configuration).

Chaque `git push` sur `main` redéploie automatiquement.

## 8. Sur l'iPhone de ton amie

1. Ouvre l'adresse Netlify **dans Safari**.
2. Touche **Partager**, puis **Sur l'écran d'accueil**.
3. Ouvre Kairos **depuis l'icône**. C'est obligatoire : sur iPhone, les notifications ne marchent
   que dans l'app installée.
4. Va dans **Réglages**, puis **Activer les rappels**, et accepte.

---

## Limites du plan gratuit, à connaître

- **Le projet se met en pause après 7 jours sans activité.** Le cron tourne chaque minute, donc
  ça ne devrait pas arriver. Si c'est le cas, un clic sur *Restore* dans le tableau de bord suffit.
- 500 Mo de base, 1 Go de stockage (les audios d'oral font environ 0,5 Mo par minute), 500 000
  appels de fonctions par mois. Les rappels en utilisent environ 45 000.
- Pas de sauvegarde automatique sur le plan gratuit. De temps en temps, fais un export via
  **Database**, puis **Backups**, ou un `pg_dump` avec le mot de passe de l'étape 1.
