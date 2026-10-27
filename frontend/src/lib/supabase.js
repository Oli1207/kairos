import { createClient } from '@supabase/supabase-js';
import { createDemoClient } from './demo';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const DEMO = import.meta.env.VITE_DEMO === '1';

/** Faux si le fichier .env n'est pas encore rempli : l'app affiche alors un ecran d'aide. */
export const supabaseReady = DEMO || Boolean(url && key);

// La cle « anon » est publique par conception : la securite repose sur la
// Row Level Security cote base, pas sur le secret de cette cle.
export const supabase = DEMO
  ? createDemoClient()
  : createClient(url || 'http://localhost', key || 'absent', {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kairos-auth' },
  });

/** Leve l'erreur Supabase pour que react-query la remonte, sinon renvoie les donnees. */
export function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}
