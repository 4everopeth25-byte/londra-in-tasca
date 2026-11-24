"use strict";
/* Notifiche: avviso sul telefono quando c'è un'idea nuova da votare o cambia lo stato di un'idea, e numero sull'icona dell'app.
   Il telefono si iscrive al servizio push del suo browser (Web Push); la sottoscrizione è salvata nella tabella push_subscriptions di Supabase,
   legata al nome scelto in Idee. Il database chiama la funzione «notifica» che spedisce gli avvisi. La chiave VAPID pubblica è pubblica per natura. */
const Push = (() => {
  const VAPID = "BPckpekjDAWdMW0xZ0ViL_2HafQPbxigfNR2odEVVDpA5iCODPu2iUc5GE3P-mNQTKb9jX-IektX4Tbc0E7L8VA";
  const sup = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const bin = s => { const p = "=".repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, c => c.charCodeAt(0)); };
  const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const reg = () => Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error("Service worker non pronto.")), 4000))]);
  const sub = async () => { try { return sup() ? await (await reg()).pushManager.getSubscription() : null; } catch { return null; } };
  /* stato: "no" non supportato, "nome" manca il nome in Idee, "negato", "spento", "attivo" */
  async function stato() {
    if (!sup()) return "no";
    if (Notification.permission === "denied") return "negato";
    const c = Sond.contesto();
    if (!c.me) return "nome";
    return (await sub()) && Notification.permission === "granted" ? "attivo" : "spento";
  }
  async function attiva() {
    const c = Sond.contesto();
    if (!sup() || !c.me) throw new Error("Scegli prima il tuo nome nella pagina Idee.");
    if ((await Notification.requestPermission()) !== "granted") throw new Error("Permesso negato: si cambia dalle impostazioni del browser.");
    const r = await reg(); let s = await r.pushManager.getSubscription();
    if (!s) s = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bin(VAPID) });
    const j = s.toJSON();
    const { error } = await c.cl.from("push_subscriptions").upsert({ endpoint: j.endpoint, campaign_id: c.camp.id, participant_id: c.me.id, p256dh: j.keys.p256dh, auth: j.keys.auth });
    if (error) { await s.unsubscribe().catch(() => {}); throw new Error("Notifiche non ancora pronte sul server: riprova più tardi."); }
  }
  async function disattiva() {
    const s = await sub(); if (!s) return;
    const c = Sond.contesto();
    try { if (c.cl) await c.cl.from("push_subscriptions").delete().eq("endpoint", s.endpoint); } catch { /* ok */ }
    await s.unsubscribe();
  }
  /* numero sull'icona: su iPhone (app installata) compare il numero, su Android Chrome un puntino */
  function numero(n) {
    try { if (n > 0 && navigator.setAppBadge) navigator.setAppBadge(n).catch(() => {}); else if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {}); } catch { /* ok */ }
  }
  /* il service worker avvisa l'app quando arriva un push: si ricarica l'elenco delle idee */
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e => { if (e.data && e.data.lit === "push") Sond.aggiorna(); });
  return { stato, attiva, disattiva, numero, sup };
})();
