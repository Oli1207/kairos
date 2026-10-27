import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button, ErrorNote, Field, Input } from '../components/ui';
import Soleil, { Lisiere } from '../components/Soleil';

// La phrase d'accueil, sous le nom de l'app.
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
    if (mode === 'signup' && !data.session) setInfo('Compte créé. Ouvre le lien reçu par email pour l\'activer, puis reviens te connecter.');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#17120e] text-[#fbf9f3] md:flex-row" data-theme="dark">
      {/* Sa photo : le ciel, l'herbe et le pagne d'ou vient tout l'univers de l'app. */}
      <div className="relative h-[58svh] min-h-[340px] overflow-hidden md:h-auto md:min-h-screen md:flex-1">
        <img
          src="/images/accueil.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
          fetchPriority="high"
        />
        <div className="absolute bottom-0 left-0 max-w-[88%] bg-[#17120e] px-6 pb-5 pt-5 md:bottom-12 md:left-12 md:max-w-md md:px-8 md:py-7">
          <div className="flex items-center gap-3">
            <Soleil value={0.62} size={44} petals={16} tones={['rouge', 'orange', 'jaune']} />
            <h1 className="font-display text-5xl font-extrabold leading-none md:text-6xl">Kairos</h1>
          </div>
          <p className="mt-3 text-[1.05rem] leading-snug text-white/80">{TAGLINE}</p>
        </div>
      </div>
      <Lisiere className="md:hidden" />
      <div className="bg-[#e8ebe6] text-[#17120e] md:flex md:w-[440px] md:items-center" data-theme="light">
        <form onSubmit={submit} className="w-full space-y-4 px-6 py-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:px-10">
          <h2 className="font-display text-2xl font-extrabold">{mode === 'login' ? 'Bon retour' : 'Commencer ma saison'}</h2>
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
