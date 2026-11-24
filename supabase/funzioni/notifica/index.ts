// Funzione Edge «notifica»: manda una notifica push a chi deve votare o ha aggiornamenti. Chiamata solo dal database (segreto condiviso).
// Variabili: NOTIFICA_SEGRETO, VAPID_PUBLICA, VAPID_PRIVATA (impostate come secret della funzione); SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono già presenti.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const STATI = ["in votazione", "approvata", "respinta", "fatta"];
Deno.serve(async (req) => {
  if (req.headers.get("x-notifica-segreto") !== Deno.env.get("NOTIFICA_SEGRETO")) return new Response("non autorizzato", { status: 401 });
  const { proposal_id, tipo } = await req.json();
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  webpush.setVapidDetails("https://4everopeth25-byte.github.io/londra-in-tasca/", Deno.env.get("VAPID_PUBLICA")!, Deno.env.get("VAPID_PRIVATA")!);
  const { data: p } = await db.from("proposals").select("id,titolo,stato,participant_id,campaign_id").eq("id", proposal_id).maybeSingle();
  if (!p) return new Response("idea non trovata", { status: 404 });
  const [{ data: subs }, { data: aperte }, { data: voti }] = await Promise.all([
    db.from("push_subscriptions").select("endpoint,p256dh,auth,participant_id").eq("campaign_id", p.campaign_id),
    db.from("proposals").select("id,participant_id").eq("campaign_id", p.campaign_id).eq("stato", 0),
    db.from("votes").select("proposal_id,participant_id")]);
  const votati = new Set((voti ?? []).map((v) => v.participant_id + "|" + v.proposal_id));
  let inviate = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    if (tipo === "INSERT" && s.participant_id === p.participant_id) return;   // chi ha proposto l'idea non riceve l'avviso
    const n = (aperte ?? []).filter((x) => x.participant_id !== s.participant_id && !votati.has(s.participant_id + "|" + x.id)).length;
    const testo = tipo === "INSERT" ? (n === 1 ? "1 idea da votare: " + p.titolo : n + " idee da votare, ultima: " + p.titolo) : "«" + p.titolo + "» è " + STATI[p.stato] + ".";
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ titolo: "Londra in tasca", testo, n, url: "./?vai=idee" }), { TTL: 86400 });
      inviate++;
    } catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint); }
  }));
  return new Response(JSON.stringify({ inviate }), { headers: { "Content-Type": "application/json" } });
});
