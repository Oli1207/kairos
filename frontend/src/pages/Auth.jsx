import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button, ErrorNote, Field, Input } from '../components/ui';
import Soleil, { Lisiere } from '../components/Soleil';

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
      <div className="flex flex-1 flex-col justify-between px-6 pb-8 pt-[calc(env(safe-area-inset-top)+2.5rem)] md:p-14">
        <div>
          <Soleil value={0.62} size={92} petals={20} tones={['rouge', 'orange', 'jaune']} />
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] md:text-7xl">Kairos</h1>
          <p className="mt-3 max-w-sm text-lg text-white/75">Le temps fixé. Tes rendez-vous avec Dieu, ton corps, tes études et ceux que tu sers.</p>
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
