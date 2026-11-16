"use strict";
/* Sincronizzazione condivisa tra i telefoni del gruppo: Firebase Realtime Database via REST, nessuna libreria.
   Attiva solo se i dati riservati contengono sync.url e sync.codice (il codice del gruppo è il segreto che protegge i dati).
   Struttura nel database: g/<codice>/idee/<id>, g/<codice>/spese/<id>, g/<codice>/voti/<idIdea>/<nome>.
   Usa le funzioni dell'app (S, unisci, render, toast): lo stesso file serve alla versione 2 e alla 3. */
const Sync = (() => {
  const URL_OK = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(firebasedatabase\.app|firebaseio\.com)$/;
  const COD_OK = /^[A-Za-z0-9_-]{16,64}$/;
  let inCorso = false, richiesto = false, stato = "spenta", ultimo = 0, debounce = 0, daRender = false, avviato = false, ultimaFirma = "";
  const cfg = () => { const c = typeof S !== "undefined" && S.riserv && S.riserv.sync; return c && URL_OK.test(c.url || "") && COD_OK.test(c.codice || "") ? c : null; };
  const chiaveNome = n => String(n).replace(/[.$#\[\]\/?%]/g, "_");
  const senzaVoti = x => { const r = Object.assign({}, x); delete r.voti; return r; };
  const quando = ms => new Date(ms).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  async function http(metodo, percorso, corpo, silenzioso) {
    const c = cfg(), ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(`${c.url}/g/${c.codice}${percorso}.json${silenzioso ? "?print=silent" : ""}`, {
        method: metodo, cache: "no-store", signal: ctrl.signal,
        headers: corpo === undefined ? {} : { "Content-Type": "application/json" }, body: corpo === undefined ? undefined : JSON.stringify(corpo)
      });
      if (!r.ok) { const e = new Error("http " + r.status); e.status = r.status; throw e; }
      return r.status === 204 ? null : await r.json();
    } finally { clearTimeout(t); }
  }
  const salvaSilenzioso = () => { try { localStorage.setItem(CH, JSON.stringify(S)); } catch { /* ok */ } };
  const libero = () => { const a = document.activeElement; return !a || !a.closest || !a.closest("form,textarea,input,select"); };
  function rinfresca() { if (libero()) { daRender = false; try { render(); } catch { /* ok */ } } else daRender = true; }

  /* scarica tutto e unisce con i dati del telefono: i dati remoti passano da unisci(), che li controlla */
  async function tira() {
    const d = (await http("GET", "")) || {}, prima = new Set(S.idee.map(x => x.id)), nuove = []; let cambi = 0;
    for (const k of ["idee", "spese"]) for (const [id, x] of Object.entries(d[k] || {})) {
      if (!x || typeof x !== "object") continue;
      const voce = Object.assign({}, x, { id });
      if (k === "idee") voce.voti = d.voti && d.voti[id] && typeof d.voti[id] === "object" ? d.voti[id] : {};
      if (unisci(k, voce)) { cambi++; if (k === "idee" && !prima.has(id) && !voce.del && +voce.stato === 0 && voce.autore !== S.me) nuove.push(voce); }
    }
    if (cambi) salvaSilenzioso();
    return { cambi, nuove, d };
  }
  /* invia solo ciò che manca nel database o lì è più vecchio, e solo il proprio voto per ogni idea: una richiesta sola */
  async function spingi(d) {
    const agg = {}, me = S.me ? chiaveNome(S.me) : "";
    for (const k of ["idee", "spese"]) for (const x of S[k]) {
      if (!x || typeof x.id !== "string") continue;
      const rem = d[k] && d[k][x.id];
      if (!rem || typeof rem !== "object" || tsOkRemoto(rem.ts) < (x.ts || 0)) agg[`${k}/${x.id}`] = senzaVoti(x);
      const mio = k === "idee" && me && x.voti && x.voti[S.me];
      if (mio) { const rv = d.voti && d.voti[x.id] && d.voti[x.id][me]; if (!Array.isArray(rv) || rv[1] < mio[1]) agg[`voti/${x.id}/${me}`] = mio; }
    }
    if (Object.keys(agg).length) await http("PATCH", "", agg, true);
  }
  const tsOkRemoto = v => { const n = +v; return Number.isFinite(n) ? n : 0; };
  function avvisaNuove(nuove) {
    if (!nuove.length || typeof toast !== "function") return;
    const t = nuove.length === 1 ? `${nuove[0].autore || "Qualcuno"} ha aggiunto un'idea: ${nuove[0].testo}` : `${nuove.length} nuove idee da votare`;
    toast(t + ". Tocca per vederle.", () => { tab = "idee"; if (typeof filtroS !== "undefined") filtroS = "mie"; if (typeof msg !== "undefined") msg = ""; if (typeof edit !== "undefined") edit = null; scrollTo(0, 0); render(); });
  }
  const firma = () => JSON.stringify([S.me, S.idee, S.spese]);
  function mostraStato() { const e = document.getElementById("sync-stato"); if (e) e.textContent = testo(); }
  let corrente = null;
  function ciclo() {
    if (!cfg()) { stato = "spenta"; return Promise.resolve(); }
    if (inCorso) { richiesto = true; return corrente; }
    inCorso = true; stato = "in corso";
    corrente = (async () => {
      let cambi = 0;
      try { const r = await tira(); cambi = r.cambi; await spingi(r.d); stato = "ok"; ultimo = Date.now(); avvisaNuove(r.nuove); }
      catch (e) { stato = e && e.status >= 400 && e.status < 600 ? "rifiutata" : "offline"; }
      inCorso = false; ultimaFirma = firma();
      if (cambi || daRender) rinfresca(); else mostraStato();
      if (richiesto) { richiesto = false; setTimeout(ciclo, 300); }
    })();
    return corrente;
  }
  function cambiato() { if (!cfg() || firma() === ultimaFirma) return; clearTimeout(debounce); debounce = setTimeout(ciclo, 800); }
  function testo() {
    if (!cfg()) return "Non attiva: importa il file dei dati riservati aggiornato.";
    if (stato === "in corso") return "Sincronizzazione in corso.";
    if (stato === "rifiutata") return "Il database rifiuta l'accesso: controlla regole, indirizzo e codice.";
    if (stato === "offline") return ultimo ? `In attesa di rete. Ultimo aggiornamento alle ${quando(ultimo)}.` : "In attesa di rete: le modifiche partiranno appena torna la connessione.";
    return ultimo ? `Attiva. Ultimo aggiornamento alle ${quando(ultimo)}.` : "Attiva.";
  }
  function start() {
    if (avviato) { ciclo(); return; }
    avviato = true; ciclo();
    setInterval(() => { if (!document.hidden) ciclo(); }, 25000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) ciclo(); });
    addEventListener("online", ciclo);
  }
  return { start, cambiato, ora: ciclo, testo, acceso: () => !!cfg() };
})();
