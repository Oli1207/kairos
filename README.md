# Kairos

PWA pour tenir une saison d'objectifs : rendez-vous spirituels à heure fixe, service (intercession, ECAA),
corps (séances guidées, sucre et sel, poids) et études (cours, vocabulaire, lecture, oral, anglais,
culture financière, contenu).

- `docs/CONCEPT.md` : le produit, domaine par domaine.
- `docs/SUPABASE.md` : mise en ligne gratuite pas à pas (Supabase + Netlify).
- `supabase/migrations/` : schéma, modèles de saison, planification des rappels.
- `supabase/functions/rappels/` : envoi des notifications push (Edge Function).
- `frontend/` : React 19 + Vite + Tailwind 4 + vite-plugin-pwa + react-query + zustand.

```bash
cd frontend
npm install
npm run demo   # données factices, sans backend
npm run dev    # avec Supabase (remplir .env d'abord)
```
