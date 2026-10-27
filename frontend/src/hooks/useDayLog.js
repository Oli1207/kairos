import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, unwrap } from '../lib/supabase';
import { today } from '../lib/dates';
import { useRows } from './useData';

/** Le journal d'un jour (check-in du matin, eau, sucre/sel, bilan du soir). */
export function useDayLog(day = today()) {
  const qc = useQueryClient();
  const query = useRows('day_logs', { key: [day], build: (q) => q.eq('day', day).maybeSingle() });
  const patch = useMutation({
    mutationFn: async (fields) => unwrap(await supabase.from('day_logs')
      .upsert({ day, ...fields }, { onConflict: 'user_id,day' }).select().single()),
    onMutate: (fields) => {
      qc.setQueryData(['day_logs', day], (old) => ({ ...(old || { day, water: 0, mode: 'plein' }), ...fields }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['day_logs'] }),
  });
  return { log: query.data, isLoading: query.isLoading, patch: patch.mutate };
}
