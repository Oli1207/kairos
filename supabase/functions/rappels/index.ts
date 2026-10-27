// ═══════════════════════════════════════════════════════════════════════════
// Kairos — fonction « rappels » (Supabase Edge Function, Deno).
//
// Appelee chaque minute par pg_cron (voir migrations/03_rappels.sql).
// Pour chaque utilisatrice abonnee, calcule l'heure locale et envoie :
//   - l'heure exacte d'un rendez-vous fixe ;
//   - une relance si rien n'est pointe apres la marge de grace ;
//   - les seances placees dans la semaine ;
//   - la rupture d'un jeune ;
//   - le bilan du soir (45 min avant le coucher) et le bilan du dimanche (19h).
// push_log garantit qu'un meme rappel ne part qu'une fois par jour.
//
// Secrets a definir (Edge Functions > Secrets) :
//   CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// Le cron tourne chaque minute ; une fenetre de 2 min rattrape un passage manque,
// et push_log empeche le doublon.
const WINDOW = 2;

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:kairos@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

type Msg = { key: string; title: string; body: string; url: string };

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Jour, minute et jour de semaine dans le fuseau de l'utilisatrice. */
function localNow(tz: string, at = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23',
    }).formatToParts(at).map((p) => [p.type, p.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    min: Number(parts.hour) * 60 + Number(parts.minute),
    wd: WEEKDAYS[parts.weekday],
  };
}

const toMin = (t: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('interdit', { status: 401 });
  }

  const { data: subs } = await db.from('push_subscriptions').select('*');
  if (!subs?.length) return Response.json({ sent: 0 });
  const ids = [...new Set(subs.map((s) => s.user_id))];

  const now = new Date();
  const from = new Date(now.getTime() - 36 * 3600e3).toISOString().slice(0, 10);
  const to = new Date(now.getTime() + 36 * 3600e3).toISOString().slice(0, 10);

  const [{ data: profiles }, { data: habits }, { data: planned }, { data: checkins }, { data: fasts }] = await Promise.all([
    db.from('profiles').select('id, timezone, bed_time').in('id', ids),
    db.from('habits').select('*').in('user_id', ids).eq('archived', false),
    db.from('planned_sessions').select('*').in('user_id', ids).gte('day', from).lte('day', to),
    db.from('checkins').select('habit_id, day, status').in('user_id', ids).gte('day', from).lte('day', to),
    db.from('fasts').select('*').in('user_id', ids).is('ended_at', null)
      .gte('ends_at', new Date(now.getTime() - WINDOW * 60e3).toISOString())
      .lte('ends_at', now.toISOString()),
  ]);

  let sent = 0;
  for (const p of profiles ?? []) {
    const { day, min, wd } = localNow(p.timezone || 'Africa/Abidjan', now);
    const due = (at: number | null) => at != null && min >= at && min < at + WINDOW;
    const mine = (habits ?? []).filter((h) => h.user_id === p.id);
    const checked = (habitId: string) => (checkins ?? []).some((c) => c.habit_id === habitId && c.day === day);
    const msgs: Msg[] = [];

    for (const h of mine) {
      if (h.schedule !== 'fixe' || !h.notify || !h.days.includes(wd)) continue;
      const at = toMin(h.at_time)!;
      if (due(at)) {
        msgs.push({
          key: `h:${h.id}`,
          title: h.sacred ? `${h.title} — rendez-vous` : h.title,
          body: h.kind === 'coucher' ? 'Écran coupé. Tes matins se décident ce soir.' : (h.full_version || "C'est l'heure."),
          url: '/',
        });
      }
      if (h.kind !== 'coucher' && due(at + (h.grace_min ?? 15)) && !checked(h.id)) {
        msgs.push({ key: `r:${h.id}`, title: `${h.title} : toujours possible`, body: 'Même en retard, ce moment compte. Pointe-le quand c\'est fait.', url: '/' });
      }
    }

    for (const s of (planned ?? []).filter((x) => x.user_id === p.id && x.day === day)) {
      const h = mine.find((x) => x.id === s.habit_id);
      if (h && due(toMin(s.at_time))) {
        msgs.push({ key: `p:${s.id}`, title: h.title, body: `Séance prévue maintenant (${h.duration_min} min).${h.light_version ? ` Version légère : ${h.light_version}` : ''}`, url: '/' });
      }
    }

    for (const f of (fasts ?? []).filter((x) => x.user_id === p.id)) {
      msgs.push({ key: `f:${f.id}`, title: 'Rupture du jeûne', body: f.intention ? `Jeûne accompli : ${f.intention}` : 'Ton jeûne est accompli. Romps-le doucement.', url: '/esprit?onglet=jeune' });
    }

    const bed = toMin(p.bed_time);
    if (bed != null && due(bed - 45)) {
      msgs.push({ key: 'soir', title: 'Bilan du soir', body: 'Sucre, sel, gratitude, victoire du jour : 1 minute.', url: '/' });
    }
    if (wd === 0 && due(19 * 60)) {
      msgs.push({ key: 'dimanche', title: 'Bilan de la semaine', body: 'Regarde ta semaine, puis place la suivante.', url: '/semaine?onglet=bilan' });
    }
    if (!msgs.length) continue;

    // Ce qu'il reste a pointer aujourd'hui : la pastille sur l'icone.
    const todo = mine.filter((h) => h.schedule !== 'hebdo' && h.days.includes(wd) && !checked(h.id)).length;

    for (const m of msgs) {
      const { error } = await db.from('push_log').insert({ user_id: p.id, key: m.key, day });
      if (error) continue; // deja envoye aujourd'hui
      for (const s of subs.filter((x) => x.user_id === p.id)) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title: m.title, body: m.body, url: m.url, tag: m.key, badge: todo }),
          );
          sent += 1;
        } catch (e) {
          // Abonnement expire (telephone change, app desinstallee) : on le retire.
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('id', s.id);
        }
      }
    }
  }

  return Response.json({ sent });
});
