import { MiniSoleil } from '../components/Soleil';

/** Affiche tant que le fichier .env n'est pas rempli (developpement uniquement). */
export default function Setup() {
  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <MiniSoleil size={40} />
      <h1 className="mt-4 font-display text-3xl font-extrabold">Supabase n'est pas encore branché</h1>
      <p className="mt-3 text-muted">
        Copie <code className="bg-paper-2 px-1">frontend/.env.example</code> en <code className="bg-paper-2 px-1">frontend/.env</code>,
        colle l'URL et la clé « anon » de ton projet Supabase, puis relance <code className="bg-paper-2 px-1">npm run dev</code>.
      </p>
      <p className="mt-3 text-muted">Le pas-à-pas complet est dans <code className="bg-paper-2 px-1">docs/SUPABASE.md</code>.</p>
    </div>
  );
}
