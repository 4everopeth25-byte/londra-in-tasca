"use strict";
/* Londra in tasca 3. Itinerario in dati.js; idee, spese, note e valigia nel telefono (localStorage, chiave lit3-v1).
   Al primo avvio copia i dati della versione 2 (chiave lit-v1), che resta intatta. Formato di scambio identico alla v2. */
const CH = "lit3-v1", CH_VECCHIO = "lit-v1";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = n => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
const gbp = n => "£" + num(n), eur = n => "€" + num(n);
const vivi = a => a.filter(x => !x.del);
const STATI = ["in votazione", "approvata", "respinta", "fatta"];
const riduci = matchMedia("(prefers-reduced-motion: reduce)");
const tic = ms => { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch { /* non disponibile */ } };
const vt = fn => { if (document.startViewTransition && !riduci.matches) document.startViewTransition(fn); else fn(); };
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
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3"/>'
};
const ic = (n, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONE[n]}</svg>`;

const FIN = [[56, 72], [56, 92], [56, 110], [76, 104], [92, 104], [110, 104], [126, 104], [248, 60], [248, 88], [248, 114], [272, 96], [272, 112], [296, 110], [372, 108], [372, 122], [315, 88], [355, 88], [10, 108], [34, 112]];
const SKYLINE = `<svg class="skyline" viewBox="0 0 400 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<g class="sil"><rect x="0" y="116" width="400" height="34"/><rect x="4" y="98" width="22" height="30"/><rect x="28" y="106" width="18" height="30"/>
<rect x="52" y="48" width="16" height="84"/><path d="M50 48 L60 14 L70 48z"/><rect x="48" y="42" width="24" height="8"/>
<rect x="70" y="94" width="64" height="40"/><rect x="82" y="82" width="6" height="14"/><rect x="104" y="78" width="6" height="18"/><rect x="122" y="84" width="6" height="12"/>
<path d="M182 92 L170 136 L176 136 L186 100z M198 92 L210 136 L204 136 L194 100z"/>
<path d="M236 136 L250 20 L264 136z"/><rect x="268" y="86" width="22" height="50"/><rect x="292" y="98" width="14" height="38"/>
<rect x="312" y="72" width="12" height="64"/><rect x="310" y="66" width="16" height="8"/><path d="M312 66 L318 54 L324 66z"/>
<rect x="352" y="72" width="12" height="64"/><rect x="350" y="66" width="16" height="8"/><path d="M352 66 L358 54 L364 66z"/>
<rect x="324" y="100" width="28" height="5"/><path d="M324 100 Q338 114 352 100" fill="none" stroke="#0a0e27" stroke-width="2.4"/><rect x="368" y="102" width="32" height="34"/></g>
<circle class="ruota" cx="190" cy="78" r="30"/><path class="ruota" d="M190 48 V108 M160 78 H220 M169 57 L211 99 M211 57 L169 99"/>
${FIN.map(([x, y]) => `<rect class="fin" x="${x}" y="${y}" width="3" height="3"/>`).join("")}</svg>`;

/* ---------- stato ---------- */
const vuoto = () => ({ me: "", idee: [], spese: [], fatti: {}, note: {}, cambio: 0, cambioQ: 0, cambioData: "", val: {}, profili: {}, valP: "", neve: true, riserv: null, migratoDa: "" });
const ID_OK = /^[A-Za-z0-9_-]{1,40}$/;
const nomeOk = p => typeof p === "string" && p.trim() !== "" && p.length <= 40 && !/^(__proto__|constructor|prototype)$/.test(p);
const mappa = (o, ok) => { const r = {}; if (o && typeof o === "object" && !Array.isArray(o)) for (const [k, v] of Object.entries(o).slice(0, 600)) if (k.length <= 80 && k !== "__proto__" && ok(v)) r[k] = v; return r; };
const pulisciMappe = x => {
  x.profili = mappa(x.profili, v => v === "uomo" || v === "donna"); x.fatti = mappa(x.fatti, v => typeof v === "boolean");
  x.note = mappa(x.note, v => v && typeof v.t === "string"); x.val = mappa(x.val, v => v && typeof v === "object" && !Array.isArray(v));
};
function leggi(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }
function carica() {
  try {
    let raw = leggi(CH), migra = false;
    if (!raw) { raw = leggi(CH_VECCHIO); migra = !!raw; }
    const x = Object.assign(vuoto(), raw || {});
    for (const k of ["idee", "spese"]) x[k] = Array.isArray(x[k]) ? x[k].filter(y => y && typeof y === "object" && typeof y.id === "string" && ID_OK.test(y.id)) : [];
    pulisciMappe(x);
    if (!Number.isFinite(+x.cambio)) x.cambio = 0;
    if (!Number.isFinite(+x.cambioQ)) x.cambioQ = 0;
    for (const k of ["me", "valP", "cambioData", "migratoDa"]) if (typeof x[k] !== "string") x[k] = "";
    if (x.riserv && typeof x.riserv !== "object") x.riserv = null;
    if (migra) { x.migratoDa = "lit-v1"; try { localStorage.setItem(CH, JSON.stringify(x)); } catch { /* ok */ } }
    return x;
  } catch { return vuoto(); }
}
let S = carica(), salvaAvvisato = false;
function salva() { try { localStorage.setItem(CH, JSON.stringify(S)); } catch { if (!salvaAvvisato) { salvaAvvisato = true; msg = "Impossibile salvare su questo telefono: le modifiche si perdono alla chiusura."; } } }
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
function aggiornaAdesso() {
  const box = $("#adesso"); if (!box) return;
  document.querySelectorAll(".tl li").forEach(li => li.classList.remove("in-corso", "prossima"));
  const st = statoOggi(); if (!st || st.g !== g) { box.hidden = true; return; }
  if (st.cur >= 0) $(`.tl li[data-i="${st.cur}"]`)?.classList.add("in-corso");
  if (st.next >= 0) $(`.tl li[data-i="${st.next}"]`)?.classList.add("prossima");
  const f = fraseProssima(st), t = f ? `<b>Prossima tappa</b>: ${esc(f.t)}, ${esc(f.s)}.` : "";
  if (box.dataset.t !== t) { box.dataset.t = t; box.innerHTML = t; }
  box.hidden = !t;
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
function vistaOggi() {
  const ora = new Date(), st = statoOggi(), partenza = new Date(TRIP.partenza), ng = TRIP.giorni.length;
  let h1, sotto, piccolo = "Natale 2026";
  if (st) { h1 = `Giorno ${st.g + 1} di ${ng}`; sotto = TRIP.giorni[st.g].titolo; piccolo = TRIP.giorni[st.g].data; }
  else if (ora < partenza) { const mezz = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), gg = Math.max(1, Math.round((mezz(partenza) - mezz(ora)) / 864e5)); h1 = `<span class="num">${gg}</span> ${gg === 1 ? "giorno" : "giorni"} a Londra`; sotto = "Si parte mercoledì 23 dicembre alle 19:05 da Venezia."; }
  else { h1 = "Bentornati"; sotto = "Il viaggio è finito: salva un backup di idee e spese."; }
  const f = st ? fraseProssima(st) : null;
  const prossima = f
    ? `<div class="tessera largo"><span class="etic">Prossima tappa</span><div class="val" style="font-size:1.5rem">${esc(f.t)}</div><div class="desc">${esc(f.s)}</div>
       <div class="riga">${f.q ? `<a class="map pri" target="_blank" rel="noopener" href="${mapsUrl([f.q], TRIP.giorni[st.g].mezzo)}">${ic("pin", 18)}Mappa<span class="vh">, si apre in una nuova scheda</span></a>` : ""}<button class="btn" data-az="vai" data-v="viaggio:itin">Apri il giorno</button></div></div>`
    : `<button class="tessera largo" data-az="vai" data-v="viaggio:itin"><span class="ico">${ic("compass")}</span><span class="etic">Primo giorno, mercoledì 23 dicembre</span><div class="val" style="font-size:1.4rem">${esc(TRIP.giorni[0].titolo)}</div><div class="desc">${TRIP.giorni[0].tappe.length} tappe, dal volo alla cena a King's Cross.</div></button>`;
  const dv = daVotare(), tot = saldi().tot, vs = S.valP ? statoValigia(S.valP) : null;
  const pct = vs && vs.tot ? Math.round(vs.fatte / vs.tot * 100) : 0, circ = 2 * Math.PI * 16;
  return `<section class="cielo" aria-label="Il viaggio"><div class="cielo-testo"><p class="piccolo">${esc(piccolo)}</p><h1>${h1}</h1><p class="sotto">${esc(sotto)}</p></div>${SKYLINE}</section>
    <div class="tessere">
      ${prossima}
      <button class="tessera" data-az="vai" data-v="idee:mie"><span class="ico">${ic("bulb")}</span><span class="etic">Idee da votare</span><div class="val">${dv}</div><div class="desc">${dv ? "Tocca per votare" : "Nessuna in attesa"}</div></button>
      <button class="tessera" data-az="vai" data-v="spese"><span class="ico">${ic("wallet")}</span><span class="etic">Spese</span><div class="val">${gbp(tot)}</div><div class="desc">${S.cambio > 0 ? "circa " + eur(tot * S.cambio) : "speso finora"}</div></button>
      <button class="tessera" data-az="vai" data-v="altro:valigia"><span class="ico">${ic("bag")}</span><span class="etic">Valigia</span>
        ${vs && vs.tot ? `<div class="val">${pct}<small>%</small></div><div class="desc">${esc(S.valP)}: ${vs.fatte} su ${vs.tot}</div>
        <svg class="anello" width="38" height="38" viewBox="0 0 38 38" aria-hidden="true"><circle class="f" cx="19" cy="19" r="16"/><circle class="p" cx="19" cy="19" r="16" transform="rotate(-90 19 19)" stroke-dasharray="${(circ * pct / 100).toFixed(1)} ${circ.toFixed(1)}"/></svg>`
        : `<div class="val" style="font-size:1.2rem">Scegli chi sei</div><div class="desc">Lista su misura</div>`}</button>
      <button class="tessera" data-az="vai" data-v="altro:cambio"><span class="ico">${ic("swap")}</span><span class="etic">Cambio</span>${S.cambio > 0 ? `<div class="val">£10 <small>= ${eur(10 * S.cambio)}</small></div><div class="desc">Funziona anche offline</div>` : `<div class="val" style="font-size:1.2rem">Da impostare</div><div class="desc">Sterline in euro</div>`}</button>
      <button class="tessera largo" data-az="vai" data-v="viaggio:prenot"><span class="ico">${ic("plane")}</span><span class="etic">Voli e prenotazioni</span>
        <div class="desc" style="margin-top:6px">Andata mer 23/12, 19:05, Venezia VCE verso Luton LTN.</div><div class="desc">Ritorno dom 27/12, 20:55, Luton LTN verso Venezia VCE.</div></button>
      <a class="tessera" href="tel:999"><span class="ico">${ic("phone")}</span><span class="etic">Emergenze nel Regno Unito</span><div class="val">999</div></a>
      <button class="tessera" data-az="vai" data-v="altro:frasi"><span class="ico">${ic("key")}</span><span class="etic">Frasi utili</span><div class="val" style="font-size:1.2rem">In inglese</div><div class="desc">Per ristoranti e taxi</div></button>
    </div>`;
}

function vistaViaggio() {
  const seg = [["itin", "Itinerario"], ["prenot", "Prenotazioni"]].map(([v, l]) => `<button class="chip" data-az="vsub" data-v="${v}" aria-pressed="${vsub === v}">${l}</button>`).join("");
  return `<h1 class="vt">Viaggio</h1><div class="chips" role="group" aria-label="Sezione del viaggio">${seg}</div>${avviso()}${vsub === "prenot" ? vistaPrenot() : vistaItinerario()}`;
}
function vistaItinerario() {
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
  return `<div class="rail" role="group" aria-label="Giorni del viaggio">${rail}</div>
    <div class="testa-giorno"><h2 class="h-sez" style="margin:0;font-size:1.5rem">${esc(d.titolo)}</h2><p class="mute">${esc(d.data)}. Scorri a destra o a sinistra per cambiare giorno.</p></div>
    <div id="adesso" class="scheda adesso" hidden></div>
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
  return `<div class="scheda"><div class="riga" style="margin:0 0 6px"><span class="cat c-${cat}">${catNome(IDEE_CAT, cat)}</span><span class="pill st${+i.stato}">${STATI[+i.stato] || STATI[0]}</span></div>
    <div class="nome" style="font-size:1.1rem">${esc(i.testo)}</div>${i.nota ? `<div class="desc">${esc(i.nota)}</div>` : ""}
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
  const cats = [["", "Tutte"], ...IDEE_CAT].map(([v, l]) => `<button class="chip" data-az="filtroC" data-v="${v}" aria-pressed="${(filtroC ?? "") === v}">${l}</button>`).join("");
  const stati = [["", "Tutti gli stati"], ["mie", "Da votare da me"], ["0", "In votazione"], ["1", "Approvate"], ["2", "Respinte"], ["3", "Fatte"]].map(([v, l]) => `<button class="chip" data-az="filtroS" data-v="${v}" aria-pressed="${(filtroS ?? "") === v}">${l}</button>`).join("");
  const giorni = [["", "Tutti i giorni"], ...TRIP.giorni.map((d, i) => [String(i + 1), "Giorno " + (i + 1)]), ["0", "Senza giorno"]].map(([v, l]) => `<button class="chip" data-az="filtro" data-v="${v}" aria-pressed="${(filtroG ?? "") === v}">${l}</button>`).join("");
  const punti = i => { const k = conteggio(i); return k.c.s - k.c.n; };
  const passa = i => (filtroG == null || +i.giorno === +filtroG) && (filtroC == null || catOk(IDEE_CAT, i.cat) === filtroC) && (filtroS == null || (filtroS === "mie" ? daVotareIdea(i) : +i.stato === +filtroS));
  const lista = vivi(S.idee).filter(passa).sort((a, b) => (ordine === "voti" ? punti(b) - punti(a) : 0) || b.ts - a.ts).map(schedaIdea).join("");
  const ed = edit && edit.k === "idee" ? S.idee.find(x => x.id === edit.id && !x.del) : null, attivi = filtroG != null || filtroS != null;
  return `<h1 class="vt">Idee</h1>${avviso()}
    <p class="mute">Ogni idea è un sondaggio: votano i quattro adulti e vince la maggioranza. Le idee e i voti si scambiano da Altro.</p>
    ${S.me ? "" : `<div class="scheda"><label class="mute" for="chisei">Chi sei? Serve per firmare idee e voti.</label><select id="chisei" data-chg="me"><option value="">Scegli il tuo nome</option>${ps.map(p => `<option>${esc(p)}</option>`).join("")}</select></div>`}
    ${dv > 0 && filtroS !== "mie" ? `<div class="scheda adesso"><b>Hai ${dv} ${dv === 1 ? "idea" : "idee"} da votare.</b><div class="riga"><button class="btn pri" data-az="filtroS" data-v="mie">Mostra</button></div></div>` : ""}
    <details class="scheda nuova"${ed || bozza ? " open" : ""}><summary>Nuova idea</summary>${formIdea(ed || bozza || {})}</details>
    <div class="chips" role="group" aria-label="Filtra per categoria">${cats}</div>
    <div class="riga" style="margin:0 0 8px"><button class="chip" data-az="ordine" data-v="${ordine === "voti" ? "recenti" : "voti"}" aria-pressed="${ordine === "voti"}">${ordine === "voti" ? "Ordinate per voti" : "Ordina per voti"}</button></div>
    <details class="scheda nuova"${attivi ? " open" : ""}><summary>Altri filtri${attivi ? " (attivi)" : ""}</summary>
    <div class="chips avvolgi" role="group" aria-label="Filtra per stato">${stati}</div><div class="chips avvolgi" role="group" aria-label="Filtra per giorno">${giorni}</div></details>
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
  return `<h1 class="vt">Spese</h1>${avviso()}
    ${ignoti.length ? `<div class="msg avv">Alcune spese hanno nomi non presenti nel gruppo (${esc(ignoti.join(", "))}). Modificale per correggere i saldi.</div>` : ""}
    <div class="scheda"><div class="mute piccolo">Totale speso</div><div class="tot">${gbp(tot)}</div>${S.cambio > 0 ? `<div class="mute">circa ${eur(tot * S.cambio)}</div>` : ""}
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
  const seg = [["scambio", "Scambio"], ["valigia", "Valigia"], ["cambio", "Cambio"], ["frasi", "Frasi"], ["sistema", "Sistema"]]
    .map(([v, l]) => `<button class="chip" data-az="sub" data-v="${v}" aria-pressed="${sub === v}">${l}</button>`).join("");
  const corpo = { scambio: vistaScambio, valigia: vistaValigia, cambio: vistaCambio, frasi: vistaFrasi, sistema: vistaSistema }[sub]();
  return `<h1 class="vt">Altro</h1>${avviso()}<div class="chips avvolgi" role="group" aria-label="Sezione di Altro">${seg}</div>${corpo}`;
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
    <div class="scheda"><div class="nome">Invia le tue idee, i voti e le spese</div><div class="desc">Il modo più semplice: manda il messaggio su WhatsApp. Chi lo riceve lo incolla qui sotto.</div>
    <div class="riga"><button class="btn pri" data-az="whatsapp">Invia su WhatsApp</button><button class="btn" data-az="copiaCodice">${ic("copy", 18)}Copia il testo</button></div>
    <div class="desc" style="margin-top:10px">In alternativa un file:</div><div class="riga"><button class="btn" data-az="condividi">Condividi il file</button><button class="btn" data-az="scarica">Scarica</button></div></div>
    <div class="scheda"><div class="nome">Ricevi idee, voti e spese</div><div class="desc">Incolla il messaggio ricevuto, oppure scegli un file. Si uniscono senza duplicati. Vale anche per i dati riservati.</div>
    <label class="mute" for="incolla" style="margin-top:10px">Messaggio ricevuto</label><textarea id="incolla" rows="3" placeholder="Incolla qui il messaggio"></textarea>
    <div class="riga"><button class="btn pri" data-az="importaTesto">Importa il testo</button></div>
    <div class="riga"><input type="file" id="file" accept="application/json,.json" multiple data-chg="importa" aria-label="Scegli un file da importare"></div></div>
    <div class="scheda"><div class="nome">Dati riservati</div><div class="desc">${S.riserv ? "Importati: codici e nomi sono visibili in Viaggio, Prenotazioni." : "Non importati."}</div>
    ${S.riserv ? `<div class="riga"><button class="btn rosso" data-az="togliRiserv">Rimuovi dal telefono</button></div>` : ""}</div>`;
}
function vistaSistema() {
  return `<div class="scheda"><div class="nome">Uso senza rete</div><div class="desc" id="stato-offline">Controllo in corso.</div></div>
    <div class="scheda"><div class="nome">Backup completo</div><div class="desc">Salva tutto ciò che è su questo telefono: idee, voti, spese, note, valigia e cambio. I dati riservati non sono inclusi.</div>
    <div class="riga"><button class="btn pri" data-az="backup">Esporta il backup</button></div>
    <div class="riga"><input type="file" id="ripristino" accept="application/json,.json" data-chg="ripristina" aria-label="Scegli un backup da ripristinare"></div></div>
    <div class="scheda"><div class="nome">Neve e luci animate</div><div class="desc">Animazioni decorative di sfondo.</div>
    <div class="riga"><button class="btn" data-az="neve" aria-pressed="${S.neve !== false}">Neve e luci animate</button></div></div>
    <div class="scheda"><div class="nome">Versione 3</div><div class="desc">Prova della nuova grafica. ${S.migratoDa ? "I dati della versione 2 sono stati copiati qui al primo avvio e la versione 2 resta com'è: da ora le due versioni non si aggiornano a vicenda." : "Questa versione tiene i suoi dati per conto proprio."}</div></div>
    <p class="mute piccolo">Idee e spese: ${vivi(S.idee).length} e ${vivi(S.spese).length}, salvate solo su questo telefono.</p>`;
}

/* ---------- barra, rendering, focus ---------- */
const DOCK = [["oggi", "Oggi", "home"], ["viaggio", "Viaggio", "compass"], ["idee", "Idee", "bulb"], ["spese", "Spese", "wallet"], ["altro", "Altro", "grid"]];
$("#dock").innerHTML = DOCK.map(([id, l, i]) => `<button data-az="tab" data-v="${id}" data-t="${id}">${ic(i, 22)}<span>${l}</span>${id === "idee" ? `<b id="badge-idee" class="badge" hidden aria-hidden="true"></b>` : ""}</button>`).join("");
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
  const sel = selFoco(document.activeElement);
  try { $("#vista").innerHTML = viste[tab](); } catch {
    $("#vista").innerHTML = `<div class="scheda"><h2>Dati non leggibili</h2><div class="desc">Qualcosa nei dati salvati su questo telefono blocca la pagina.</div><div class="riga"><button class="btn rosso" data-az="reset">Azzera i dati locali</button></div></div>`;
  }
  const bersaglio = foco || sel;
  if (bersaglio) { try { const el = $(bersaglio); if (el) el.focus({ preventScroll: true }); } catch { /* selettore non valido */ } }
  document.title = (tab === "oggi" ? "" : DOCK.find(d => d[0] === tab)[1] + " - ") + "Londra in tasca 3";
  document.querySelectorAll("#dock button").forEach(b => { if (b.dataset.t === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  const dv = daVotare(), bd = $("#badge-idee"), bt = $('#dock [data-t="idee"]');
  if (bd) { bd.hidden = !dv; bd.textContent = dv; }
  if (bt) { if (dv) bt.setAttribute("aria-label", `Idee, ${dv} da votare`); else bt.removeAttribute("aria-label"); }
  if (msg && msg !== annunciato) { annunciato = msg; di(msg); } else if (!msg) annunciato = "";
  aggiornaAdesso();
  if (tab === "altro" && sub === "sistema") statoOffline();
}
async function statoOffline() {
  const el = $("#stato-offline"); if (!el) return;
  try {
    if (!("caches" in window) || !navigator.serviceWorker) throw new Error("no");
    const chiavi = (await caches.keys()).filter(k => k.startsWith("lit3-"));
    const n = chiavi.length ? (await (await caches.open(chiavi[0])).keys()).length : 0;
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
function pulisciRiserv(j) {
  const s = (v, n = 60) => (typeof v === "string" ? v.slice(0, n) : ""), o = { riservati: true }, gr = nomi(j.gruppo);
  if (gr.length) o.gruppo = gr;
  if (typeof j.bambina === "string") o.bambina = s(j.bambina);
  if (j.voli && typeof j.voli === "object") o.voli = { andata: s(j.voli.andata, 20), ritorno: s(j.voli.ritorno, 20) };
  if (j.idalia && typeof j.idalia === "object") o.idalia = { conferma: s(j.idalia.conferma, 20), nome: s(j.idalia.nome) };
  if (j.alloggio && typeof j.alloggio === "object") o.alloggio = { indirizzo: s(j.alloggio.indirizzo, 120) };
  return o;
}
function ripristina(j) {
  const d = j && j.dati; if (!d || typeof d !== "object") return false;
  try { localStorage.setItem("lit3-prima-ripristino", JSON.stringify(S)); } catch { /* ok */ }
  const n = vuoto(); n.riserv = S.riserv; n.migratoDa = S.migratoDa; n.neve = d.neve !== false;
  n.me = gruppo().includes(S.me) ? S.me : ""; n.valP = nomeOk(d.valP) ? d.valP : "";
  for (const k of ["fatti", "note", "val", "profili"]) n[k] = d[k];
  pulisciMappe(n);
  n.cambio = Number(d.cambio) > 0 ? Number(d.cambio) : 0; n.cambioQ = tsOk(d.cambioQ); n.cambioData = str(d.cambioData, 10);
  S = n; for (const k of ["idee", "spese"]) for (const x of (Array.isArray(d[k]) ? d[k] : [])) unisci(k, x);
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
}
async function importaFile(files, consentiBackup) {
  const n = { idee: 0, spese: 0, riserv: false, backup: false }; let err = 0;
  for (const f of files) { try { if (!applica(JSON.parse(await f.text()), n, consentiBackup)) err++; } catch { err++; } }
  esito(n, err);
}
function importaTesto(t) {
  const n = { idee: 0, spese: 0, riserv: false, backup: false }; let err = 0;
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
  tab(v) { vt(() => { tab = v; msg = ""; edit = null; bozza = null; scrollTo(0, 0); render(); focaTitolo(); }); },
  vai(v) {
    const [t, s] = String(v).split(":");
    if (t === "idee" && s === "mie") filtroS = "mie";
    if (t === "altro" && s) sub = s;
    if (t === "viaggio" && s) vsub = s;
    azioni.tab(t);
  },
  vsub(v) { vsub = v; msg = ""; render(); },
  giorno(v) { g = +v; vt(render); annunciaGiorno(); },
  sub(v) { sub = v; msg = ""; render(); },
  filtro(v) { filtroG = v === "" ? null : v; render(); },
  filtroS(v) { filtroS = v === "" ? null : v; render(); },
  filtroC(v) { filtroC = v === "" ? null : v; render(); },
  ordine(v) { ordine = v; render(); },
  vota(v) {
    const [id, k] = String(v).split(":"), i = trova("idee", id); if (!i || +i.stato !== 0) return;
    if (!possoVotare()) { dire(S.me ? "Il sondaggio è riservato ai quattro adulti del gruppo." : "Scegli prima il tuo nome: in alto nella pagina Idee.", "avv"); render(); return; }
    const n = +k; i.voti = i.voti || {}; i.voti[S.me] = [miVoto(i) === n ? 0 : n, nuovoTs(i.voti[S.me] && i.voti[S.me][1])]; tic(); salva(); render();
  },
  chiudi(v) {
    const [id, e] = String(v).split(":"), i = trova("idee", id), n = +e; if (!i || !possoChiudere(i) || ![0, 1, 2, 3].includes(n)) return;
    if (n === 1 || n === 2) {
      const k = conteggio(i);
      if (((n === 1 && k.esito === "respinta") || (n === 2 && k.esito === "approvata")) && !confirm(`La maggioranza dei votanti è per «${k.esito}». Chiudere comunque come «${STATI[n]}»?`)) return;
    }
    i.stato = n; i.chiusoDa = n ? S.me : ""; i.ts = nuovoTs(i.ts); salva(); render();
  },
  modIdea(v) { edit = { k: "idee", id: v }; bozza = null; scrollTo(0, 0); render("#i-testo"); },
  modSpesa(v) { edit = { k: "spese", id: v }; scrollTo(0, 0); render("#s-desc"); },
  annulla() { edit = null; bozza = null; render(); },
  delIdea(v) { const i = trova("idee", v); if (i && confirm("Eliminare l'idea?")) { i.del = true; i.ts = nuovoTs(i.ts); salva(); render(); focaTitolo(); } },
  delSpesa(v) { const s = trova("spese", v); if (s && confirm("Eliminare la spesa?")) { s.del = true; s.ts = nuovoTs(s.ts); salva(); render(); focaTitolo(); } },
  fatto(v) { S.fatti[v] = !S.fatti[v]; tic(8); salva(); render(); },
  nota(_, el) { const k = el.dataset.v, t = el.value.trim(); if (t) S.note[k] = { t, ts: Date.now() }; else delete S.note[k]; salva(); },
  cambio(_, el) { const n = Number(String(el.value).replace(",", ".")); S.cambio = n > 0 ? n : 0; S.cambioQ = 0; S.cambioData = ""; salva(); render(); },
  me(v) { S.me = v; salva(); msg = ""; render(); avvisaVoti(); },
  reset() { if (confirm("Cancellare idee, spese, note e dati riservati da questo telefono?")) { S = vuoto(); salva(); msg = ""; render(); } },
  neve() { S.neve = S.neve === false; salva(); const c = $("#neve"); if (c) c.hidden = S.neve === false; document.documentElement.classList.toggle("calmo", S.neve === false); render(); },
  valP(v) { S.valP = v; salva(); render(); },
  profilo(v) { if (S.valP) { if (v) S.profili[S.valP] = v; else delete S.profili[S.valP]; salva(); render(); } },
  spuntaV(v) { if (!S.valP) return; const m = (S.val[S.valP] = S.val[S.valP] || {}); m[v] = !m[v]; tic(8); salva(); render(); },
  azzeraV() { if (S.valP && confirm("Azzerare tutte le spunte della lista di " + S.valP + "?")) { S.val[S.valP] = {}; salva(); render(); } },
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
    const { riserv, ...resto } = S, dati = { lit3backup: true, versione: 1, esportato: Date.now(), dati: resto };
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
  if (Math.abs(dx) > 70 && Math.abs(dy) < 45) { const n = g + (dx < 0 ? 1 : -1); if (n >= 0 && n < TRIP.giorni.length) { g = n; tic(6); vt(render); annunciaGiorno(); } }
}, { passive: true });

/* ---------- condivisione da altre app, offline, aggiornamenti, neve ---------- */
(function daCondivisione() {
  const p = new URLSearchParams(location.search);
  if (!(p.has("url") || p.has("text") || p.has("title"))) return;
  const link = primoLink([p.get("url"), p.get("text")].filter(Boolean).join(" "));
  const testo = (p.get("title") || p.get("text") || "").replace(link, "").trim().slice(0, 200);
  bozza = { testo, link, nota: "" }; tab = "idee"; dire("Idea precompilata dalla condivisione: controlla e premi «Aggiungi idea».");
  try { history.replaceState(null, "", location.pathname); } catch { /* ok */ }
})();
if ("serviceWorker" in navigator) {
  const aveva = !!navigator.serviceWorker.controller && /\/v3\/sw\.js/.test(navigator.serviceWorker.controller.scriptURL);
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (aveva) toast("App aggiornata. Tocca per ricaricare.", () => location.reload()); });
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").then(r => {
    r.update().catch(() => {});
    document.addEventListener("visibilitychange", () => { if (!document.hidden) r.update().catch(() => {}); });
  }).catch(() => {}));
}
(function neve() {
  const c = $("#neve"); if (!c) return;
  const spenta = () => riduci.matches || S.neve === false;
  c.hidden = spenta(); riduci.addEventListener("change", () => { c.hidden = spenta(); });
  const x = c.getContext("2d"); let w, h; const fi = [];
  const mis = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
  mis(); addEventListener("resize", mis);
  for (let i = 0; i < 60; i++) fi.push({ x: Math.random() * 3000, y: Math.random() * 2000, r: 0.8 + Math.random() * 2.8, v: 0.2 + Math.random() * 0.8, o: Math.random() * 6, p: Math.random() < 0.14 });
  let t = 0;
  (function giro() {
    if (!document.hidden && !spenta()) {
      x.clearRect(0, 0, w, h); t += 0.01;
      fi.forEach(f => {
        f.y += f.v * (f.r > 2 ? 1.2 : 0.8); f.x += Math.sin(t + f.o) * 0.35;
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
        x.beginPath(); x.arc(f.x % w, f.y, f.r, 0, 6.3); x.fillStyle = f.p ? "rgba(255,158,199,.8)" : "rgba(255,255,255," + (0.35 + f.r / 5) + ")"; x.fill();
      });
    }
    requestAnimationFrame(giro);
  })();
})();

document.documentElement.classList.toggle("calmo", S.neve === false);
render(); avvisaVoti();
setInterval(() => { if (tab === "viaggio" && vsub === "itin") aggiornaAdesso(); else if (tab === "oggi" && !document.activeElement.closest("form,textarea,input")) render(); }, 60000);
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch { /* ok */ }
