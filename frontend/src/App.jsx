import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import { Toaster } from './components/toast';
import { TourHost } from './components/Tour';
import { useAuth } from './store/auth';
import { useProfile } from './hooks/useData';
import { supabaseReady } from './lib/supabase';
import Auth from './pages/Auth';
import Setup from './pages/Setup';
import Onboarding from './pages/Onboarding';
import Today from './pages/Today';

// Les modules sont charges a la demande : l'ecran du jour s'ouvre vite.
const Week = lazy(() => import('./pages/Week'));
const Esprit = lazy(() => import('./pages/Esprit'));
const Service = lazy(() => import('./pages/Service'));
const Corps = lazy(() => import('./pages/Corps'));
const Etudes = lazy(() => import('./pages/Etudes'));
const Settings = lazy(() => import('./pages/Settings'));
const Guide = lazy(() => import('./pages/Guide'));

export default function App() {
  const { session, ready, init } = useAuth();
  useEffect(() => { init(); }, [init]);

  if (!supabaseReady) return <Setup />;
  if (!ready) return <Loading />;
  if (!session) return <Auth />;
  return <><Signed /><Toaster /></>;
}

function Signed() {
  const { data: profile, isLoading } = useProfile();
  if (isLoading && !profile) return <Loading />;
  if (profile && !profile.onboarded) return <Onboarding profile={profile} />;
  return (
    <Suspense fallback={<Loading />}>
      <TourHost />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Today />} />
          <Route path="semaine" element={<Week />} />
          <Route path="esprit" element={<Esprit />} />
          <Route path="service" element={<Service />} />
          <Route path="corps" element={<Corps />} />
          <Route path="etudes" element={<Etudes />} />
          <Route path="reglages" element={<Settings />} />
          <Route path="guide" element={<Guide />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
