"use strict";
/* Londra in tasca 4, «Vetrina di Regent Street». Itinerario in dati.js; idee, spese, note e valigia nel telefono (localStorage, chiave lit-v1).
   Versione principale: usa la chiave lit-v1 delle versioni precedenti, quindi nessuna migrazione e i dati restano dove sono. Formato di scambio identico. */
const SyncX = typeof Sync !== "undefined" ? Sync : { start() {}, cambiato() {}, ora: () => Promise.resolve(), testo: () => "Non disponibile.", acceso: () => false };
const CH = "lit-v1", CH_VECCHI = [];
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = n => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
const gbp = n => "£" + num(n), eur = n => "€" + num(n);
const vivi = a => a.filter(x => !x.del);
const STATI = ["in votazione", "approvata", "respinta", "fatta"];
const riduci = matchMedia("(prefers-reduced-motion: reduce)");
const tic = ms => { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch { /* non disponibile */ } };
const ORD_TAB = ["oggi", "viaggio", "idee", "spese", "altro"];
const calmo = () => document.documentElement.classList.contains("calmo");
/* transizione tra schermate: View Transitions con direzione, ripiego in CSS dove non esistono */
let vtId = 0, vtTimer = 0;
const vt = (fn, dir = 1) => {
  if (calmo()) { fn(); return; }
  const r = document.documentElement, id = ++vtId; r.dataset.dir = dir < 0 ? "indietro" : "avanti";
  const fine = () => { if (id === vtId) delete r.dataset.dir; };
  if (document.startViewTransition) { const t = document.startViewTransition(() => { fn(); }); t.ready.catch(() => {}); t.finished.catch(() => {}).then(fine); }
  else { fn(); const v = $("#vista"); clearTimeout(vtTimer); v.classList.remove("entra-avanti", "entra-indietro"); void v.offsetWidth; v.classList.add(dir < 0 ? "entra-indietro" : "entra-avanti"); vtTimer = setTimeout(() => { fine(); v.classList.remove("entra-avanti", "entra-indietro"); }, 360); }
};
/* ingresso a cascata, al massimo 8 elementi a 28 ms l'uno */
function cascata() {
  if (calmo()) return; const v = $("#vista");
  [...v.querySelectorAll(".tl li, .voce, #vista > .scheda, .biglietto, .finestra")].slice(0, 8).forEach((el, i) => el.style.setProperty("--i", i));
  clearTimeout(cascata.t); v.classList.add("stag"); cascata.t = setTimeout(() => v.classList.remove("stag"), 700);
}
const catNome = (l, k) => (l.find(c => c[0] === k) || l[l.length - 1])[1];
const catOk = (l, k) => (l.some(c => c[0] === k) ? k : l[l.length - 1][0]);

/* icone: un solo set, tratto 1,75, colore del testo */
const ICONE = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>',
  plane: '<path d="M3 12 21 4l-5 16-4-6.5z"/><path d="M12 13.5 21 4"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  phone: '<path d="M6 3h3l1.5 4-2 1.5a11 11 0 0 0 6 6L16 12.5l4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z"/>',
  bag: '<path d="M6 8h12l1 12H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3"/>'
};
const ic = (n, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONE[n]}</svg>`;

/* ---------- stato ---------- */
const vuoto = () => ({ me: "", idee: [], spese: [], fatti: {}, note: {}, cambio: 0, cambioQ: 0, cambioData: "", val: {}, profili: {}, valP: "", mov: "auto", riserv: null, migratoDa: "", finestre: {}, salutoGiorno: "", contoVisto: {}, valigiaOk: {} });
const ID_OK = /^[A-Za-z0-9_-]{1,40}$/;
const nomeOk = p => typeof p === "string" && p.trim() !== "" && p.length <= 40 && !/^(__proto__|constructor|prototype)$/.test(p);
const mappa = (o, ok) => { const r = {}; if (o && typeof o === "object" && !Array.isArray(o)) for (const [k, v] of Object.entries(o).slice(0, 600)) if (k.length <= 80 && k !== "__proto__" && ok(v)) r[k] = v; return r; };
const pulisciMappe = x => {
  for (const k of ["finestre", "contoVisto", "valigiaOk"]) x[k] = mappa(x[k], v => v === true);
  if (typeof x.salutoGiorno !== "string") x.salutoGiorno = "";
  x.profili = mappa(x.profili, v => v === "uomo" || v === "donna"); x.fatti = mappa(x.fatti, v => typeof v === "boolean");
  x.note = mappa(x.note, v => v && typeof v.t === "string"); x.val = mappa(x.val, v => v && typeof v === "object" && !Array.isArray(v));
};
function leggi(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }
function carica() {
  try {
    let raw = leggi(CH), migra = "";
    if (!raw) for (const k of CH_VECCHI) { raw = leggi(k); if (raw) { migra = k; break; } }
    const x = Object.assign(vuoto(), raw || {});
    for (const k of ["idee", "spese"]) x[k] = Array.isArray(x[k]) ? x[k].filter(y => y && typeof y === "object" && typeof y.id === "string" && ID_OK.test(y.id)) : [];
    pulisciMappe(x);
    if (!["auto", "on", "off"].includes(x.mov)) x.mov = raw && raw.neve === false ? "off" : "auto";
    delete x.neve;
    if (!Number.isFinite(+x.cambio)) x.cambio = 0;
    if (!Number.isFinite(+x.cambioQ)) x.cambioQ = 0;
    for (const k of ["me", "valP", "cambioData", "migratoDa"]) if (typeof x[k] !== "string") x[k] = "";
    if (x.riserv && typeof x.riserv !== "object") x.riserv = null;
    if (migra) { x.migratoDa = migra; try { localStorage.setItem(CH, JSON.stringify(x)); } catch { /* ok */ } }
    return x;
  } catch { return vuoto(); }
}
let S = carica(), salvaAvvisato = false;
/* movimento: «Automatico» segue il telefono (su Android «Rimuovi animazioni» lo ferma), «Sempre attivo» lo ignora */
const movOff = () => S.mov === "off" || (S.mov !== "on" && riduci.matches);
function applicaMov() {
  const r = document.documentElement; r.classList.toggle("calmo", movOff()); r.classList.toggle("forza", S.mov === "on");
  const c = document.getElementById("neve"); if (c) c.hidden = movOff();
}
applicaMov();
function salva() { try { localStorage.setItem(CH, JSON.stringify(S)); if (typeof Sync !== "undefined") Sync.cambiato(); } catch { if (!salvaAvvisato) { salvaAvvisato = true; msg = "Impossibile salvare su questo telefono: le modifiche si perdono alla chiusura."; } } }
const gruppo = () => (S.riserv && Array.isArray(S.riserv.gruppo) && S.riserv.gruppo.length ? S.riserv.gruppo : TRIP.gruppoDefault);
const oggiIso = (n = new Date()) => `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
const giornoIniziale = () => { const i = TRIP.giorni.findIndex(d => d.iso === oggiIso()); return i < 0 ? 0 : i; };

let tab = "oggi", g = giornoIniziale(), vsub = "itin", sub = "scambio", msg = "", msgTipo = "", edit = null, bozza = null;
let filtroG = null, filtroS = null, filtroC = null, ordine = "recenti";

/* ---------- link e Google Maps ---------- */
const primoLink = s => { const m = /https?:\/\/[^\s<>"']+/i.exec(String(s || "")); return m ? m[0].replace(/[.,;)]+$/, "") : ""; };
function normLink(s) {
  s = String(s || "").trim(); if (!s) return "";
  let u = primoLink(s);
  if (!u) { const tk = s.split(/\s+/).find(x => /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(x)); if (tk) u = "https://" + tk; }
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; }
}
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const luogo = x => encodeURIComponent(/Luton|London|Londra/.test(x) ? x : x + ", London");
const casaQ = () => (S.riserv && S.riserv.alloggio && S.riserv.alloggio.indirizzo) || TRIP.alloggio.q;
const qt = t => (t.casa && casaQ()) || t.q;
function mapsUrl(qs, modo) {
  const q = qs.filter(Boolean);
  if (!q.length) return "";
  if (q.length === 1) return "https://www.google.com/maps/search/?api=1&query=" + luogo(q[0]);
  return `https://www.google.com/maps/dir/?api=1&origin=${luogo(q[0])}&destination=${luogo(q[q.length - 1])}` +
    (q.length > 2 ? `&waypoints=${q.slice(1, -1).map(luogo).join("%7C")}` : "") + `&travelmode=${modo}`;
}
const avviso = () => (msg ? `<div class="msg${msgTipo}">${esc(msg)}</div>` : "");
const bannerSync = () => {
  if (!SyncX.acceso()) return `<div class="msg avv" role="status"><b>Idee e sondaggi condivisi non sono attivi su questo telefono.</b> Per ora le idee restano solo qui. Tocca il link di attivazione ricevuto su WhatsApp, oppure apri Altro, Scambio.<div class="riga"><button class="btn" data-az="vai" data-v="altro:scambio">Apri Scambio</button></div></div>`;
  const t = SyncX.testo(); return /rifiuta/.test(t) ? `<div class="msg avv" role="status">${esc(t)}</div>` : "";
};
const dire = (t, tipo = "") => { msg = t; msgTipo = tipo ? " " + tipo : ""; };

/* ---------- tempo: tappa in corso ---------- */
const orario = o => { const m = /^~?(\d{1,2}):(\d{2})/.exec(o || ""); return m ? +m[1] * 60 + +m[2] : null; };
function statoOggi() {
  const n = new Date(), i = TRIP.giorni.findIndex(d => d.iso === oggiIso(n)); if (i < 0) return null;
  const min = n.getHours() * 60 + n.getMinutes(); let cur = -1, next = -1;
  TRIP.giorni[i].tappe.forEach((t, k) => { const o = orario(t.ora); if (o == null) return; if (o <= min) cur = k; else if (next < 0) next = k; });
  return { g: i, cur, next, min };
}
function fraseProssima(st) {
  const d = TRIP.giorni[st.g], nxt = d.tappe[st.next], cur = d.tappe[st.cur];
  if (nxt) { const diff = orario(nxt.ora) - st.min, h = Math.floor(diff / 60), m = diff % 60; return { t: nxt.nome, s: `${nxt.ora}, tra ${h ? h + " h " : ""}${m} min`, q: qt(nxt) }; }
  if (cur) { const dopo = d.tappe.slice(st.cur + 1).find(x => orario(x.ora) == null); return dopo ? { t: dopo.nome, s: "senza orario fisso", q: qt(dopo) } : { t: cur.nome, s: "ultima tappa del giorno", q: qt(cur) }; }
  return null;
}
let osservatore = null;
function osservaGuida() {
  if (osservatore) { osservatore.disconnect(); osservatore = null; }
  const a = $("#g-a"), b = $("#g-b"); if (!a || !b || !("IntersectionObserver" in window)) return;
  const d = TRIP.giorni[g], visibili = new Set();
  osservatore = new IntersectionObserver(voci => {
    voci.forEach(v => { const i = +v.target.dataset.i; if (v.isIntersecting) visibili.add(i); else visibili.delete(i); });
    const ix = [...visibili].filter(i => orario(d.tappe[i].ora) != null).sort((x, y) => x - y); if (!ix.length) return;
    const eti = t => `${t.ora.replace("~", "")} ${t.nome}`;
    a.textContent = eti(d.tappe[ix[0]]); b.textContent = eti(d.tappe[ix[ix.length - 1]]);
  }, { rootMargin: "-48px 0px -90px 0px" });
  document.querySelectorAll(".tl li").forEach(li => osservatore.observe(li));
}
function aggiornaAdesso() {
  const box = $("#adesso"); if (box) box.hidden = true;
  document.querySelectorAll(".tl li").forEach(li => li.classList.remove("in-corso", "prossima", "passata"));
  const st = statoOggi(); if (!st || st.g !== g) return;
  for (let i = 0; i < st.cur; i++) $(`.tl li[data-i="${i}"]`)?.classList.add("passata");
  if (st.cur >= 0) $(`.tl li[data-i="${st.cur}"]`)?.classList.add("in-corso");
  if (st.next >= 0) $(`.tl li[data-i="${st.next}"]`)?.classList.add("prossima");
}
/* ---------- sondaggio ---------- */
const votanti = () => gruppo();
const miVoto = i => (S.me && i.voti && i.voti[S.me] && i.voti[S.me][0]) || 0;
const possoVotare = () => !!S.me && votanti().includes(S.me);
const possoChiudere = i => !!S.me && (i.autore === S.me || primo(S.me) === primo(TRIP.organizzatore));
function conteggio(i) {
  const c = { s: 0, n: 0, x: 0 }, mancano = [];
  votanti().forEach(p => { const k = i.voti && i.voti[p] ? i.voti[p][0] : 0; if (k === 1) c.s++; else if (k === 2) c.n++; else if (k === 3) c.x++; else mancano.push(p); });
  const esito = c.s + c.n === 0 ? "nessun voto" : c.s > c.n ? "approvata" : c.n > c.s ? "respinta" : "pari";
  return { c, mancano, esito, votato: votanti().length - mancano.length };
}
const daVotareIdea = i => !i.del && +i.stato === 0 && possoVotare() && miVoto(i) === 0;
const daVotare = () => vivi(S.idee).filter(daVotareIdea).length;
function avvisaVoti() {
  const n = daVotare();
  if (n > 0) toast(`Hai ${n} ${n === 1 ? "idea" : "idee"} da votare. Tocca per votare.`, () => { tab = "idee"; filtroS = "mie"; msg = ""; edit = null; scrollTo(0, 0); render(); focaTitolo(); });
}

/* ---------- valigia ---------- */
const persone = () => [...gruppo(), (S.riserv && S.riserv.bambina) || "Bambina"];
const profiloDi = p => (p === persone()[persone().length - 1] ? "bambina" : (S.profili[p] || ""));
const vociDi = p => { const pr = profiloDi(p); return pr ? TRIP.valigia.filter(v => v.per.includes(pr)) : []; };
const statoValigia = p => { const m = S.val[p] || {}, v = vociDi(p); return { fatte: v.filter(x => m[x.id]).length, tot: v.length }; };
const testoD = (d, gg, nn) => (typeof d === "function" ? d(gg, nn) : d || "");

/* ---------- viste ---------- */
function luci(prima) {
  return `<svg class="luci${prima ? " accendi" : ""}" data-az="onda" viewBox="0 0 320 16" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 4 Q20 14 40 4 T80 4 T120 4 T160 4 T200 4 T240 4 T280 4 T320 4" fill="none" stroke="#c9a24b" stroke-width="1"/>${[20, 60, 100, 140, 180, 220, 260, 300].map((x, i) => `<circle class="lampada l${i % 3}" style="--i:${i}" cx="${x}" cy="${i % 2 ? 11 : 10}" r="3.2"/>`).join("")}</svg>`;
}
/* le finestre del viaggio: una porta per giorno, si apre quella di oggi */
function avvento() {
  const oggi = oggiIso(), ok = TRIP.giorni.some(d => d.iso <= oggi);
  const porte = TRIP.giorni.map((d, i) => {
    const aperta = !!S.finestre[d.iso], pronta = d.iso <= oggi, stato = aperta ? "aperta" : pronta ? "pronta" : "chiusa", gg = d.data.replace(/^\S+ /, "");
    return `<button class="finestra ${stato}" data-az="finestra" data-v="${i}"${pronta ? "" : ' aria-disabled="true"'} aria-label="Giorno ${i + 1}, ${esc(gg)}: ${aperta ? esc(d.titolo) + ". Tocca per aprire il giorno" : pronta ? "tocca per aprire la finestra" : "si apre il " + esc(gg)}">
      <span class="dietro"><small>Giorno</small><b>${i + 1}</b></span><span class="porta"><b>${esc(d.iso.slice(8))}</b></span></button>`;
  }).join("");
  const att = TRIP.giorni.find(d => d.iso === oggi), info = !ok ? "Le finestre si aprono giorno per giorno, dal 23 dicembre." : att ? (S.finestre[att.iso] ? `Giorno ${TRIP.giorni.indexOf(att) + 1}: ${att.titolo}.` : "Tocca la finestra di oggi per aprirla.") : "Tocca una finestra per aprire il giorno.";
  return `<div class="avvento" role="group" aria-label="Finestre del viaggio">${porte}</div><p class="avvento-info mute piccolo">${esc(info)}</p>`;
}

function vistaOggi() {
  let prima = false; try { prima = !sessionStorage.getItem("lit-luci"); if (prima) sessionStorage.setItem("lit-luci", "1"); } catch { /* ok */ }
  const ora = new Date(), st = statoOggi(), partenza = new Date(TRIP.partenza), ng = TRIP.giorni.length;
  let titolo, sotto;
  if (st) { titolo = `Giorno ${st.g + 1} di ${ng}`; sotto = `${TRIP.giorni[st.g].data}. ${TRIP.giorni[st.g].titolo}.`; }
  else if (ora < partenza) { const mezz = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), gg = Math.max(1, Math.round((mezz(partenza) - mezz(ora)) / 864e5)); titolo = `${gg} ${gg === 1 ? "giorno" : "giorni"} a Londra`; sotto = testoPartenza(); }
  else { titolo = "Bentornati"; sotto = "Il viaggio è finito: salva un backup di idee e spese."; }
  const f = st ? fraseProssima(st) : null, giorno = st ? TRIP.giorni[st.g] : null, cur = st && st.cur >= 0 ? giorno.tappe[st.cur] : null;
  const mappa = (q, cls) => (q ? `<a class="map ${cls}" target="_blank" rel="noopener" href="${mapsUrl([q], giorno.mezzo)}">${ic("pin", 18)}Mappa<span class="vh">, si apre in una nuova scheda</span></a>` : "");
  const inCorso = cur ? `<div class="scheda acceso"><div class="nome">${esc(cur.nome)}<span class="et">In corso</span></div><div class="desc">${esc(cur.ora)}${cur.desc ? `. ${esc(cur.desc)}` : ""}</div>
      <div class="riga">${mappa(qt(cur), "pri")}<button class="btn" data-az="vai" data-v="viaggio:itin">Apri il giorno</button></div></div>` : "";
  const mostraF = f && !(cur && st.next < 0 && f.t === cur.nome);
  const prossima = mostraF ? `<div class="scheda tratt"><div class="nome">${esc(f.t)}<span class="et">Prossima</span></div><div class="desc">${esc(f.s)}</div>
      <div class="riga">${cur ? "" : mappa(f.q, "pri")}${cur ? "" : `<button class="btn" data-az="vai" data-v="viaggio:itin">Apri il giorno</button>`}</div></div>`
    : (!st ? `<div class="scheda"><div class="nome">Primo giorno: ${esc(TRIP.giorni[0].titolo)}</div><div class="desc">${TRIP.giorni[0].tappe.length} tappe, dal volo del mercoledì sera alla cena a King's Cross.</div>
      <div class="riga"><button class="btn" data-az="vai" data-v="viaggio:itin">Apri l'itinerario</button></div></div>` : "");
  const dv = daVotare(), tot = saldi().tot, vs = S.valP ? statoValigia(S.valP) : null;
  const voce = (icona, t, sub, v, az, extra = "") => `<button class="voce" data-az="vai" data-v="${az}">${ic(icona, 22)}<span class="t"><b>${t}</b><span>${sub}</span></span><span class="v${extra}">${v}</span></button>`;
  return `<header class="fascia luminosa">${luci(prima)}<h1>${esc(titolo)}</h1><p>${esc(sotto)}</p></header>
    ${bannerSync()}${inCorso}${prossima}
    <h2 class="h-sez">Le finestre del viaggio</h2>
    ${avvento()}
    <h2 class="h-sez">Da decidere</h2>
    <div class="elenco">${voce("bulb", "Idee da votare", dv ? "Tocca per votare" : "Nessuna in attesa", dv, "idee:mie", dv ? " allerta" : "")}</div>
    <h2 class="h-sez">In borsa</h2>
    <div class="elenco">
      ${voce("plane", "Voli e prenotazioni", "Andata mer 23/12 alle 19:05, ritorno dom 27/12 alle 20:55", "", "viaggio:prenot")}
      ${voce("bag", "Valigia", vs && vs.tot ? `${esc(S.valP)}: ${vs.fatte} su ${vs.tot}` : "Scegli chi sei per la tua lista", "", "altro:valigia")}
      ${voce("key", "Frasi utili in inglese", "Per ristoranti, taxi e metro", "", "altro:frasi")}
      <a class="voce" href="tel:999">${ic("phone", 22)}<span class="t"><b>Emergenze nel Regno Unito</b><span>Polizia, ambulanza, pompieri</span></span><span class="v">999</span></a>
    </div>
    <h2 class="h-sez">Conti</h2>
    <div class="elenco">
      ${voce("wallet", "Spese", S.cambio > 0 ? "circa " + eur(tot * S.cambio) : "speso finora", gbp(tot), "spese")}
      ${voce("swap", "Cambio", "Sterline ed euro, anche senza rete", S.cambio > 0 ? `£10 = ${eur(10 * S.cambio)}` : "da impostare", "altro:cambio")}
    </div>`;
}

function vistaViaggio() {
  const seg = [["itin", "Itinerario"], ["prenot", "Prenotazioni"]].map(([v, l]) => `<button class="chip" data-az="vsub" data-v="${v}" aria-pressed="${vsub === v}">${l}</button>`).join("");
  const chips = `<div class="chips" role="group" aria-label="Sezione del viaggio">${seg}</div>`;
  if (vsub === "prenot") return `<h1 class="vt">Prenotazioni</h1>${chips}${avviso()}${vistaPrenot()}`;
  return vistaItinerario(chips);
}
function vistaItinerario(chips) {
  const d = TRIP.giorni[g], oggi = statoOggi();
  const rail = TRIP.giorni.map((x, i) => `<button class="giorno${oggi && oggi.g === i ? " oggi" : ""}" data-az="giorno" data-v="${i}" aria-pressed="${i === g}" aria-label="Giorno ${i + 1}, ${esc(x.data)}${oggi && oggi.g === i ? ", oggi" : ""}"><b>${x.iso.slice(8)}</b><small>${esc(x.breve.split(" ")[1])}</small></button>`).join("");
  const tappe = d.tappe.map((t, i) => {
    const nk = `${g}-${i}`, nt = (S.note[nk] && S.note[nk].t) || "", ha = orario(t.ora) != null;
    return `<li data-i="${i}"><div class="quando${ha ? "" : " testo"}">${esc(t.ora || "")}</div><div class="scheda"><div class="nome">${esc(t.nome)}</div>
    ${t.desc ? `<div class="desc">${esc(t.desc)}</div>` : ""}
    <div class="riga">${t.costo ? `<span class="pill">${esc(t.costo)}</span>` : ""}${t.q ? `<a class="map" target="_blank" rel="noopener" href="${mapsUrl([qt(t)], d.mezzo)}">${ic("pin", 18)}Mappa<span class="vh"> di ${esc(t.nome)}, si apre in una nuova scheda</span></a>` : ""}</div>
    <details class="nota-t"${nt ? " open" : ""}><summary>${nt ? "Nota personale" : "Aggiungi nota"}</summary>
    <textarea rows="2" maxlength="500" data-chg="nota" data-v="${nk}" aria-label="Nota personale per ${esc(t.nome)}" placeholder="Solo sul tuo telefono">${esc(nt)}</textarea></details></div></li>`;
  }).join("");
  const percorso = mapsUrl(d.tappe.map(qt), d.mezzo);
  const pub = d.pub ? `<div class="scheda pub"><div class="nome">Il pub del giorno: ${esc(d.pub.nome)}</div><div class="desc">${esc(d.pub.dove)}</div><div class="desc" style="margin-top:6px">${esc(d.pub.alt)}</div>
    <div class="riga"><a class="map" target="_blank" rel="noopener" href="${mapsUrl([d.pub.q], d.mezzo)}">${ic("pin", 18)}Mappa del pub<span class="vh">, si apre in una nuova scheda</span></a></div></div>` : "";
  const timed = d.tappe.filter(t => orario(t.ora) != null), pri = timed[0], ult = timed[timed.length - 1], eti = t => (t ? `${t.ora.replace("~", "")} ${t.nome}` : "");
  return `<header class="fascia"><h1>${esc(d.data.replace(/^\S+ /, ""))}</h1><p>${esc(d.titolo)}. ${d.tappe.length} tappe${pri && ult ? `, dalle ${esc(pri.ora.replace("~", ""))} alle ${esc(ult.ora.replace("~", ""))}` : ""}.</p></header>
    <div class="guida" aria-hidden="true"><span id="g-a">${esc(eti(pri))}</span><span id="g-b">${esc(eti(ult))}</span></div>${chips}${avviso()}
    <div class="rail" role="group" aria-label="Giorni del viaggio">${rail}</div>
    <div id="adesso" hidden></div>
    <ol class="tl">${tappe}</ol>
    ${percorso ? `<p><a class="map pri" target="_blank" rel="noopener" href="${percorso}">${ic("compass", 18)}Percorso del giorno su Google Maps<span class="vh">, si apre in una nuova scheda</span></a></p>` : ""}
    ${pub}${d.nota ? `<div class="scheda"><div class="desc">${esc(d.nota)}</div></div>` : ""}`;
}
function casella(id, t, d) {
  return `<label class="c${S.fatti[id] ? " fatto" : ""}"><input type="checkbox" data-chg="fatto" data-v="${id}"${S.fatti[id] ? " checked" : ""}><span><b>${esc(t)}</b>${d ? `<br><small class="mute">${esc(d)}</small>` : ""}</span></label>`;
}
function biglietto(da, a, nomeDa, nomeA, titolo, dettaglio, codice) {
  return `<div class="biglietto"><div class="tratta"><div><b>${da}</b><small>${nomeDa}</small></div>${ic("plane", 28)}<div style="text-align:right"><b>${a}</b><small>${nomeA}</small></div></div>
    <div class="perfora"></div><div class="nome">${titolo}</div><div class="desc">${dettaglio}</div>
    ${codice ? `<div class="riga" style="justify-content:space-between"><span class="codice">${esc(codice)}</span><button class="btn" data-az="copia" data-v="${esc(codice)}">${ic("copy", 18)}Copia<span class="vh"> il codice di prenotazione</span></button></div>` : `<div class="mute piccolo" style="margin-top:8px">Codice nel file riservato: importalo da Altro, Scambio.</div>`}</div>`;
}
function vistaPrenot() {
  const r = S.riserv || {};
  return `${biglietto("VCE", "LTN", "Venezia Marco Polo", "Londra Luton", "Andata, Wizz Air W4 6747", "Mercoledì 23/12, partenza 19:05, arrivo 20:25. Solo bagaglio a mano 40x30x20.", r.voli && r.voli.andata)}
    ${biglietto("LTN", "VCE", "Londra Luton", "Venezia Marco Polo", "Ritorno, Ryanair FR 761", "Domenica 27/12, partenza 20:55, arrivo 00:05 del 28/12. Carta d'imbarco solo sull'app.", r.voli && r.voli.ritorno)}
    <div class="scheda"><div class="nome">Cena della vigilia da Idalia</div><div class="desc">Pillar Hall, 5 Olympia Way, London W14 0EY. Giovedì 24/12 alle 20:15, tavolo per 5, tolleranza di 15 minuti.</div>
      ${r.idalia ? `<div class="riga" style="justify-content:space-between"><span class="codice">N. ${esc(r.idalia.conferma)}</span><button class="btn" data-az="copia" data-v="${esc(r.idalia.conferma)}">${ic("copy", 18)}Copia<span class="vh"> il numero OpenTable</span></button></div><div class="mute piccolo">Nome registrato: ${esc(r.idalia.nome)}</div>` : `<div class="mute piccolo" style="margin-top:8px">Conferma nel file riservato.</div>`}
      <div class="riga"><a class="map" target="_blank" rel="noopener" href="${mapsUrl(["Idalia, Pillar Hall, 5 Olympia Way, London W14 0EY"], "transit")}">${ic("pin", 18)}Mappa<span class="vh">, si apre in una nuova scheda</span></a></div></div>
    <div class="scheda"><div class="nome">Alloggio</div><div class="desc">${esc(TRIP.alloggio.testo)}</div>
      <div class="riga"><button class="btn" data-az="copia" data-v="${esc(TRIP.alloggio.testo)}">${ic("copy", 18)}Copia l'indirizzo</button><a class="map" target="_blank" rel="noopener" href="${mapsUrl([casaQ()], "transit")}">${ic("pin", 18)}Mappa<span class="vh">, si apre in una nuova scheda</span></a></div></div>
    ${r.bambina ? `<div class="scheda"><div class="nome">Gruppo</div><div class="desc">${esc(gruppo().join(", "))} e ${esc(r.bambina)} (4 anni).</div></div>` : ""}
    <h2 class="h-sez">Da fare</h2><div class="scheda">${TRIP.promemoria.map(p => casella("p_" + p.id, p.t, p.d)).join("")}</div>
    <h2 class="h-sez">Da verificare</h2><div class="scheda"><ul class="lista">${TRIP.daVerificare.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <h2 class="h-sez">Info utili</h2><div class="scheda"><ul class="lista">${TRIP.info.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
}

/* idee */
function formIdea(x = {}) {
  const mod = !!x.id;
  return `<form class="f" data-form="idea"><input type="hidden" name="id" value="${esc(x.id || "")}">
    <label class="mute" for="i-testo">Idea</label><input type="text" id="i-testo" name="testo" placeholder="Es. Natural History Museum" required maxlength="200" value="${esc(x.testo || "")}">
    <label class="mute" for="i-cat">Categoria</label><select id="i-cat" name="cat">${IDEE_CAT.map(([k, l]) => `<option value="${k}"${catOk(IDEE_CAT, x.cat) === k ? " selected" : ""}>${l}</option>`).join("")}</select>
    <label class="mute" for="i-link">Link (facoltativo)</label><input type="text" id="i-link" name="link" inputmode="url" autocapitalize="none" placeholder="TikTok, Instagram, sito web" value="${esc(x.link || "")}">
    <label class="mute" for="i-nota">Nome del posto o nota (facoltativa)</label><input type="text" id="i-nota" name="nota" maxlength="200" value="${esc(x.nota || "")}">
    <label class="mute" for="i-giorno">Giorno</label><select id="i-giorno" name="giorno"><option value="0">Qualsiasi giorno</option>${TRIP.giorni.map((d, i) => `<option value="${i + 1}"${+x.giorno === i + 1 ? " selected" : ""}>Giorno ${i + 1}, ${esc(d.breve)}</option>`).join("")}</select>
    <div class="riga"><button class="btn pri" type="submit">${mod ? "Salva modifica" : "Aggiungi idea"}</button>${mod || bozza ? `<button type="button" class="btn" data-az="annulla">Annulla</button>` : ""}</div></form>`;
}
function schedaIdea(i) {
  const l = normLink(i.link), id = esc(i.id), k = conteggio(i), mio = miVoto(i), aperta = +i.stato === 0, chiude = possoChiudere(i), nv = votanti().length;
  const bv = (n, lab) => `<button class="voto s${n}" data-az="vota" data-v="${id}:${n}" aria-pressed="${mio === n}"${aperta ? "" : " disabled"}>${lab}<span class="vh"> per ${esc(i.testo)}</span></button>`;
  const chiusura = [aperta && chiude ? `<button class="btn" data-az="chiudi" data-v="${id}:1">Chiudi: approvata</button><button class="btn" data-az="chiudi" data-v="${id}:2">Chiudi: respinta</button>` : "",
    +i.stato === 1 && chiude ? `<button class="btn" data-az="chiudi" data-v="${id}:3">Segna come fatta</button>` : "",
    !aperta && chiude ? `<button class="btn" data-az="chiudi" data-v="${id}:0">Riapri</button>` : ""].join("");
  const cat = catOk(IDEE_CAT, i.cat);
  return `<div class="scheda"><div class="nome" style="font-size:1.125rem">${esc(i.testo)}</div>
    <div class="riga" style="margin:4px 0 0"><span class="pill st${+i.stato}">${STATI[+i.stato] || STATI[0]}</span><span class="cat c-${cat}">${catNome(IDEE_CAT, cat)}</span></div>${i.nota ? `<div class="desc">${esc(i.nota)}</div>` : ""}
    ${l ? `<div class="riga"><a class="map" target="_blank" rel="noopener noreferrer" href="${esc(l)}">Apri il link<span class="vh"> di ${esc(i.testo)}</span>&nbsp;(${esc(host(l))})<span class="vh">, si apre in una nuova scheda</span></a></div>` : ""}
    <div class="desc">Proposta di ${esc(i.autore || "qualcuno")}${+i.giorno ? `, per il giorno ${+i.giorno}` : ""}${i.chiusoDa && !aperta ? `. Chiusa da ${esc(i.chiusoDa)}` : ""}.</div>
    <div class="sond" role="group" aria-label="Sondaggio: ${esc(i.testo)}">
      <div class="barra" role="img" aria-label="Sì ${k.c.s}, No ${k.c.n}, Non so ${k.c.x}, mancano ${k.mancano.length}"><i class="s" style="flex:${k.c.s}"></i><i class="n" style="flex:${k.c.n}"></i><i class="x" style="flex:${k.c.x}"></i><i class="m" style="flex:${k.mancano.length}"></i></div>
      <div class="desc" style="margin:0 0 8px">Sì ${k.c.s}, No ${k.c.n}, Non so ${k.c.x}. Hanno votato ${k.votato} su ${nv}${k.mancano.length ? `, mancano ${esc(k.mancano.join(", "))}` : ""}.${aperta ? ` Secondo la maggioranza: <b>${k.esito}</b>.` : ""}</div>
      <div class="riga" style="margin:0">${bv(1, "Sì")}${bv(2, "No")}${bv(3, "Non so")}</div></div>
    ${chiusura ? `<div class="riga">${chiusura}</div>` : ""}
    <div class="riga"><button class="btn" data-az="modIdea" data-v="${id}">Modifica<span class="vh"> ${esc(i.testo)}</span></button><button class="btn tondo rosso" data-az="delIdea" data-v="${id}" aria-label="Elimina ${esc(i.testo)}">${ic("x", 18)}</button></div></div>`;
}
function vistaIdee() {
  const ps = gruppo(), dv = daVotare();
  const cats = [["", "Ogni categoria"], ...IDEE_CAT].map(([v, l]) => `<button class="chip" data-az="filtroC" data-v="${v}" aria-pressed="${(filtroC ?? "") === v}">${l}</button>`).join("");
  const stati = [["", "Ogni stato"], ["mie", "Da votare da me"], ["0", "In votazione"], ["1", "Approvate"], ["2", "Respinte"], ["3", "Fatte"]].map(([v, l]) => `<button class="chip" data-az="filtroS" data-v="${v}" aria-pressed="${(filtroS ?? "") === v}">${l}</button>`).join("");
  const giorni = [["", "Tutti i giorni"], ...TRIP.giorni.map((d, i) => [String(i + 1), "Giorno " + (i + 1)]), ["0", "Senza giorno"]].map(([v, l]) => `<button class="chip" data-az="filtro" data-v="${v}" aria-pressed="${(filtroG ?? "") === v}">${l}</button>`).join("");
  const punti = i => { const k = conteggio(i); return k.c.s - k.c.n; };
  const passa = i => (filtroG == null || +i.giorno === +filtroG) && (filtroC == null || catOk(IDEE_CAT, i.cat) === filtroC) && (filtroS == null || (filtroS === "mie" ? daVotareIdea(i) : +i.stato === +filtroS));
  const lista = vivi(S.idee).filter(passa).sort((a, b) => (ordine === "voti" ? punti(b) - punti(a) : 0) || b.ts - a.ts).map(schedaIdea).join("");
  const ed = edit && edit.k === "idee" ? S.idee.find(x => x.id === edit.id && !x.del) : null, attivi = filtroG != null;
  return `<h1 class="vt">${dv > 0 ? `${dv} ${dv === 1 ? "idea" : "idee"} da votare` : "Idee"}</h1>${avviso()}${bannerSync()}
    <p class="mute">Ogni idea è un sondaggio: votano i quattro adulti e vince la maggioranza. Con la sincronizzazione attiva, idee e voti arrivano da soli su tutti i telefoni.</p>
    ${S.me ? "" : `<div class="scheda"><label class="mute" for="chisei">Chi sei? Serve per firmare idee e voti.</label><select id="chisei" data-chg="me"><option value="">Scegli il tuo nome</option>${ps.map(p => `<option>${esc(p)}</option>`).join("")}</select></div>`}
    <details class="scheda nuova"${ed || bozza ? " open" : ""}><summary>Nuova idea</summary>${formIdea(ed || bozza || {})}</details>
    <div class="chips" role="group" aria-label="Filtra per stato">${stati}</div>
    <div class="chips" role="group" aria-label="Filtra per categoria">${cats}</div>
    <div class="chips" role="group" aria-label="Ordine"><button class="chip" data-az="ordine" data-v="recenti" aria-pressed="${ordine !== "voti"}">Più recenti</button><button class="chip" data-az="ordine" data-v="voti" aria-pressed="${ordine === "voti"}">Più votate</button></div>
    <details class="scheda nuova"${attivi ? " open" : ""}><summary>Filtra per giorno${attivi ? " (attivo)" : ""}</summary>
    <div class="chips avvolgi" role="group" aria-label="Filtra per giorno">${giorni}</div></details>
    ${lista || `<div class="vuoto">Nessuna idea${filtroG != null || filtroS != null || filtroC != null ? " per questo filtro" : " ancora. Aggiungine una qui sopra"}.</div>`}`;
}

/* spese */
function saldi() {
  const ps = gruppo(), b = Object.create(null), pagato = Object.create(null), perCat = Object.create(null);
  ps.forEach(p => { b[p] = 0; pagato[p] = 0; });
  let tot = 0;
  vivi(S.spese).forEach(s => {
    const parti = s.tra && s.tra.length ? s.tra : ps, c = catOk(SPESE_CAT, s.cat);
    tot += s.importo; perCat[c] = (perCat[c] || 0) + s.importo; b[s.chi] = (b[s.chi] ?? 0) + s.importo; pagato[s.chi] = (pagato[s.chi] ?? 0) + s.importo;
    parti.forEach(p => { b[p] = (b[p] ?? 0) - s.importo / parti.length; });
  });
  const cre = [], deb = [];
  Object.entries(b).forEach(([p, v]) => { v = Math.round(v * 100) / 100; if (v > 0.004) cre.push([p, v]); else if (v < -0.004) deb.push([p, -v]); });
  cre.sort((x, y) => y[1] - x[1]); deb.sort((x, y) => y[1] - x[1]);
  const pag = [];
  while (cre.length && deb.length) {
    const m = Math.min(cre[0][1], deb[0][1]);
    pag.push([deb[0][0], cre[0][0], m]); cre[0][1] -= m; deb[0][1] -= m;
    if (cre[0][1] < 0.005) cre.shift(); if (deb[0][1] < 0.005) deb.shift();
  }
  return { tot, pag, pagato, perCat };
}
const inEur = n => (S.cambio > 0 ? ` (circa ${eur(n * S.cambio)})` : "");
function formSpesa(x = {}) {
  const ps = gruppo(), mod = !!x.id, tra = x.tra && x.tra.length ? x.tra : ps;
  return `<form class="f" data-form="spesa"><input type="hidden" name="id" value="${esc(x.id || "")}">
    <label class="mute" for="s-desc">Descrizione</label><input type="text" id="s-desc" name="desc" required maxlength="80" value="${esc(x.desc || "")}">
    <label class="mute" for="s-importo">Importo in sterline</label><input type="number" id="s-importo" name="importo" step="0.01" min="0.01" inputmode="decimal" required value="${esc(String(x.importo ?? ""))}">
    <label class="mute" for="s-cat">Categoria</label><select id="s-cat" name="cat">${SPESE_CAT.map(([k, l]) => `<option value="${k}"${catOk(SPESE_CAT, x.cat) === k ? " selected" : ""}>${l}</option>`).join("")}</select>
    <label class="mute" for="s-chi">Pagato da</label><select id="s-chi" name="chi" required><option value="">Scegli chi ha pagato</option>${ps.map(p => `<option${p === (x.chi || S.me) ? " selected" : ""}>${esc(p)}</option>`).join("")}</select>
    <fieldset class="chk"><legend>Diviso tra</legend>${ps.map(p => `<label><input type="checkbox" name="tra" value="${esc(p)}"${tra.includes(p) ? " checked" : ""}>${esc(p)}</label>`).join("")}</fieldset>
    <div class="riga"><button class="btn pri" type="submit">${mod ? "Salva modifica" : "Aggiungi spesa"}</button>${mod ? `<button type="button" class="btn" data-az="annulla">Annulla</button>` : ""}</div></form>`;
}
function vistaSpese() {
  const { tot, pag, pagato, perCat } = saldi(), ps = gruppo(), maxP = Math.max(1, ...Object.values(pagato)), maxC = Math.max(1, ...Object.values(perCat));
  const lista = vivi(S.spese).sort((a, b) => b.ts - a.ts).map(s => `<div class="scheda"><div class="nome">${esc(s.desc)}, ${gbp(s.importo)}</div>
    <div class="desc"><span class="cat">${catNome(SPESE_CAT, catOk(SPESE_CAT, s.cat))}</span> Pagato da ${esc(s.chi)}, diviso tra ${s.tra && s.tra.length ? esc(s.tra.join(", ")) : "tutti"}${inEur(s.importo)}</div>
    <div class="riga"><button class="btn" data-az="modSpesa" data-v="${esc(s.id)}">Modifica<span class="vh"> ${esc(s.desc)}</span></button><button class="btn tondo rosso" data-az="delSpesa" data-v="${esc(s.id)}" aria-label="Elimina ${esc(s.desc)}">${ic("x", 18)}</button></div></div>`).join("");
  const ed = edit && edit.k === "spese" ? S.spese.find(x => x.id === edit.id && !x.del) : null;
  const noti = new Set(ps), ignoti = [...new Set(vivi(S.spese).flatMap(s => [s.chi, ...(s.tra || [])]).filter(p => p && !noti.has(p)))];
  return `<h1 class="vt">${tot > 0 ? `${gbp(tot)} spesi` : "Spese"}</h1>${avviso()}
    ${ignoti.length ? `<div class="msg avv">Alcune spese hanno nomi non presenti nel gruppo (${esc(ignoti.join(", "))}). Modificale per correggere i saldi.</div>` : ""}
    <div class="scheda">${S.cambio > 0 ? `<div class="mute">In totale circa ${eur(tot * S.cambio)}</div>` : ""}
      ${tot > 0 ? `<h2 class="h-sez" style="font-size:1rem;margin:16px 0 4px">Chi ha pagato</h2>${ps.map(p => `<div class="pers"><span>${esc(p)}</span><span class="b"><i style="width:${Math.round((pagato[p] || 0) / maxP * 100)}%"></i></span><span class="num">${gbp(pagato[p] || 0)}</span></div>`).join("")}
      <h2 class="h-sez" style="font-size:1rem;margin:16px 0 4px">Per categoria</h2>${SPESE_CAT.filter(([k]) => perCat[k]).map(([k, l]) => `<div class="pers"><span>${l}</span><span class="b"><i style="width:${Math.round(perCat[k] / maxC * 100)}%"></i></span><span class="num">${gbp(perCat[k])}</span></div>`).join("")}` : ""}
      <h2 class="h-sez" style="font-size:1rem;margin:16px 0 4px">Chi deve cosa</h2>
      ${pag.length ? `<ul class="lista">${pag.map(([da, a, m]) => `<li><b>${esc(da)}</b> deve ${gbp(m)}${inEur(m)} a <b>${esc(a)}</b></li>`).join("")}</ul>` : `<div class="mute">Nessun saldo da pareggiare.</div>`}
      <div class="riga"><button class="btn" data-az="copiaSpese">${ic("copy", 18)}Copia il riepilogo</button></div></div>
    <details class="scheda nuova"${ed ? " open" : ""}><summary>Nuova spesa</summary>${formSpesa(ed || {})}</details>
    ${lista || `<div class="vuoto">Ancora nessuna spesa.</div>`}`;
}

/* altro */
function vistaAltro() {
  const seg = [["scambio", "Scambio"], ["valigia", "Valigia"], ["cambio", "Cambio"], ["frasi", "Frasi"], ["sondaggio", "Sondaggio"], ["sistema", "Sistema"]]
    .map(([v, l]) => `<button class="chip" data-az="sub" data-v="${v}" aria-pressed="${sub === v}">${l}</button>`).join("");
  const corpo = { scambio: vistaScambio, valigia: vistaValigia, cambio: vistaCambio, frasi: vistaFrasi, sondaggio: () => (typeof Sond !== "undefined" ? Sond.vista() : ""), sistema: vistaSistema }[sub]();
  return `<h1 class="vt">${{ scambio: "Scambio dati", valigia: "Valigia", cambio: "Cambio", frasi: "Frasi utili", sondaggio: "Sondaggio collaborativo", sistema: "Sistema" }[sub]}</h1>${avviso()}<div class="chips avvolgi" role="group" aria-label="Sezione di Altro">${seg}</div><div class="pila">${corpo}</div>`;
}
function vistaValigia() {
  const ps = persone(), gg = TRIP.giorni.length, nn = gg - 1;
  if (!ps.includes(S.valP)) S.valP = "";
  const chips = ps.map(p => `<button class="chip" data-az="valP" data-v="${esc(p)}" aria-pressed="${p === S.valP}">${esc(p)}</button>`).join("");
  const testa = `<div class="scheda"><div class="nome">Valigia per ${gg} giorni e ${nn} notti</div>
    <div class="desc">A dicembre a Londra di solito fa freddo e piove: vestiti a strati. Bagaglio a mano 40x30x20, quindi le cose più ingombranti si indossano in aereo.</div>
    <div class="chips avvolgi" role="group" aria-label="Chi sei" style="margin-top:10px">${chips}</div></div>`;
  if (!S.valP) return testa + `<div class="vuoto">Scegli il tuo nome per vedere la tua lista.</div>`;
  const pr = profiloDi(S.valP);
  if (!pr) return testa + `<div class="scheda"><div class="nome">Che lista vuoi?</div><div class="riga">${["uomo", "donna"].map(k => `<button class="btn pri" data-az="profilo" data-v="${k}">${TRIP.profili[k]}</button>`).join("")}</div></div>`;
  const mia = (S.val[S.valP] = S.val[S.valP] && typeof S.val[S.valP] === "object" ? S.val[S.valP] : {}), voci = vociDi(S.valP), fatte = voci.filter(v => mia[v.id]).length;
  const cat = [...new Set(voci.map(v => v.cat))].map(c => `<h2 class="h-sez">${esc(c)}</h2><div class="scheda">${voci.filter(v => v.cat === c).map(v => {
    const q = v.q ? v.q(gg, nn) : 0, d = testoD(v.d, gg, nn);
    return `<label class="c${mia[v.id] ? " fatto" : ""}"><input type="checkbox" data-chg="spuntaV" data-v="${v.id}"${mia[v.id] ? " checked" : ""}><span><b>${q > 1 ? `${q} × ` : ""}${esc(v.t)}</b>${d ? `<br><small class="mute">${esc(d)}</small>` : ""}</span></label>`;
  }).join("")}</div>`).join("");
  return `${testa}<div class="scheda"><div class="nome">${esc(S.valP)}, lista ${(TRIP.profili[pr] || "").toLowerCase()}</div><div class="desc">${fatte} su ${voci.length} cose preparate</div>
    <progress max="${voci.length}" value="${fatte}" aria-label="Avanzamento valigia"></progress>
    <div class="riga">${pr !== "bambina" ? `<button class="btn" data-az="profilo" data-v="">Cambia lista</button>` : ""}<button class="btn rosso" data-az="azzeraV">Azzera le spunte</button></div></div>${cat}`;
}
const quando = ms => new Date(ms).toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
function vistaCambio() {
  const c = S.cambio, ok = c > 0;
  return `<div class="scheda"><div class="nome">Cambio sterline ed euro</div>
    <div class="desc">Funziona anche senza rete: usa l'ultimo cambio salvato nel telefono. Quello della carta o dei cambiavalute può essere diverso.</div>
    <div class="f" style="margin-top:10px"><label class="mute" for="c-gbp">Sterline (£)</label><input type="number" id="c-gbp" data-conv="gbp" inputmode="decimal" step="0.01" min="0" placeholder="0,00"${ok ? "" : " disabled"}>
    <label class="mute" for="c-eur">Euro (€)</label><input type="number" id="c-eur" data-conv="eur" inputmode="decimal" step="0.01" min="0" placeholder="0,00"${ok ? "" : " disabled"}></div>
    ${ok ? "" : `<div class="mute piccolo">Imposta il cambio qui sotto oppure aggiornalo online.</div>`}</div>
    <div class="scheda"><label class="mute" for="cambio">Cambio: 1 sterlina vale quanti euro?</label>
    <input type="number" id="cambio" data-chg="cambio" step="0.0001" min="0" inputmode="decimal" placeholder="Es. 1,19" value="${ok ? c : ""}">
    <div class="desc">${S.cambioQ ? `Ultimo aggiornamento online: ${esc(quando(S.cambioQ))}${S.cambioData ? `, dati del ${esc(S.cambioData)}` : ""}.` : ok ? "Inserito a mano." : "Non ancora impostato."}</div>
    <div class="riga"><button class="btn pri" data-az="cambioOnline">Aggiorna il cambio (serve rete)</button></div></div>
    ${ok ? `<div class="scheda"><div class="nome">Tabella rapida</div><div class="tabella">
    <div><b>Sterline</b>${[1, 5, 10, 20, 50, 100].map(x => `<div class="num">£${x} = ${eur(x * c)}</div>`).join("")}</div>
    <div><b>Euro</b>${[10, 20, 50, 100].map(x => `<div class="num">€${x} = ${gbp(x / c)}</div>`).join("")}</div></div></div>` : ""}`;
}
const vistaFrasi = () => `<div class="scheda">${TRIP.frasi.map(([it, en]) => `<div class="frase"><div class="mute">${esc(it)}</div><div class="nome" lang="en-GB">${esc(en)}</div></div>`).join("")}</div>
  <h2 class="h-sez">Numeri utili nel Regno Unito</h2><div class="scheda">${TRIP.emergenze.map(e => `<div class="frase"><a class="map" href="tel:${e.n}">${ic("phone", 18)}Chiama ${e.n}</a><div class="desc">${esc(e.t)}</div></div>`).join("")}</div>
  <p class="mute">Ambasciata e consolato d'Italia: cerca i recapiti aggiornati su dovesiamonelmondo.esteri.it.</p>`;
function vistaScambio() {
  const ps = gruppo();
  return `<div class="scheda"><div class="nome">Chi sei?</div><select data-chg="me" aria-label="Chi sei"><option value="">Scegli il tuo nome</option>${ps.map(p => `<option${p === S.me ? " selected" : ""}>${esc(p)}</option>`).join("")}</select></div>
    <div class="scheda"><div class="nome">Sincronizzazione automatica</div><div class="desc" id="sync-stato">${esc(SyncX.testo())}</div>
    ${SyncX.acceso()
      ? `<div class="desc">Idee, voti e spese di tutti i telefoni si aggiornano da soli quando apri l'app, e ogni 25 secondi finché è aperta.</div><div class="riga"><button class="btn" data-az="syncOra">Sincronizza ora</button></div>
         <div class="desc" style="margin-top:12px"><b>Attivare un altro telefono:</b> invia questo link, basta toccarlo.</div><div class="riga"><button class="btn pri" data-az="invita">Invia il link su WhatsApp</button><button class="btn" data-az="copiaInvito">${ic("copy", 18)}Copia il link</button></div>`
      : `<div class="desc"><b>Come attivarla:</b> tocca il link di attivazione ricevuto su WhatsApp. Se non si apre nell'app, copialo e incollalo qui sotto in «Ricevi», poi premi «Importa il testo». In alternativa importa il file dei dati riservati.</div>`}</div>
    <div class="scheda"><div class="nome">Invia le tue idee, i voti e le spese</div><div class="desc">Il modo più semplice: manda il messaggio su WhatsApp. Chi lo riceve lo incolla qui sotto.</div>
    <div class="riga"><button class="btn pri" data-az="whatsapp">Invia su WhatsApp</button><button class="btn" data-az="copiaCodice">${ic("copy", 18)}Copia il testo</button></div>
    <div class="desc" style="margin-top:10px">In alternativa un file:</div><div class="riga"><button class="btn" data-az="condividi">Condividi il file</button><button class="btn" data-az="scarica">Scarica</button></div></div>
    <div class="scheda"><div class="nome">Ricevi idee, voti e spese</div><div class="desc">Incolla il messaggio ricevuto, oppure scegli un file. Si uniscono senza duplicati. Vale anche per i dati riservati.</div>
    <label class="mute" for="incolla" style="margin-top:10px">Messaggio ricevuto</label><textarea id="incolla" rows="3" placeholder="Incolla qui il messaggio"></textarea>
    <div class="riga"><button class="btn pri" data-az="importaTesto">Importa il testo</button></div>
    <div class="riga"><input type="file" id="file" accept="application/json,.json" multiple data-chg="importa" aria-label="Scegli un file da importare"></div></div>
    <div class="scheda"><div class="nome">Dati riservati</div><div class="desc">${S.riserv && (S.riserv.voli || S.riserv.idalia || S.riserv.alloggio) ? "Importati: codici e nomi sono visibili in Viaggio, Prenotazioni." : S.riserv ? "Non importati: è attiva solo la sincronizzazione. Codici e nomi arrivano col file riservato." : "Non importati."}</div>
    ${S.riserv ? `<div class="riga"><button class="btn rosso" data-az="togliRiserv">Rimuovi dal telefono</button></div>` : ""}</div>`;
}
function vistaSistema() {
  return `<div class="scheda"><div class="nome">Uso senza rete</div><div class="desc" id="stato-offline">Controllo in corso.</div><div class="mute piccolo" id="ver-app"></div></div>
    <div class="scheda"><div class="nome">Backup completo</div><div class="desc">Salva tutto ciò che è su questo telefono: idee, voti, spese, note, valigia e cambio. I dati riservati non sono inclusi.</div>
    <div class="riga"><button class="btn pri" data-az="backup">Esporta il backup</button></div>
    <div class="riga"><input type="file" id="ripristino" accept="application/json,.json" data-chg="ripristina" aria-label="Scegli un backup da ripristinare"></div></div>
    <div class="scheda"><div class="nome">Movimento e neve</div><div class="desc">${riduci.matches ? "Questo telefono chiede di ridurre le animazioni (su Android: Impostazioni, Accessibilità, «Rimuovi animazioni»; il nome cambia da marca a marca). In Automatico l'app resta ferma. Scegli «Sempre attivo» per vedere comunque transizioni, neve, luci e popup." : "Transizioni, neve, luci e popup. In Automatico seguono le impostazioni del telefono."}</div>
    <div class="chips avvolgi" role="group" aria-label="Movimento">${[["auto", "Automatico"], ["on", "Sempre attivo"], ["off", "Spento"]].map(([v, l]) => `<button class="chip" data-az="mov" data-v="${v}" aria-pressed="${S.mov === v}">${l}</button>`).join("")}</div>
    <div class="desc" style="margin-top:8px">Adesso il movimento è ${movOff() ? "spento" : "attivo"}.</div></div>
    <div class="scheda"><div class="nome">Versione 4</div><div class="desc">Unisce le funzioni della versione 2 e della 3 con la nuova grafica. ${S.migratoDa ? "I dati della versione precedente sono stati copiati qui al primo avvio, che restano com'erano nell'altra: da ora le versioni non si aggiornano a vicenda." : "Questa versione tiene i suoi dati per conto proprio."}</div></div>
    <p class="mute piccolo">Idee e spese: ${vivi(S.idee).length} e ${vivi(S.spese).length}, salvate solo su questo telefono.</p>`;
}

/* ---------- scintille d'oro ---------- */
let ultimoTocco = [innerWidth / 2, innerHeight / 2];
document.addEventListener("pointerdown", e => {
  ultimoTocco = [e.clientX, e.clientY];
  if (e.target.closest && e.target.closest(".btn.pri:not(:disabled), a.map.pri")) scintille(e.clientX, e.clientY, 7);
}, { passive: true });
let fxAttivo = false; const particelle = [];
function scintille(x, y, n = 14) {
  const c = document.querySelector("dialog[open] .fxd") || $("#fx"); if (!c || calmo()) return;
  const R = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2), W = Math.round(R.width * dpr), H = Math.round(R.height * dpr);
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  const colori = ["#f6d77a", "#e2bf6a", "#f4ecd8", "#c9a24b"];
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 4.2; particelle.push({ c, x: x - R.left, y: y - R.top, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, r: 2 + Math.random() * 3.2, rot: Math.random() * 3, vr: (Math.random() - .5) * .3, vita: 1, col: colori[(Math.random() * 4) | 0] }); }
  if (fxAttivo) return; fxAttivo = true; let prec = performance.now();
  (function giro(t) {
    try {
      const k = Math.min(3, (t - prec) / 16.7 || 1); prec = t;
      const canvase = new Set(particelle.map(q => q.c)); canvase.forEach(cv => { const cx = cv.getContext("2d"); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); });
      for (let i = particelle.length - 1; i >= 0; i--) {
        const q = particelle[i]; q.vy += .16 * k; q.x += q.vx * k; q.y += q.vy * k; q.vx *= Math.pow(.985, k); q.rot += q.vr * k; q.vita -= .018 * k;
        if (q.vita <= 0) { particelle.splice(i, 1); continue; }
        const cx = q.c.getContext("2d"); cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.save(); cx.globalAlpha = Math.max(0, q.vita); cx.translate(q.x, q.y); cx.rotate(q.rot); cx.fillStyle = q.col;
        cx.beginPath(); cx.moveTo(0, -q.r * 1.6); cx.lineTo(q.r * .5, 0); cx.lineTo(0, q.r * 1.6); cx.lineTo(-q.r * .5, 0); cx.closePath(); cx.fill();
        cx.rotate(1.5708); cx.beginPath(); cx.moveTo(0, -q.r * 1.1); cx.lineTo(q.r * .4, 0); cx.lineTo(0, q.r * 1.1); cx.lineTo(-q.r * .4, 0); cx.closePath(); cx.fill(); cx.restore();
      }
    } finally {
      if (particelle.length) requestAnimationFrame(giro); else { fxAttivo = false; document.querySelectorAll("#fx, .fxd").forEach(cv => { cv.width = 0; cv.height = 0; }); }
    }
  })(prec);
}
/* ---------- finestre di saluto (dialog) ---------- */
function popup({ titolo, testo, azione, etichetta, festa, apertura }) {
  const d = $("#popup"); if (!d || d.open || !d.showModal) return false;
  $("#popup-luci").innerHTML = luci(false); $("#popup-titolo").textContent = titolo; $("#popup-testo").textContent = testo;
  $("#popup-azioni").innerHTML = (azione ? `<button class="btn pri" id="popup-ok" type="button">${esc(etichetta || "Apri")}</button>` : "") + `<button class="btn" id="popup-chiudi" type="button">Chiudi</button>`;
  d.dataset.festa = festa ? "1" : ""; d.showModal(); if (apertura) apertura();
  if (festa) setTimeout(() => scintille(innerWidth / 2, innerHeight * .34, 40), 280);
  $("#popup-chiudi").onclick = () => chiudiPopup(); const ok = $("#popup-ok"); if (ok) ok.onclick = () => chiudiPopup(azione);
  return true;
}
function chiudiPopup(dopo) {
  const d = $("#popup"); if (!d || !d.open) { if (dopo) dopo(); return; }
  const fine = () => { d.classList.remove("esce"); d.close(); if (dopo) dopo(); };
  if (calmo()) fine(); else { d.classList.add("esce"); setTimeout(fine, 160); }
}
$("#popup").addEventListener("click", e => { if (e.target === e.currentTarget && e.offsetX >= 0) chiudiPopup(); });
function valigiaPronta() {
  if (!S.valP || S.valigiaOk[S.valP]) return; const v = statoValigia(S.valP);
  if (v.tot > 0 && v.fatte === v.tot) { S.valigiaOk[S.valP] = true; salva(); popup({ titolo: "Valigia pronta", testo: `${S.valP}: tutte le ${v.tot} cose sono nella valigia.`, festa: true }); }
}
const SALUTI = { "2026-12-23": "Si parte", "2026-12-24": "Vigilia di Natale", "2026-12-25": "Buon Natale", "2026-12-26": "Santo Stefano", "2026-12-27": "Ultimo giorno" };
function testoPartenza() {
  const p = new Date(TRIP.partenza);
  return `Si parte ${p.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })} alle ${p.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} da Venezia.`;
}
function saluti() {
  if (edit || bozza || document.querySelector("dialog[open]")) return;
  const n = new Date(), iso = oggiIso(n), i = TRIP.giorni.findIndex(d => d.iso === iso);
  if (i >= 0) {
    if (S.salutoGiorno === iso) return;
    const d = TRIP.giorni[i], st = statoOggi(), t = d.tappe.find(x => orario(x.ora) != null) || d.tappe[0], nx = st && st.next >= 0 ? d.tappe[st.next] : null;
    const frase = st && st.cur >= 0 ? (nx ? `Prossima tappa alle ${String(nx.ora).replace("~", "")}: ${nx.nome}` : `Oggi: ${d.titolo}`) : orario(t.ora) != null ? `Si comincia alle ${String(t.ora).replace("~", "")}: ${t.nome}` : `Si comincia con: ${t.nome}`;
    popup({ titolo: SALUTI[iso] || `Giorno ${i + 1}`, testo: `${d.titolo}. ${frase}.`, etichetta: "Apri il giorno", festa: iso === "2026-12-24" || iso === "2026-12-25", apertura: () => { S.salutoGiorno = iso; salva(); }, azione: () => { g = i; vsub = "itin"; azioni.tab("viaggio"); } });
    return;
  }
  const partenza = new Date(TRIP.partenza); if (n >= partenza) return;
  const mezz = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), gg = Math.round((mezz(partenza) - mezz(n)) / 864e5);
  if (![7, 3, 1].includes(gg) || S.contoVisto[gg]) return;
  const dv = daVotare(), vs = S.valP ? statoValigia(S.valP) : null;
  popup({ titolo: gg === 1 ? "Si parte domani" : `Mancano ${gg} giorni`, testo: testoPartenza() + (vs && vs.tot ? ` Valigia di ${S.valP}: ${vs.fatte} su ${vs.tot}.` : "") + (dv ? ` Idee da votare: ${dv}.` : ""), etichetta: dv ? "Vota le idee" : "Apri la valigia", festa: gg === 1,
    apertura: () => { S.contoVisto[gg] = true; salva(); }, azione: () => { if (dv) { filtroS = "mie"; azioni.tab("idee"); } else { sub = "valigia"; azioni.tab("altro"); } } });
}

/* ---------- barra, rendering, focus ---------- */
const DOCK = [["oggi", "Oggi", "home"], ["viaggio", "Viaggio", "compass"], ["idee", "Idee", "bulb"], ["spese", "Spese", "wallet"], ["altro", "Altro", "grid"]];
$("#dock").innerHTML = '<i class="ind" aria-hidden="true"></i>' + DOCK.map(([id, l, i]) => `<button data-az="tab" data-v="${id}" data-t="${id}">${ic(i, 22)}<span>${l}</span>${id === "idee" ? `<b id="badge-idee" class="badge" hidden aria-hidden="true"></b>` : ""}</button>`).join("");
const viste = { oggi: vistaOggi, viaggio: vistaViaggio, idee: vistaIdee, spese: vistaSpese, altro: vistaAltro };
const di = t => { const r = $("#annuncio"); if (!r) return; r.textContent = ""; setTimeout(() => { r.textContent = t; }, 60); };
let annunciato = "";
const annunciaGiorno = () => di(`${TRIP.giorni[g].data}: ${TRIP.giorni[g].titolo}`);
function focaTitolo() { const h = $("#vista h2, #vista h1"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
const q = v => String(v).replace(/["\\]/g, "\\$&");
function selFoco(a) {
  if (!a || a === document.body) return null;
  if (a.id) return "#" + CSS.escape(a.id);
  const d = a.dataset, k = d && d.az ? "az" : d && d.chg ? "chg" : null; if (!k) return null;
  return `[data-${k}="${q(d[k])}"]` + (d.v === undefined ? ":not([data-v])" : `[data-v="${q(d.v)}"]`);
}
function render(foco) {
  $("#vista").classList.remove("stag");
  const sel = selFoco(document.activeElement);
  try { $("#vista").innerHTML = viste[tab](); } catch {
    $("#vista").innerHTML = `<div class="scheda"><h2>Dati non leggibili</h2><div class="desc">Qualcosa nei dati salvati su questo telefono blocca la pagina.</div><div class="riga"><button class="btn rosso" data-az="reset">Azzera i dati locali</button></div></div>`;
  }
  const bersaglio = foco || sel;
  if (bersaglio) { try { const el = $(bersaglio); if (el) el.focus({ preventScroll: true }); } catch { /* selettore non valido */ } }
  document.title = (tab === "oggi" ? "" : DOCK.find(d => d[0] === tab)[1] + " - ") + "Londra in tasca";
  document.querySelectorAll("#dock button").forEach(b => { if (b.dataset.t === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  const dv = daVotare(), bd = $("#badge-idee"), bt = $('#dock [data-t="idee"]');
  if (bd) { bd.hidden = !dv; bd.textContent = dv; }
  if (bt) { if (dv) bt.setAttribute("aria-label", `Idee, ${dv} da votare`); else bt.removeAttribute("aria-label"); }
  if (msg && msg !== annunciato) { annunciato = msg; di(msg); } else if (!msg) annunciato = "";
  const ind = $("#dock .ind"); if (ind) ind.style.transform = `translateX(${Math.max(0, ORD_TAB.indexOf(tab)) * 100}%)`;
  aggiornaAdesso();
  if (tab === "viaggio" && vsub === "itin") osservaGuida();
  if (tab === "altro" && sub === "sistema") statoOffline();
  if (typeof Sond !== "undefined") { if (tab === "altro" && sub === "sondaggio") Sond.ripresa(); else Sond.fuori(); }
}
async function statoOffline() {
  const el = $("#stato-offline"); if (!el) return;
  try {
    if (!("caches" in window) || !navigator.serviceWorker) throw new Error("no");
    const chiavi = (await caches.keys()).filter(k => k.startsWith("lit-"));
    const n = chiavi.length ? (await (await caches.open(chiavi[0])).keys()).length : 0;
    const ver = $("#ver-app"); if (ver && chiavi.length) ver.textContent = "Versione dell'app su questo telefono: " + Math.max(...chiavi.map(k => +k.slice(4) || 0)) + ". Se è più bassa dell'ultima annunciata, apri l'app con la rete attiva e tocca «App aggiornata».";
    el.textContent = n >= 5 ? `Pronta: ${n} file salvati nel telefono, l'app si apre anche senza rete.` : "Non ancora pronta: apri l'app una volta con la rete attiva.";
  } catch { el.textContent = "Questo browser non salva l'app per l'uso senza rete."; }
}

/* ---------- scambio dati (formato identico alla v2) ---------- */
const tsOk = v => { const n = +v; return Number.isFinite(n) ? Math.min(Math.max(n, 0), Date.now() + 3e5) : 0; };
const nuovoTs = prev => Math.max(Date.now(), (+prev || 0) + 1);
const primo = x => String(x || "").split(" ")[0];
const str = (v, n) => String(v ?? "").slice(0, n);
const nomi = a => (Array.isArray(a) ? a.filter(nomeOk).slice(0, 12) : []);
const unisciVoti = (a, b) => {
  const o = {};
  for (const src of [a, b]) for (const n of Object.keys(src || {})) {
    if (!nomeOk(n)) continue;
    const v = src[n]; if (!Array.isArray(v)) continue;
    const w = [[1, 2, 3].includes(v[0]) ? v[0] : 0, tsOk(v[1])];
    if (!Object.prototype.hasOwnProperty.call(o, n) || w[1] > o[n][1]) o[n] = w;
  }
  return o;
};
function unisci(k, x) {
  if (!x || typeof x.id !== "string" || !ID_OK.test(x.id)) return false;
  const y = { id: x.id, ts: tsOk(x.ts), del: x.del === true };
  if (k === "spese") {
    const imp = Number(x.importo); if (!Number.isFinite(imp) || imp <= 0 || imp > 1e6 || !nomeOk(x.chi)) return false;
    Object.assign(y, { desc: str(x.desc, 80), importo: imp, chi: nomeOk(x.chi) ? x.chi : "", tra: nomi(x.tra), cat: catOk(SPESE_CAT, x.cat) });
  } else {
    Object.assign(y, { testo: str(x.testo, 200), link: normLink(x.link), nota: str(x.nota, 200), giorno: [0, 1, 2, 3, 4, 5].includes(+x.giorno) ? +x.giorno : 0, cat: catOk(IDEE_CAT, x.cat),
      stato: [0, 1, 2, 3].includes(+x.stato) ? +x.stato : 0, autore: nomeOk(x.autore) ? x.autore : "", chiusoDa: nomeOk(x.chiusoDa) ? x.chiusoDa : "", voti: unisciVoti({}, x.voti) });
  }
  const i = S[k].findIndex(z => z.id === y.id);
  if (i < 0) { S[k].push(y); return true; }
  const l = S[k][i];
  if (y.ts > (l.ts || 0)) { if (k === "idee") y.voti = unisciVoti(l.voti, y.voti); S[k][i] = y; return true; }
  if (k === "idee") { const v = unisciVoti(l.voti, y.voti); if (JSON.stringify(v) !== JSON.stringify(l.voti || {})) { l.voti = v; return true; } }
  return false;
}
const aB64u = t => aB64(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const daB64u = t => daB64(t.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - t.length % 4) % 4));
const linkAttiva = () => { const c = S.riserv && S.riserv.sync; return c ? location.origin + location.pathname.replace(/[^/]*$/, "") + "#attiva=" + aB64u(JSON.stringify({ u: c.url, c: c.codice })) : ""; };
/* attiva la sincronizzazione da un link ricevuto su WhatsApp (o incollato): niente file da importare */
function attivaToken(tok) {
  let c = null;
  try { const j = JSON.parse(daB64u(tok)); c = pulisciRiserv({ sync: { url: j.u, codice: j.c } }).sync || null; } catch { c = null; }
  if (!c) { dire("Il link di attivazione non è valido o è tagliato: chiedi di inviartelo di nuovo.", "avv"); return false; }
  const att = S.riserv && S.riserv.sync;
  if (att && (att.url !== c.url || att.codice !== c.codice) && !confirm("Questo telefono usa già un'altra sincronizzazione. Sostituirla?")) return false;
  S.riserv = Object.assign(S.riserv || { riservati: true }, { sync: c }); salva();
  dire("Sincronizzazione attivata. Scegli il tuo nome in «Chi sei?»: da ora idee e voti arrivano da soli."); tab = "idee";
  SyncX.start(); return true;
}
function attivaDaLink() {
  const m = /^#attiva=([A-Za-z0-9_-]+)$/.exec(location.hash); if (!m) return false;
  try { history.replaceState(null, "", location.pathname + location.search); } catch { /* ok */ }
  attivaToken(m[1]); return true;
}
function pulisciRiserv(j) {
  const s = (v, n = 60) => (typeof v === "string" ? v.slice(0, n) : ""), o = { riservati: true }, gr = nomi(j.gruppo);
  if (gr.length) o.gruppo = gr;
  if (typeof j.bambina === "string") o.bambina = s(j.bambina);
  if (j.voli && typeof j.voli === "object") o.voli = { andata: s(j.voli.andata, 20), ritorno: s(j.voli.ritorno, 20) };
  if (j.idalia && typeof j.idalia === "object") o.idalia = { conferma: s(j.idalia.conferma, 20), nome: s(j.idalia.nome) };
  if (j.alloggio && typeof j.alloggio === "object") o.alloggio = { indirizzo: s(j.alloggio.indirizzo, 120) };
  if (j.sync && typeof j.sync === "object" && /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(firebasedatabase\.app|firebaseio\.com)$/.test(j.sync.url || "") && /^[A-Za-z0-9_-]{16,64}$/.test(j.sync.codice || "")) o.sync = { url: j.sync.url, codice: j.sync.codice };
  return o;
}
function ripristina(j) {
  const d = j && j.dati; if (!d || typeof d !== "object") return false;
  try { localStorage.setItem("lit4-prima-ripristino", JSON.stringify(S)); } catch { /* ok */ }
  const n = vuoto(); n.riserv = S.riserv; n.migratoDa = S.migratoDa; n.mov = ["auto", "on", "off"].includes(d.mov) ? d.mov : (d.neve === false ? "off" : "auto");
  n.me = gruppo().includes(S.me) ? S.me : ""; n.valP = nomeOk(d.valP) ? d.valP : "";
  for (const k of ["fatti", "note", "val", "profili", "finestre", "contoVisto", "valigiaOk"]) n[k] = d[k];
  n.salutoGiorno = typeof d.salutoGiorno === "string" ? d.salutoGiorno : "";
  pulisciMappe(n);
  n.cambio = Number(d.cambio) > 0 ? Number(d.cambio) : 0; n.cambioQ = tsOk(d.cambioQ); n.cambioData = str(d.cambioData, 10);
  S = n; applicaMov(); for (const k of ["idee", "spese"]) for (const x of (Array.isArray(d[k]) ? d[k] : [])) unisci(k, x);
  return true;
}
function rimappaMe() { if (S.me && !gruppo().includes(S.me)) { const t = gruppo().find(p => primo(p) === primo(S.me)); S.me = t || ""; } }
function applica(j, n, consentiBackup) {
  if (j && j.riservati) {
    if (S.riserv && !confirm("Esistono già dati riservati su questo telefono. Sostituirli con quelli del file?")) return true;
    S.riserv = pulisciRiserv(j); n.riserv = true; rimappaMe(); return true;
  }
  if (j && j.lit3backup) { if (!consentiBackup) { n.nota = "Questo è un backup: usa Altro, Sistema, Ripristina."; return false; } n.backup = ripristina(j); return n.backup; }
  if (!j || j.app !== "londra-in-tasca") return false;
  for (const k of ["idee", "spese"]) for (const x of (j[k] || [])) if (unisci(k, x)) n[k]++;
  return true;
}
function esito(n, err) {
  salva();
  dire(n.backup ? "Backup ripristinato. La copia dei dati precedenti è rimasta in memoria." : `Importato: ${n.idee} idee, ${n.spese} spese${n.riserv ? ", dati riservati" : ""}${err ? `. Non validi: ${err}${n.nota ? `. ${n.nota}` : ""}` : ""}.`, err ? "avv" : "");
  render(); avvisaVoti();
  if (n.riserv) SyncX.start();
}
async function importaFile(files, consentiBackup) {
  const n = { idee: 0, spese: 0, riserv: false, backup: false }; let err = 0;
  for (const f of files) { try { if (!applica(JSON.parse(await f.text()), n, consentiBackup)) err++; } catch { err++; } }
  esito(n, err);
}
function importaTesto(t) {
  const n = { idee: 0, spese: 0, riserv: false, backup: false }; let err = 0;
  const a = /#attiva=([A-Za-z0-9_-]+)/.exec(t);
  if (a) { attivaToken(a[1]); salva(); render(); return; }
  const b = /LIT3B:([A-Za-z0-9+/=]+)/.exec(t), m = /LIT1:([A-Za-z0-9+/=]+)/.exec(t);
  try {
    if (b) { if (confirm("Il backup sostituisce idee, spese, note e valigia di questo telefono. Continuare?")) { if (!applica(JSON.parse(daB64(b[1])), n, true)) err++; } else return; }
    else if (!applica(JSON.parse(m ? daB64(m[1]) : t), n)) err++;
  } catch { err++; }
  esito(n, err);
}
const recente = x => !x.del || x.ts > Date.now() - 30 * 864e5;
const pacchetto = () => ({ app: "londra-in-tasca", v: 3, autore: S.me, esportato: Date.now(), idee: S.idee.filter(recente), spese: S.spese.filter(recente) });
const aB64 = s => { let r = ""; new TextEncoder().encode(s).forEach(x => { r += String.fromCharCode(x); }); return btoa(r); };
const daB64 = s => new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
const messaggio = () => `Londra in tasca: le mie idee, voti e spese. Incollalo in Altro, Scambio.\nLIT1:${aB64(JSON.stringify(pacchetto()))}`;
function nomeFile(prefisso) {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${prefisso}-${(S.me || "anon").replace(/[^\w-]/g, "")}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
}
const fileDati = () => new File([JSON.stringify(pacchetto(), null, 1)], nomeFile("londra"), { type: "application/json" });
function scaricaFile(f) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function copia(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    const a = document.createElement("textarea"); a.value = t; a.readOnly = true; a.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.append(a);
    a.select(); a.setSelectionRange(0, 1e7); let ok = false; try { ok = document.execCommand("copy"); } catch { /* non disponibile */ } a.remove(); return ok;
  }
}
function riepilogoSpese() {
  const { tot, pag } = saldi();
  return [`Spese del viaggio a Londra`, `Totale: ${gbp(tot)}${inEur(tot)}`, ...vivi(S.spese).map(s => `- ${s.desc}: ${gbp(s.importo)}, pagato da ${s.chi}`), pag.length ? "Saldi:" : "Nessun saldo da pareggiare.", ...pag.map(([da, a, m]) => `- ${da} deve ${gbp(m)}${inEur(m)} a ${a}`)].join("\n");
}
let toastT;
function toast(testo, azione) {
  const t = $("#toast"), a = $(".toast-azione", t); a.textContent = testo; t.hidden = false; di(testo);
  clearTimeout(toastT); toastT = setTimeout(() => { if (!t.contains(document.activeElement)) t.hidden = true; }, 12000);
  a.onclick = () => { t.hidden = true; if (azione) azione(); };
  $(".toast-x", t).onclick = () => { t.hidden = true; };
}
document.addEventListener("keydown", e => { if (e.key === "Escape") { const t = $("#toast"); if (t) t.hidden = true; } });

/* ---------- azioni ---------- */
const trova = (k, id) => S[k].find(x => x.id === id && !x.del);
const azioni = {
  tab(v) { const dir = ORD_TAB.indexOf(v) >= ORD_TAB.indexOf(tab) ? 1 : -1; vt(() => { tab = v; msg = ""; edit = null; bozza = null; scrollTo(0, 0); render(); focaTitolo(); cascata(); }, dir); },
  vai(v) {
    const [t, s] = String(v).split(":");
    if (t === "idee" && s === "mie") filtroS = "mie";
    if (t === "altro" && s) sub = s;
    if (t === "viaggio" && s) vsub = s;
    azioni.tab(t);
  },
  vsub(v) { const dir = v === "prenot" ? 1 : -1; vt(() => { vsub = v; msg = ""; render(); cascata(); }, dir); },
  giorno(v) { const dir = +v >= g ? 1 : -1; vt(() => { g = +v; render(); annunciaGiorno(); }, dir); },
  sub(v) { const ordine = ["scambio", "valigia", "cambio", "frasi", "sistema"], dir = ordine.indexOf(v) >= ordine.indexOf(sub) ? 1 : -1; vt(() => { sub = v; msg = ""; render(); cascata(); }, dir); },
  filtro(v) { filtroG = v === "" ? null : v; render(); },
  filtroS(v) { filtroS = v === "" ? null : v; render(); },
  filtroC(v) { filtroC = v === "" ? null : v; render(); },
  ordine(v) { ordine = v; render(); },
  vota(v) {
    const [id, k] = String(v).split(":"), i = trova("idee", id); if (!i || +i.stato !== 0) return;
    if (!possoVotare()) { dire(S.me ? "Il sondaggio è riservato ai quattro adulti del gruppo." : "Scegli prima il tuo nome: in alto nella pagina Idee.", "avv"); render(); return; }
    const n = +k, nuovo = miVoto(i) !== n; i.voti = i.voti || {}; i.voti[S.me] = [nuovo ? n : 0, nuovoTs(i.voti[S.me] && i.voti[S.me][1])]; tic(); if (nuovo && n === 1) scintille(...ultimoTocco, 12); salva(); render();
  },
  chiudi(v) {
    const [id, e] = String(v).split(":"), i = trova("idee", id), n = +e; if (!i || !possoChiudere(i) || ![0, 1, 2, 3].includes(n)) return;
    if (n === 1 || n === 2) {
      const k = conteggio(i);
      if (((n === 1 && k.esito === "respinta") || (n === 2 && k.esito === "approvata")) && !confirm(`La maggioranza dei votanti è per «${k.esito}». Chiudere comunque come «${STATI[n]}»?`)) return;
    }
    i.stato = n; i.chiusoDa = n ? S.me : ""; i.ts = nuovoTs(i.ts); salva(); render(); if (n === 1) { scintille(...ultimoTocco, 34); tic(18); di("Idea approvata."); }
  },
  modIdea(v) { edit = { k: "idee", id: v }; bozza = null; scrollTo(0, 0); render("#i-testo"); },
  modSpesa(v) { edit = { k: "spese", id: v }; scrollTo(0, 0); render("#s-desc"); },
  annulla() { edit = null; bozza = null; render(); },
  delIdea(v) { const i = trova("idee", v); if (i && confirm("Eliminare l'idea?")) { i.del = true; i.ts = nuovoTs(i.ts); salva(); render(); focaTitolo(); } },
  delSpesa(v) { const s = trova("spese", v); if (s && confirm("Eliminare la spesa?")) { s.del = true; s.ts = nuovoTs(s.ts); salva(); render(); focaTitolo(); } },
  fatto(v) { S.fatti[v] = !S.fatti[v]; tic(8); salva(); render(); },
  nota(_, el) { const k = el.dataset.v, t = el.value.trim(); if (t) S.note[k] = { t, ts: Date.now() }; else delete S.note[k]; salva(); },
  cambio(_, el) { const n = Number(String(el.value).replace(",", ".")); S.cambio = n > 0 ? n : 0; S.cambioQ = 0; S.cambioData = ""; salva(); render(); },
  syncOra() { SyncX.ora().then(() => render()); },
  onda(_, el) { if (calmo()) return; el.classList.remove("accendi", "onda"); void el.getBoundingClientRect(); el.classList.add("onda"); tic(6); setTimeout(() => el.classList.remove("onda"), 1500); },
  finestra(v, el) {
    const i = +v, d = TRIP.giorni[i]; if (!d) return;
    if (d.iso > oggiIso()) { const gg = d.data.replace(/^\S+ /, ""), inf = $(".avvento-info"); if (inf) inf.textContent = `Questa finestra si apre il ${gg}.`; di(`Questa finestra si apre il ${gg}.`); tic(6); if (!calmo()) { el.classList.remove("no"); void el.offsetWidth; el.classList.add("no"); } return; }
    if (S.finestre[d.iso]) { g = i; vsub = "itin"; azioni.tab("viaggio"); return; }
    S.finestre[d.iso] = true; salva(); el.classList.remove("pronta"); el.classList.add("aperta"); tic(14);
    const r = el.getBoundingClientRect(); scintille(r.left + r.width / 2, r.top + r.height / 2, 26);
    const inf = $(".avvento-info"); if (inf) inf.textContent = `Giorno ${i + 1}: ${d.titolo}.`; di(`Finestra aperta. Giorno ${i + 1}: ${d.titolo}.`);
    el.setAttribute("aria-label", `Giorno ${i + 1}: ${d.titolo}. Tocca per aprire il giorno`);
  },
  me(v) { S.me = v; salva(); msg = ""; render(); avvisaVoti(); },
  reset() { if (confirm("Cancellare idee, spese, note e dati riservati da questo telefono?")) { S = vuoto(); salva(); msg = ""; render(); } },
  mov(v) { if (!["auto", "on", "off"].includes(v)) return; S.mov = v; salva(); applicaMov(); render(); },
  valP(v) { S.valP = v; salva(); render(); },
  profilo(v) { if (S.valP) { if (v) S.profili[S.valP] = v; else delete S.profili[S.valP]; salva(); render(); } },
  spuntaV(v) { if (!S.valP) return; const m = (S.val[S.valP] = S.val[S.valP] || {}); m[v] = !m[v]; tic(8); salva(); render(); valigiaPronta(); },
  azzeraV() { if (S.valP && confirm("Azzerare tutte le spunte della lista di " + S.valP + "?")) { S.val[S.valP] = {}; delete S.valigiaOk[S.valP]; salva(); render(); } },
  async copia(v) { dire((await copia(String(v))) ? `Copiato: ${String(v).slice(0, 60)}` : "Copia non riuscita.", ""); render(); },
  async cambioOnline() {
    try {
      const r = await fetch("https://api.frankfurter.dev/v1/latest?base=GBP&symbols=EUR", { cache: "no-store" });
      const j = await r.json(), v = Number(j && j.rates && j.rates.EUR);
      if (!(v > 0)) throw new Error("risposta non valida");
      S.cambio = v; S.cambioQ = Date.now(); S.cambioData = String(j.date || "").slice(0, 10); salva();
      dire(`Cambio aggiornato: 1 £ vale ${String(v).replace(".", ",")} €.`);
    } catch { dire("Nessuna rete o servizio non raggiungibile: resta l'ultimo cambio salvato.", "avv"); }
    render();
  },
  importa(_, el) { importaFile([...el.files], false); },
  ripristina(_, el) { if (el.files[0] && confirm("Il backup sostituisce idee, spese, note e valigia di questo telefono. Continuare?")) importaFile([el.files[0]], true); },
  importaTesto() { const t = $("#incolla").value.trim(); if (!t) { dire("Incolla prima il messaggio ricevuto.", "avv"); render(); return; } importaTesto(t); },
  togliRiserv() { if (confirm("Rimuovere i dati riservati da questo telefono?")) { S.riserv = null; salva(); render(); } },
  async copiaCodice() { dire((await copia(messaggio())) ? "Testo copiato: incollalo in un messaggio." : "Copia non riuscita: usa «Condividi il file».", ""); render(); },
  async copiaSpese() { dire((await copia(riepilogoSpese())) ? "Riepilogo copiato." : "Copia non riuscita."); render(); },
  invita() { const l = linkAttiva(); if (!l) return; window.open("https://wa.me/?text=" + encodeURIComponent("Londra in tasca: tocca il link per attivare idee e sondaggi condivisi su questo telefono, poi scegli il tuo nome. Il link è riservato al gruppo, non inoltrarlo.\n" + l), "_blank", "noopener"); },
  async copiaInvito() { dire((await copia(linkAttiva())) ? "Link copiato: incollalo in un messaggio al gruppo." : "Copia non riuscita.", ""); render(); },
  async whatsapp() {
    const t = messaggio(), url = "https://wa.me/?text=" + encodeURIComponent(t);
    if (url.length > 3500) { dire((await copia(t)) ? "Messaggio lungo, copiato: aprilo in WhatsApp e incolla." : "Messaggio troppo lungo: usa «Condividi il file».", "avv"); render(); return; }
    window.open(url, "_blank", "noopener");
  },
  scarica() {
    if (navigator.standalone === true) { dire("Su iPhone usa «Invia su WhatsApp» o «Copia il testo».", "avv"); render(); return; }
    scaricaFile(fileDati());
  },
  async backup() {
    const { riserv, syncHash, ...resto } = S, dati = { lit3backup: true, versione: 1, esportato: Date.now(), dati: resto };
    const f = new File([JSON.stringify(dati, null, 1)], nomeFile("londra-backup"), { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: "Backup di Londra in tasca" }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    if (navigator.standalone === true) { dire((await copia("LIT3B:" + aB64(JSON.stringify(dati)))) ? "Backup copiato: incollalo in un messaggio a te stesso." : "Copia non riuscita.", "avv"); render(); return; }
    scaricaFile(f);
  },
  async condividi() {
    const f = fileDati();
    try {
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: "Londra in tasca" });
      else if (navigator.share) await navigator.share({ text: messaggio() });
      else azioni.scarica();
    } catch (e) { if (!e || e.name !== "AbortError") { dire("Condivisione non riuscita: usa «Invia su WhatsApp» o «Copia il testo».", "avv"); render(); } }
  }
};
const moduli = {
  idea(d) {
    const testo = String(d.get("testo") || "").trim(); if (!testo) return;
    const id = d.get("id"), campi = { testo, link: normLink(d.get("link")), nota: String(d.get("nota") || "").trim(), giorno: +d.get("giorno") || 0, cat: catOk(IDEE_CAT, d.get("cat")) };
    const x = id && trova("idee", id);
    if (x) Object.assign(x, campi, { ts: nuovoTs(x.ts) });
    else S.idee.push(Object.assign({ id: uid(), stato: 0, voti: possoVotare() ? { [S.me]: [1, Date.now()] } : {}, autore: S.me, chiusoDa: "" }, campi, { ts: Date.now() }));
    edit = null; bozza = null; msg = ""; tic(); salva(); render(); focaTitolo(); di(x ? "Modifica salvata." : "Idea aggiunta.");
  },
  spesa(d) {
    const importo = Number(String(d.get("importo")).replace(",", ".")), desc = String(d.get("desc") || "").trim();
    if (!(importo > 0) || importo > 1e6 || !desc || !nomeOk(d.get("chi"))) return;
    const id = d.get("id"), campi = { desc, importo, chi: d.get("chi"), tra: d.getAll("tra"), cat: catOk(SPESE_CAT, d.get("cat")) }, x = id && trova("spese", id);
    if (x) Object.assign(x, campi, { ts: nuovoTs(x.ts) }); else S.spese.push(Object.assign({ id: uid() }, campi, { ts: Date.now() }));
    edit = null; salva(); render(); focaTitolo(); di(x ? "Modifica salvata." : "Spesa aggiunta.");
  }
};
document.addEventListener("click", e => { const t = e.target.closest("[data-az]"); if (t) azioni[t.dataset.az](t.dataset.v, t); });
document.addEventListener("change", e => {
  const t = e.target.closest("[data-chg]"); if (!t) return;
  azioni[t.dataset.chg](t.type === "file" ? "" : (t.type === "checkbox" || t.tagName === "TEXTAREA" ? t.dataset.v : t.value), t);
});
document.addEventListener("input", e => {
  const tn = e.target.closest('textarea[data-chg="nota"]');
  if (tn) { azioni.nota("", tn); return; }
  const f = e.target.closest('form[data-form="idea"]');
  if (f && !edit) { const d = new FormData(f); bozza = { testo: String(d.get("testo") || ""), link: String(d.get("link") || ""), nota: String(d.get("nota") || ""), giorno: +d.get("giorno") || 0, cat: String(d.get("cat") || "") }; return; }
  const t = e.target.closest("[data-conv]"); if (!t || !(S.cambio > 0)) return;
  const altro = $(t.dataset.conv === "gbp" ? "#c-eur" : "#c-gbp"), v = Number(String(t.value).replace(",", "."));
  if (altro) altro.value = Number.isFinite(v) && t.value !== "" ? (Math.round((t.dataset.conv === "gbp" ? v * S.cambio : v / S.cambio) * 100) / 100).toFixed(2) : "";
});
document.addEventListener("submit", e => { const f = e.target.closest("form[data-form]"); if (f) { e.preventDefault(); moduli[f.dataset.form](new FormData(f), f); } });

/* scorrimento tra i giorni con il dito */
let tocco = null;
document.addEventListener("touchstart", e => { tocco = tab === "viaggio" && vsub === "itin" && e.touches.length === 1 && e.touches[0].clientX > 24 && e.touches[0].clientX < innerWidth - 24 && !e.target.closest("textarea,input,.rail") ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
document.addEventListener("touchend", e => {
  if (!tocco) return; const t = e.changedTouches[0], dx = t.clientX - tocco[0], dy = t.clientY - tocco[1]; tocco = null;
  if (Math.abs(dx) > 70 && Math.abs(dy) < 45) { const n = g + (dx < 0 ? 1 : -1); if (n >= 0 && n < TRIP.giorni.length) { const dir = n > g ? 1 : -1; tic(6); vt(() => { g = n; render(); annunciaGiorno(); }, dir); } }
}, { passive: true });

/* ---------- condivisione da altre app, offline, aggiornamenti, neve ---------- */
attivaDaLink(); addEventListener("hashchange", () => { if (attivaDaLink()) render(); });
(function daCondivisione() {
  const p = new URLSearchParams(location.search);
  if (!(p.has("url") || p.has("text") || p.has("title"))) return;
  const link = primoLink([p.get("url"), p.get("text")].filter(Boolean).join(" "));
  const testo = (p.get("title") || p.get("text") || "").replace(link, "").trim().slice(0, 200);
  bozza = { testo, link, nota: "" }; tab = "idee"; dire("Idea precompilata dalla condivisione: controlla e premi «Aggiungi idea».");
  try { history.replaceState(null, "", location.pathname); } catch { /* ok */ }
})();
if ("serviceWorker" in navigator) {
  const aveva = !!navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL === new URL("sw.js", location.href).href;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (aveva) toast("App aggiornata. Tocca per ricaricare.", () => location.reload()); });
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").then(r => {
    r.update().catch(() => {});
    document.addEventListener("visibilitychange", () => { if (!document.hidden) r.update().catch(() => {}); });
  }).catch(() => {}));
}
(function neve() {
  const c = $("#neve"); if (!c) return;
  const spenta = calmo;
  const x = c.getContext("2d"); let w, h; const fi = [];
  const mis = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
  mis(); addEventListener("resize", mis);
  for (let i = 0; i < 34; i++) { const z = [0.55, 1, 1.5][i % 3]; fi.push({ x: Math.random() * 3000, y: Math.random() * 2000, r: (0.7 + Math.random() * 1.5) * z, v: (0.25 + Math.random() * 0.6) * z, z, o: Math.random() * 6, p: Math.random() < 0.14 }); }
  let t = 0;
  (function giro() {
    if (document.hidden || spenta()) { x.clearRect(0, 0, w, h); setTimeout(giro, 900); return; }
    {
      x.clearRect(0, 0, w, h); t += 0.01;
      fi.forEach(f => {
        f.y += f.v; f.x += Math.sin(t + f.o) * 0.3 * f.z;
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
        x.beginPath(); x.arc(f.x % w, f.y, f.r, 0, 6.3); x.fillStyle = f.p ? "rgba(246,215,122," + (0.45 + f.z * 0.3) + ")" : "rgba(255,255,255," + (0.22 + f.z * 0.28) + ")"; x.fill();
      });
    }
    requestAnimationFrame(giro);
  })();
})();

applicaMov(); riduci.addEventListener("change", () => { applicaMov(); render(); });
const aggiornaRete = () => { const o = $("#offline"); if (o) o.hidden = navigator.onLine; };
addEventListener("online", aggiornaRete); addEventListener("offline", aggiornaRete); aggiornaRete();
render(); cascata(); avvisaVoti(); SyncX.start(); setTimeout(saluti, 900);
document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(saluti, 600); });
setInterval(() => { if (tab === "viaggio" && vsub === "itin") aggiornaAdesso(); else if (tab === "oggi" && !document.activeElement.closest("form,textarea,input")) render(); }, 60000);
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch { /* ok */ }
