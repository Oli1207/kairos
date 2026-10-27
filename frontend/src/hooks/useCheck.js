import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, unwrap } from '../lib/supabase';
import { today, toMin } from '../lib/dates';
import { lateness } from '../lib/engine';
import { useRows } from './useData';

/**
 * Pointer une habitude pour un jour (un seul pointage par jour et par habitude).
 * `status: null` efface le pointage.
 */
export function useCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habit_id, day = today(), status, late_min = null, minutes = null, note = '' }) => {
      if (!status) return unwrap(await supabase.from('checkins').delete().match({ habit_id, day }));
      return unwrap(await supabase.from('checkins')
        .upsert({ habit_id, day, status, late_min, minutes, note, done_at: new Date().toISOString() }, { onConflict: 'habit_id,day' })
        .select().single());
    },
    // Coche instantanee : on met le cache a jour avant la reponse du serveur.
    onMutate: async (v) => {
      const day = v.day || today();
      await qc.cancelQueries({ queryKey: ['checkins'] });
      const keys = qc.getQueryCache().findAll({ queryKey: ['checkins'] }).map((q) => q.queryKey);
      const snapshot = keys.map((k) => [k, qc.getQueryData(k)]);
      keys.forEach((k) => qc.setQueryData(k, (old) => {
        if (!Array.isArray(old)) return old;
        const rest = old.filter((c) => !(c.habit_id === v.habit_id && c.day === day));
        return v.status ? [...rest, { late_min: null, ...v, day, id: `tmp-${v.habit_id}` }] : rest;
      }));
      return { snapshot };
    },
    onError: (_e, _v, ctx) => ctx?.snapshot.forEach(([k, d]) => qc.setQueryData(k, d)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['checkins'] }),
  });
}

/**
 * Pointe automatiquement l'habitude d'un type donne apres une activite
 * (journal de meditation, seance, lecture…). Ne retrograde jamais un pointage
 * « fait » deja present, et calcule le retard pour un rendez-vous fixe.
 */
export function useAutoCheck(habits) {
  const check = useCheck();
  const day = today();
  const { data: todays = [] } = useRows('checkins', { key: ['jour', day], build: (q) => q.eq('day', day) });
  return (kind, minutes) => {
    const h = habits?.find((x) => x.kind === kind && !x.archived);
    if (!h) return;
    const existing = todays.find((c) => c.habit_id === h.id);
    if (existing?.status === 'fait') return;
    const full = !h.duration_min || minutes == null || minutes >= h.duration_min * 0.8;
    // On pointe en fin d'activite : le retard se mesure par rapport a l'heure de fin prevue.
    const late = h.schedule === 'fixe' ? lateness(day, toMin(h.at_time) + (h.duration_min || 0)) : null;
    check.mutate({ habit_id: h.id, status: full ? 'fait' : 'leger', minutes, late_min: late });
  };
}
