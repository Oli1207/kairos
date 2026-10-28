import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button, ErrorNote, Field, Input } from '../components/ui';
import { MiniSoleil } from '../components/Soleil';

// La phrase d'accueil, sous la marque.
const TAGLINE = "Fidèle dans les petites choses, chaque jour.";

const MESSAGES = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'User already registered': 'Un compte existe déjà avec cet email. Connecte-toi.',
  'Email not confirmed': 'Confirme d\'abord ton email : le lien est dans ta boîte de réception.',
};

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const { data, error: err } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      : await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { display_name: form.name.trim() }, emailRedirectTo: window.location.origin },
      });
    setBusy(false);
    if (err) {
      const msg = MESSAGES[err.message]
        || (/password/i.test(err.message) ? 'Mot de passe trop court : 6 caractères minimum.' : err.message);
      setError({ message: msg });
      return;
    }
    // Si la confirmation d'email est activee dans Supabase, pas de session tout de suite.
    if (mode === 'signup' && !data.session) setInfo("Compte créé. Ouvre le lien reçu par email : il active ton compte et te connecte directement. Si tu utilises l'app installée sur l'écran d'accueil, connecte-toi ensuite une fois dans l'app.");
  };

  return (
    <div className="relative flex min-h-[100svh] flex-col justify-end bg-[#17120e] md:items-center md:justify-center md:p-10 lg:items-end lg:pr-[4vw]" data-theme="dark">
      {/* Sa photo en plein ecran, derriere tout : c'est elle qu'on voit en premier.
          Cadrage sur le visage : il reste au-dessus du formulaire sur mobile. */}
      <img
        src="/images/accueil.jpg"
        alt=""
        // Mobile : la photo remonte de 13 % (on sacrifie du ciel) pour que le formulaire
        // couvre l'herbe plutot qu'elle. Le bas libere reste cache derriere le formulaire.
        className="fixed inset-x-0 top-[-13svh] h-[100svh] w-full object-cover md:inset-0 md:h-full lg:object-[38%_30%]"
        fetchPriority="high"
      />

      {/* Marque discrete dans le coin, lisible sur le ciel grace a une ombre douce. */}
      <div className="fixed left-5 top-[calc(env(safe-area-inset-top)+1rem)] md:left-8 md:top-7" style={{ textShadow: '0 1px 8px rgba(23,18,14,0.6)' }}>
        <div className="flex items-center gap-1.5">
          <MiniSoleil size={20} />
          <h1 className="font-display text-lg font-extrabold tracking-tight text-white">Kairos</h1>
        </div>
        <p className="mt-0.5 text-xs font-medium text-white/90">{TAGLINE}</p>
      </div>

      {/* Le formulaire, simplement pose sur la photo. */}
      <div className="relative w-full bg-[#e8ebe6] text-[#17120e] shadow-[0_-8px_30px_rgba(23,18,14,0.25)] md:max-w-[360px] md:shadow-[0_12px_40px_rgba(23,18,14,0.35)]" data-theme="light">
        <form onSubmit={submit} className="space-y-3 px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5 md:space-y-3.5 md:p-8">
          {mode === 'signup' && <h2 className="font-display text-2xl font-extrabold">Commencer ma saison</h2>}
          {mode === 'signup' && (
            <Field label="Ton prénom"><Input value={form.name} onChange={set('name')} required autoComplete="given-name" /></Field>
          )}
          <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required autoComplete="email" /></Field>
          <Field label="Mot de passe"><Input type="password" value={form.password} onChange={set('password')} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></Field>
          <ErrorNote error={error} />
          {info && <p className="border-l-4 border-herbe bg-herbe-soft px-3 py-2 text-sm">{info}</p>}
          <Button type="submit" size="lg" className="w-full" loading={busy}>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</Button>
          <button type="button" className="w-full text-center text-sm font-semibold text-muted underline-offset-4 hover:underline" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}>
            {mode === 'login' ? 'Pas encore de compte ? Créer le mien' : 'J\'ai déjà un compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
