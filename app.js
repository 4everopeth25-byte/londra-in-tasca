"use strict";
/* Londra in tasca: PWA senza librerie. Itinerario in dati.js, idee, spese e note nel telefono (localStorage). */
const CH = "lit-v1";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = n => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
const gbp = n => "£" + num(n);
const eur = n => "€" + num(n);
const vivi = a => a.filter(x => !x.del);
const STATI = ["da valutare", "sì", "no", "fatta"];

const vuoto = () => ({ me: "", idee: [], spese: [], fatti: {}, note: {}, cambio: 0, cambioQ: 0, cambioData: "", val: {}, profili: {}, valP: "", riserv: null });
let S = carica();
function carica() {
  try {
    const x = Object.assign(vuoto(), JSON.parse(localStorage.getItem(CH) || "{}"));
    for (const k of ["idee", "spese"]) if (!Array.isArray(x[k])) x[k] = [];
    for (const k of ["fatti", "note", "val", "profili"]) if (!x[k] || typeof x[k] !== "object") x[k] = {};
    if (!Number.isFinite(+x.cambio)) x.cambio = 0;
    if (!Number.isFinite(+x.cambioQ)) x.cambioQ = 0;
    if (typeof x.valP !== "string") x.valP = "";
    if (typeof x.cambioData !== "string") x.cambioData = "";
    if (x.riserv && typeof x.riserv !== "object") x.riserv = null;
    return x;
  } catch { return vuoto(); }
}
let salvaAvvisato = false;
function salva() { try { localStorage.setItem(CH, JSON.stringify(S)); } catch { if (!salvaAvvisato) { salvaAvvisato = true; msg = "Impossibile salvare su questo telefono: le modifiche si perdono alla chiusura."; } } }
const gruppo = () => (S.riserv && Array.isArray(S.riserv.gruppo) && S.riserv.gruppo.length ? S.riserv.gruppo : TRIP.gruppoDefault);

const oggiIso = (n = new Date()) => `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
const oggiNelViaggio = () => TRIP.giorni.some(d => d.iso === oggiIso());
function giornoIniziale() { const i = TRIP.giorni.findIndex(d => d.iso === oggiIso()); return i < 0 ? 0 : i; }

let tab = "giorni", g = giornoIniziale(), msg = "", sub = "scambio", filtroG = null, edit = null, bozza = null;

/* ---------- link e Google Maps ---------- */
const primoLink = s => { const m = /https?:\/\/[^\s<>"']+/i.exec(String(s || "")); return m ? m[0].replace(/[.,;)]+$/, "") : ""; };
function normLink(s) {
  s = String(s || "").trim(); if (!s) return "";
  let u = primoLink(s);
  if (!u && /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s)) u = "https://" + s;
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; }
}
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const luogo = x => encodeURIComponent(/Luton|London|Londra/.test(x) ? x : x + ", London");
const casaQ = () => (S.riserv && S.riserv.alloggio && S.riserv.alloggio.indirizzo) || "";
const qt = t => (t.casa && casaQ()) || t.q;
function mapsUrl(qs, modo) {
  const q = qs.filter(Boolean);
  if (!q.length) return "";
  if (q.length === 1) return "https://www.google.com/maps/search/?api=1&query=" + luogo(q[0]);
  return `https://www.google.com/maps/dir/?api=1&origin=${luogo(q[0])}&destination=${luogo(q[q.length - 1])}` +
    (q.length > 2 ? `&waypoints=${q.slice(1, -1).map(luogo).join("%7C")}` : "") + `&travelmode=${modo}`;
}
const avviso = () => (msg ? `<div class="msg">${esc(msg)}</div>` : "");

/* ---------- giorni e «adesso» ---------- */
const orario = o => { const m = /^~?(\d{1,2}):(\d{2})/.exec(o || ""); return m ? +m[1] * 60 + +m[2] : null; };
function adessoInfo() {
  const d = TRIP.giorni[g], n = new Date();
  if (oggiIso(n) !== d.iso) return null;
  const min = n.getHours() * 60 + n.getMinutes();
  let cur = -1, next = -1;
  d.tappe.forEach((t, i) => { const o = orario(t.ora); if (o == null) return; if (o <= min) cur = i; else if (next < 0) next = i; });
  return { cur, next, min };
}
function aggiornaAdesso() {
  const box = $("#adesso"); if (!box) return;
  const a = adessoInfo(), d = TRIP.giorni[g];
  document.querySelectorAll(".tl li").forEach(li => li.classList.remove("in-corso", "prossima"));
  if (!a) { box.hidden = true; return; }
  const cur = d.tappe[a.cur], nxt = d.tappe[a.next];
  if (a.cur >= 0) $(`.tl li[data-i="${a.cur}"]`)?.classList.add("in-corso");
  if (a.next >= 0) $(`.tl li[data-i="${a.next}"]`)?.classList.add("prossima");
  let t = "";
  if (nxt) {
    const diff = orario(nxt.ora) - a.min, h = Math.floor(diff / 60), m = diff % 60;
    t = `<b>Prossima tappa</b>: ${esc(nxt.ora)} ${esc(nxt.nome)}, tra ${h ? h + " h " : ""}${m} min.`;
  } else if (cur) {
    const dopo = d.tappe.slice(a.cur + 1).find(x => orario(x.ora) == null);
    t = dopo ? `<b>Poi</b>: ${esc(dopo.nome)}, senza orario fisso.` : `<b>Ultima tappa del giorno</b>: ${esc(cur.nome)}.`;
  }
  if (box.dataset.t !== t) { box.dataset.t = t; box.innerHTML = t; }
  box.hidden = !t;
}

/* ---------- viste ---------- */
function vistaGiorni() {
  const d = TRIP.giorni[g], oggi = oggiNelViaggio() && giornoIniziale() === g;
  const chips = TRIP.giorni.map((x, i) => `<button class="chip${i === g ? " on" : ""}${i === g && oggi ? " oggi" : ""}" data-az="giorno" data-v="${i}" aria-pressed="${i === g}">${esc(x.breve)}<small>giorno ${i + 1}</small></button>`).join("");
  const tappe = d.tappe.map((t, i) => {
    const nk = `${g}-${i}`, nt = (S.note[nk] && S.note[nk].t) || "";
    return `<li data-i="${i}">${t.ora ? `<span class="ora">${esc(t.ora)}</span>` : ""}<div class="nome">${esc(t.nome)}</div>
    ${t.desc ? `<div class="desc">${esc(t.desc)}</div>` : ""}
    <div class="riga">${t.costo ? `<span class="pill">${esc(t.costo)}</span>` : ""}${t.q ? `<a class="map" target="_blank" rel="noopener" href="${mapsUrl([qt(t)], d.mezzo)}">Mappa<span class="vh"> di ${esc(t.nome)}</span></a>` : ""}</div>
    <details class="nota-t"${nt ? " open" : ""}><summary>${nt ? "Nota personale" : "Aggiungi nota"}</summary>
    <textarea rows="2" maxlength="500" data-chg="nota" data-v="${nk}" aria-label="Nota personale per ${esc(t.nome)}" placeholder="Solo sul tuo telefono">${esc(nt)}</textarea></details></li>`;
  }).join("");
  const percorso = mapsUrl(d.tappe.map(qt), d.mezzo);
  const pub = d.pub ? `<div class="card pub"><h3 style="margin-top:0">Pub</h3><div class="nome">${esc(d.pub.nome)}</div>
    <div class="desc">${esc(d.pub.dove)}</div><div class="desc" style="margin-top:6px">${esc(d.pub.alt)}</div>
    <div class="riga"><a class="map" target="_blank" rel="noopener" href="${mapsUrl([d.pub.q], d.mezzo)}">Mappa del pub</a></div></div>` : "";
  return `<div class="chips" role="group" aria-label="Giorni">${chips}</div>
    <div id="adesso" class="card adesso" hidden></div>
    <section class="hero"><span class="kan" aria-hidden="true">GIORNO ${g + 1}</span><h2>${esc(d.titolo)}</h2><p>${esc(d.data)}</p></section>
    <ol class="tl">${tappe}</ol>
    ${percorso ? `<p><a class="map pri" target="_blank" rel="noopener" href="${percorso}">Percorso del giorno su Google Maps</a></p>` : ""}
    ${pub}${d.nota ? `<div class="card nota"><div class="desc">${esc(d.nota)}</div></div>` : ""}`;
}

function vistaPrenot() {
  const r = S.riserv, cod = x => x ? `<div class="codice">${esc(x)}</div>` : `<div class="mute">Codice nel file riservato: importalo da «Altro».</div>`;
  const fatti = TRIP.promemoria.map(p => casella("p_" + p.id, p.t, p.d)).join("");
  return `<h2>Prenotazioni</h2>
    <div class="card"><div class="nome">Andata, Wizz Air W4 6747</div><div class="desc">Mer 23/12, 19:05 da Venezia Marco Polo, arrivo a Luton alle 20:25. Solo bagaglio a mano 40x30x20.</div>${cod(r && r.voli && r.voli.andata)}</div>
    <div class="card"><div class="nome">Ritorno, Ryanair FR 761</div><div class="desc">Dom 27/12, 20:55 da Luton, arrivo a Venezia alle 00:05 del 28/12. Carta d'imbarco solo sull'app.</div>${cod(r && r.voli && r.voli.ritorno)}</div>
    <div class="card"><div class="nome">Cena della vigilia, Idalia</div><div class="desc">Pillar Hall, 5 Olympia Way, London W14 0EY. Gio 24/12 alle 20:15, tavolo per 5. Tolleranza di 15 minuti.</div>
      ${r && r.idalia ? `<div class="codice">OpenTable n. ${esc(r.idalia.conferma)}</div><div class="mute">Nome: ${esc(r.idalia.nome)}</div>` : `<div class="mute">Conferma nel file riservato.</div>`}
      <div class="riga"><a class="map" target="_blank" rel="noopener" href="${mapsUrl(["Idalia, Pillar Hall, 5 Olympia Way, London W14 0EY"], "transit")}">Mappa</a></div></div>
    <div class="card"><div class="nome">Alloggio</div><div class="desc">Vicino a King's Cross.</div>
      ${casaQ() ? `<div class="codice" style="font-size:1rem;letter-spacing:0">${esc(casaQ())}</div><div class="riga"><a class="map" target="_blank" rel="noopener" href="${mapsUrl([casaQ()], "transit")}">Mappa dell'alloggio</a></div>` : `<div class="mute">Indirizzo nel file riservato: importalo da «Altro».</div>`}</div>
    ${r && r.bambina ? `<div class="card"><div class="nome">Gruppo</div><div class="desc">${esc(gruppo().join(", "))} e ${esc(r.bambina)} (4 anni).</div></div>` : ""}
    <h3>Da fare</h3><div class="card">${fatti}</div>
    <h3>Da verificare</h3><div class="card"><ul class="lista">${TRIP.daVerificare.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <h3>Info utili</h3><div class="card"><ul class="lista">${TRIP.info.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
}
function casella(id, t, d) {
  return `<label class="c${S.fatti[id] ? " fatto" : ""}"><input type="checkbox" data-chg="fatto" data-v="${id}"${S.fatti[id] ? " checked" : ""}><span><b>${esc(t)}</b>${d ? `<br><small class="mute">${esc(d)}</small>` : ""}</span></label>`;
}

/* idee */
const voti = i => Object.values(i.voti || {}).filter(v => v && v[0] === 1).length;
const votato = i => !!(S.me && i.voti && i.voti[S.me] && i.voti[S.me][0] === 1);
function formIdea(x = {}) {
  const mod = !!x.id;
  return `<form class="f" data-form="idea"><input type="hidden" name="id" value="${esc(x.id || "")}">
    <label class="mute" for="i-testo">Idea</label><input type="text" id="i-testo" name="testo" placeholder="Es. Natural History Museum" required maxlength="200" value="${esc(x.testo || "")}">
    <label class="mute" for="i-link">Link (facoltativo)</label><input type="text" id="i-link" name="link" inputmode="url" autocapitalize="none" placeholder="TikTok, Instagram, sito web" value="${esc(x.link || "")}">
    <label class="mute" for="i-nota">Nome del posto o nota (facoltativa)</label><input type="text" id="i-nota" name="nota" maxlength="200" value="${esc(x.nota || "")}">
    <label class="mute" for="i-giorno">Giorno</label><select id="i-giorno" name="giorno"><option value="0">Qualsiasi giorno</option>${TRIP.giorni.map((d, i) => `<option value="${i + 1}"${+x.giorno === i + 1 ? " selected" : ""}>Giorno ${i + 1}, ${esc(d.breve)}</option>`).join("")}</select>
    <div class="riga"><button class="btn pri" type="submit">${mod ? "Salva modifica" : "Aggiungi idea"}</button>${mod || bozza ? `<button type="button" class="btn" data-az="annulla">Annulla</button>` : ""}</div></form>`;
}
function vistaIdee() {
  const ps = gruppo();
  const filtri = [["", "Tutte"], ...TRIP.giorni.map((d, i) => [String(i + 1), "Giorno " + (i + 1)]), ["0", "Senza giorno"]]
    .map(([v, l]) => `<button class="chip piccolo${(filtroG ?? "") === v ? " on" : ""}" data-az="filtro" data-v="${v}" aria-pressed="${(filtroG ?? "") === v}">${l}</button>`).join("");
  const lista = vivi(S.idee).filter(i => filtroG == null || +i.giorno === +filtroG).sort((a, b) => b.ts - a.ts).map(i => {
    const l = normLink(i.link), h = host(l);
    return `<div class="card"><div class="nome">${esc(i.testo)}</div>
    ${i.nota ? `<div class="desc">${esc(i.nota)}</div>` : ""}
    ${l ? `<div class="riga"><a class="map" target="_blank" rel="noopener noreferrer" href="${esc(l)}">Apri link<span class="vh"> di ${esc(i.testo)}</span> · ${esc(h)}</a></div>` : ""}
    <div class="desc">${esc(i.autore || "senza nome")}${+i.giorno ? ` · giorno ${+i.giorno}` : ""}</div>
    <div class="riga"><button class="stato s${i.stato}" data-az="stato" data-v="${esc(i.id)}" aria-label="Stato: ${STATI[i.stato]}. Tocca per cambiare">${STATI[i.stato]}</button>
    <button class="stato voto${votato(i) ? " s1" : ""}" data-az="voto" data-v="${esc(i.id)}" aria-pressed="${votato(i)}" aria-label="Mi piace, ${voti(i)} voti">👍 ${voti(i)}</button>
    <button class="btn" data-az="modIdea" data-v="${esc(i.id)}">Modifica<span class="vh"> ${esc(i.testo)}</span></button>
    <button class="btn tondo rosso" data-az="delIdea" data-v="${esc(i.id)}" aria-label="Elimina ${esc(i.testo)}">✕</button></div></div>`;
  }).join("");
  const ed = edit && edit.k === "idee" ? S.idee.find(x => x.id === edit.id && !x.del) : null;
  return `<h2>Idee</h2>${avviso()}
    <p class="mute">Aggiungi idee e link: poi le mandi da «Altro» e vengono unite alle altre.</p>
    ${S.me ? "" : `<div class="card"><label class="mute" for="chisei">Chi sei? Serve per firmare idee e voti.</label>
    <select id="chisei" data-chg="me"><option value="">Scegli il tuo nome</option>${ps.map(p => `<option>${esc(p)}</option>`).join("")}</select></div>`}
    <details class="card nuova"${ed || bozza ? " open" : ""}><summary>+ Nuova idea</summary>${formIdea(ed || bozza || {})}</details>
    <div class="chips avvolgi" role="group" aria-label="Filtra per giorno">${filtri}</div>
    ${lista || `<div class="vuoto">Nessuna idea${filtroG != null ? " per questo filtro" : " ancora"}.</div>`}`;
}

/* spese */
function saldi() {
  const ps = gruppo(), b = Object.fromEntries(ps.map(p => [p, 0]));
  let tot = 0;
  vivi(S.spese).forEach(s => {
    const parti = s.tra && s.tra.length ? s.tra : ps;
    tot += s.importo; b[s.chi] = (b[s.chi] ?? 0) + s.importo;
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
  return { tot, pag };
}
const inEur = n => (S.cambio > 0 ? ` (circa ${eur(n * S.cambio)})` : "");
function formSpesa(x = {}) {
  const ps = gruppo(), mod = !!x.id, tra = x.tra && x.tra.length ? x.tra : ps;
  return `<form class="f" data-form="spesa"><input type="hidden" name="id" value="${esc(x.id || "")}">
    <label class="mute" for="s-desc">Descrizione</label><input type="text" id="s-desc" name="desc" required maxlength="80" value="${esc(x.desc || "")}">
    <label class="mute" for="s-importo">Importo in sterline</label><input type="number" id="s-importo" name="importo" step="0.01" min="0.01" inputmode="decimal" required value="${x.importo || ""}">
    <label class="mute" for="s-chi">Pagato da</label><select id="s-chi" name="chi" required><option value="">Scegli chi ha pagato</option>${ps.map(p => `<option${p === (x.chi || S.me) ? " selected" : ""}>${esc(p)}</option>`).join("")}</select>
    <fieldset class="chk"><legend class="mute">Diviso tra</legend>${ps.map(p => `<label><input type="checkbox" name="tra" value="${esc(p)}"${tra.includes(p) ? " checked" : ""}>${esc(p)}</label>`).join("")}</fieldset>
    <div class="riga"><button class="btn pri" type="submit">${mod ? "Salva modifica" : "Aggiungi spesa"}</button>${mod ? `<button type="button" class="btn" data-az="annulla">Annulla</button>` : ""}</div></form>`;
}
function vistaSpese() {
  const { tot, pag } = saldi();
  const lista = vivi(S.spese).sort((a, b) => b.ts - a.ts).map(s => `<div class="card"><div class="nome">${esc(s.desc)} · ${gbp(s.importo)}</div>
    <div class="desc">Pagato da ${esc(s.chi)}, diviso tra ${s.tra && s.tra.length ? esc(s.tra.join(", ")) : "tutti"}${inEur(s.importo)}</div>
    <div class="riga"><button class="btn" data-az="modSpesa" data-v="${esc(s.id)}">Modifica<span class="vh"> ${esc(s.desc)}</span></button>
    <button class="btn tondo rosso" data-az="delSpesa" data-v="${esc(s.id)}" aria-label="Elimina ${esc(s.desc)}">✕</button></div></div>`).join("");
  const ed = edit && edit.k === "spese" ? S.spese.find(x => x.id === edit.id && !x.del) : null;
  const noti = new Set(gruppo());
  const ignoti = [...new Set(vivi(S.spese).flatMap(s => [s.chi, ...(s.tra || [])]).filter(p => p && !noti.has(p)))];
  return `<h2>Spese</h2>${avviso()}
    ${ignoti.length ? `<div class="msg" style="border-color:var(--oro);color:var(--oro);background:rgba(255,211,110,.12)">Alcune spese hanno nomi non presenti nel gruppo (${esc(ignoti.join(", "))}). Modificale per correggere i saldi.</div>` : ""}
    <div class="card"><div class="mute">Totale speso</div><div class="tot">${gbp(tot)}</div>${S.cambio > 0 ? `<div class="mute">${inEur(tot).trim().slice(1, -1)}</div>` : ""}
    ${pag.length ? `<ul class="lista" style="margin-top:8px">${pag.map(([da, a, m]) => `<li><b>${esc(da)}</b> deve ${gbp(m)}${inEur(m)} a <b>${esc(a)}</b></li>`).join("")}</ul>` : `<div class="mute">Nessun saldo da pareggiare.</div>`}
    <div class="riga"><button class="btn" data-az="copiaSpese">Copia riepilogo</button></div></div>
    <div class="card"><label class="mute" for="cambio">Cambio: 1 sterlina vale quanti euro? Inseriscilo tu, controllando il cambio del giorno.</label>
    <input type="number" id="cambio" data-chg="cambio" step="0.001" min="0" inputmode="decimal" placeholder="Es. il valore di oggi" value="${S.cambio > 0 ? S.cambio : ""}"></div>
    <details class="card nuova"${ed ? " open" : ""}><summary>+ Nuova spesa</summary>${formSpesa(ed || {})}</details>
    ${lista || `<div class="vuoto">Ancora nessuna spesa.</div>`}`;
}

/* altro: scambio, valigia, frasi */
function vistaAltro() {
  const seg = [["scambio", "Scambio"], ["valigia", "Valigia"], ["cambio", "Cambio"], ["frasi", "Frasi"]]
    .map(([v, l]) => `<button class="chip piccolo${sub === v ? " on" : ""}" data-az="sub" data-v="${v}" aria-pressed="${sub === v}">${l}</button>`).join("");
  let corpo = "";
  if (sub === "valigia") {
    corpo = vistaValigia();
  } else if (sub === "cambio") {
    corpo = vistaCambio();
  } else if (sub === "frasi") {
    corpo = `<div class="card">${TRIP.frasi.map(([it, en]) => `<div class="frase"><div class="mute">${esc(it)}</div><div class="nome" lang="en-GB">${esc(en)}</div></div>`).join("")}</div>
      <h3>Numeri utili nel Regno Unito</h3><div class="card">${TRIP.emergenze.map(e => `<div class="frase"><a class="map" href="tel:${e.n}">Chiama ${e.n}</a><div class="desc">${esc(e.t)}</div></div>`).join("")}</div>
      <p class="mute">Ambasciata e consolato d'Italia: cerca i recapiti aggiornati su dovesiamonelmondo.esteri.it.</p>`;
  } else corpo = vistaScambio();
  return `<h2>Altro</h2>${avviso()}<div class="chips avvolgi" role="group" aria-label="Sezione di Altro">${seg}</div>${corpo}`;
}
/* valigia per persona e profilo */
const persone = () => [...gruppo(), (S.riserv && S.riserv.bambina) || "Bambina"];
const profiloDi = p => (p === persone()[persone().length - 1] ? "bambina" : (S.profili[p] || ""));
const testoD = (d, g, n) => (typeof d === "function" ? d(g, n) : d || "");
function vistaValigia() {
  const ps = persone(), gg = TRIP.giorni.length, nn = gg - 1;
  if (!ps.includes(S.valP)) S.valP = "";
  const chips = ps.map(p => `<button class="chip piccolo${p === S.valP ? " on" : ""}" data-az="valP" data-v="${esc(p)}" aria-pressed="${p === S.valP}">${esc(p)}</button>`).join("");
  const testa = `<div class="card"><div class="nome">Valigia per ${gg} giorni e ${nn} notti</div>
    <div class="desc">A dicembre a Londra di solito fa freddo e piove: vestiti a strati. Bagaglio a mano 40x30x20, quindi le cose più ingombranti si indossano in aereo.</div>
    <div class="chips avvolgi" role="group" aria-label="Chi sei">${chips}</div></div>`;
  if (!S.valP) return testa + `<div class="vuoto">Scegli il tuo nome per vedere la tua lista.</div>`;
  const pr = profiloDi(S.valP);
  if (!pr) return testa + `<div class="card"><div class="nome">Che lista vuoi?</div><div class="riga">${["uomo", "donna"].map(k => `<button class="btn pri" data-az="profilo" data-v="${k}">${TRIP.profili[k]}</button>`).join("")}</div></div>`;
  const mia = (S.val[S.valP] = S.val[S.valP] && typeof S.val[S.valP] === "object" ? S.val[S.valP] : {});
  const voci = TRIP.valigia.filter(v => v.per.includes(pr));
  const fatte = voci.filter(v => mia[v.id]).length;
  const cat = [...new Set(voci.map(v => v.cat))].map(c => `<h3>${esc(c)}</h3><div class="card">${voci.filter(v => v.cat === c).map(v => {
    const q = v.q ? v.q(gg, nn) : 0, d = testoD(v.d, gg, nn);
    return `<label class="c${mia[v.id] ? " fatto" : ""}"><input type="checkbox" data-chg="spuntaV" data-v="${v.id}"${mia[v.id] ? " checked" : ""}><span><b>${q > 1 ? `${q} × ` : ""}${esc(v.t)}</b>${d ? `<br><small class="mute">${esc(d)}</small>` : ""}</span></label>`;
  }).join("")}</div>`).join("");
  return `${testa}<div class="card"><div class="nome">${esc(S.valP)}: ${TRIP.profili[pr]}</div>
    <div class="desc">${fatte} su ${voci.length} cose preparate</div><progress max="${voci.length}" value="${fatte}" aria-label="Avanzamento valigia"></progress>
    <div class="riga">${pr !== "bambina" ? `<button class="btn" data-az="profilo" data-v="">Cambia lista</button>` : ""}<button class="btn rosso" data-az="azzeraV">Azzera le spunte</button></div></div>${cat}`;
}

/* cambio valuta, anche senza rete: usa l'ultimo cambio salvato */
const quando = ms => new Date(ms).toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
function vistaCambio() {
  const c = S.cambio, ok = c > 0;
  const gbpList = [1, 5, 10, 20, 50, 100], eurList = [10, 20, 50, 100];
  return `<div class="card"><div class="nome">Cambio sterline ed euro</div>
    <div class="desc">Funziona anche senza rete: usa l'ultimo cambio salvato nel telefono. Quello della carta o dei cambiavalute può essere diverso.</div>
    <label class="mute" for="c-gbp">Sterline (£)</label><input type="number" id="c-gbp" data-conv="gbp" inputmode="decimal" step="0.01" min="0" placeholder="0,00"${ok ? "" : " disabled"}>
    <label class="mute" for="c-eur">Euro (€)</label><input type="number" id="c-eur" data-conv="eur" inputmode="decimal" step="0.01" min="0" placeholder="0,00"${ok ? "" : " disabled"}>
    ${ok ? "" : `<div class="mute">Imposta il cambio qui sotto oppure aggiornalo online.</div>`}</div>
    <div class="card"><label class="mute" for="cambio">Cambio: 1 sterlina vale quanti euro?</label>
    <input type="number" id="cambio" data-chg="cambio" step="0.0001" min="0" inputmode="decimal" placeholder="Es. 1,19" value="${ok ? c : ""}">
    <div class="desc">${S.cambioQ ? `Ultimo aggiornamento online: ${esc(quando(S.cambioQ))}${S.cambioData ? `, dati del ${esc(S.cambioData)}` : ""}.` : ok ? "Inserito a mano." : "Non ancora impostato."}</div>
    <div class="riga"><button class="btn pri" data-az="cambioOnline">Aggiorna cambio (serve rete)</button></div></div>
    ${ok ? `<div class="card"><div class="nome">Tabella rapida</div>
    <div class="tabella"><div><b>Sterline</b>${gbpList.map(x => `<div>£${x} = ${eur(x * c)}</div>`).join("")}</div>
    <div><b>Euro</b>${eurList.map(x => `<div>€${x} = ${gbp(x / c)}</div>`).join("")}</div></div></div>` : ""}`;
}

function vistaScambio() {
  const ps = gruppo();
  return `<div class="card"><div class="nome">Chi sei?</div>
    <select data-chg="me" aria-label="Chi sei"><option value="">Scegli il tuo nome</option>${ps.map(p => `<option${p === S.me ? " selected" : ""}>${esc(p)}</option>`).join("")}</select></div>
    <div class="card"><div class="nome">Invia le tue idee e spese</div>
    <div class="desc">Il modo più semplice: manda il messaggio su WhatsApp. Chi lo riceve lo incolla qui sotto.</div>
    <div class="riga"><button class="btn pri" data-az="whatsapp">Invia su WhatsApp</button><button class="btn" data-az="copiaCodice">Copia testo</button></div>
    <div class="desc" style="margin-top:8px">In alternativa un file:</div>
    <div class="riga"><button class="btn" data-az="condividi">Condividi file</button><button class="btn" data-az="scarica">Scarica</button></div></div>
    <div class="card"><div class="nome">Ricevi idee e spese</div>
    <div class="desc">Incolla il messaggio ricevuto, oppure scegli un file. Si uniscono senza duplicati. Vale anche per i dati riservati.</div>
    <textarea id="incolla" rows="3" placeholder="Incolla qui il messaggio" aria-label="Messaggio ricevuto"></textarea>
    <div class="riga"><button class="btn pri" data-az="importaTesto">Importa testo</button></div>
    <div class="riga"><input type="file" id="file" accept="application/json,.json" multiple data-chg="importa" aria-label="Scegli un file da importare"></div></div>
    <div class="card"><div class="nome">Dati riservati</div>
    <div class="desc">${S.riserv ? "Importati: codici e nomi sono visibili in «Prenota»." : "Non importati."}</div>
    ${S.riserv ? `<div class="riga"><button class="btn rosso" data-az="togliRiserv">Rimuovi dal telefono</button></div>` : ""}</div>
    <div class="card"><div class="nome">Neve</div><div class="desc">Animazione decorativa di sfondo.</div>
    <div class="riga"><button class="btn" data-az="neve" aria-pressed="${S.neve !== false}">${S.neve !== false ? "Neve attiva: tocca per fermarla" : "Neve ferma: tocca per attivarla"}</button></div></div>
    <p class="mute">Idee e spese: ${vivi(S.idee).length} e ${vivi(S.spese).length}, salvate solo su questo telefono.</p>`;
}

const viste = { giorni: vistaGiorni, prenot: vistaPrenot, idee: vistaIdee, spese: vistaSpese, altro: vistaAltro };
const di = t => { const r = $("#annuncio"); if (!r) return; r.textContent = ""; setTimeout(() => { r.textContent = t; }, 60); };
let annunciato = "";
function focaTitolo() { const h = $("#vista h2"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
function render() {
  const a = document.activeElement;
  const sel = a && a.dataset && a.dataset.az ? `[data-az="${a.dataset.az}"][data-v="${a.dataset.v}"]`
    : a && a.dataset && a.dataset.chg ? `[data-chg="${a.dataset.chg}"][data-v="${a.dataset.v}"]` : null;
  try { $("#vista").innerHTML = viste[tab](); } catch {
    $("#vista").innerHTML = `<div class="card"><h2>Dati non leggibili</h2><div class="desc">Qualcosa nei dati salvati su questo telefono blocca la pagina.</div><div class="riga"><button class="btn rosso" data-az="reset">Azzera i dati locali</button></div></div>`;
  }
  if (sel) { try { const el = $(sel); if (el) el.focus({ preventScroll: true }); } catch { /* selettore non valido */ } }
  if (msg && msg !== annunciato) { annunciato = msg; di(msg); } else if (!msg) annunciato = "";
  document.querySelectorAll(".tab button").forEach(b => { const on = b.dataset.t === tab; b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  const gg = Math.ceil((new Date(TRIP.partenza) - new Date()) / 864e5);
  $("#conto").innerHTML = gg > 0 ? `<b>${gg}</b><span>giorni</span>` : `<b>🎄</b><span>buon viaggio</span>`;
  aggiornaAdesso();
}

/* ---------- scambio dati ---------- */
const recente = x => !x.del || x.ts > Date.now() - 30 * 864e5;
const pacchetto = () => ({ app: "londra-in-tasca", v: 2, autore: S.me, esportato: Date.now(), idee: S.idee.filter(recente), spese: S.spese.filter(recente) });
function nomeFile() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `londra-${(S.me || "anon").replace(/[^\w-]/g, "")}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
}
const fileDati = () => new File([JSON.stringify(pacchetto(), null, 1)], nomeFile(), { type: "application/json" });
const aB64 = s => { let r = ""; new TextEncoder().encode(s).forEach(x => { r += String.fromCharCode(x); }); return btoa(r); };
const daB64 = s => new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
const messaggio = () => `Londra in tasca: le mie idee e spese. Incollalo in Altro, Scambio.\nLIT1:${aB64(JSON.stringify(pacchetto()))}`;

const ID_OK = /^[A-Za-z0-9_-]{1,40}$/;
const tsOk = v => { const n = +v; return Number.isFinite(n) ? Math.min(Math.max(n, 0), Date.now() + 864e5) : 0; };
const str = (v, n) => String(v ?? "").slice(0, n);
const nomi = a => (Array.isArray(a) ? a.filter(p => typeof p === "string" && p.trim()).map(p => p.slice(0, 40)).slice(0, 12) : []);
const unisciVoti = (a, b) => {
  const o = {};
  for (const src of [a, b]) for (const n of Object.keys(src || {})) {
    if (n === "__proto__" || n.length > 40) continue;
    const v = src[n]; if (!Array.isArray(v)) continue;
    const w = [v[0] === 1 ? 1 : 0, tsOk(v[1])];
    if (!Object.prototype.hasOwnProperty.call(o, n) || w[1] > o[n][1]) o[n] = w;
  }
  return o;
};
function unisci(k, x) {
  if (!x || typeof x.id !== "string" || !ID_OK.test(x.id)) return false;
  const y = { id: x.id, ts: tsOk(x.ts), del: x.del === true };
  if (k === "spese") {
    const imp = Number(x.importo); if (!Number.isFinite(imp) || imp <= 0 || imp > 1e6) return false;
    Object.assign(y, { desc: str(x.desc, 80), importo: imp, chi: str(x.chi, 40), tra: nomi(x.tra) });
  } else {
    Object.assign(y, { testo: str(x.testo, 200), link: normLink(x.link), nota: str(x.nota, 200), giorno: [0, 1, 2, 3, 4, 5].includes(+x.giorno) ? +x.giorno : 0,
      stato: [0, 1, 2, 3].includes(+x.stato) ? +x.stato : 0, autore: str(x.autore, 40), voti: unisciVoti({}, x.voti) });
  }
  const i = S[k].findIndex(z => z.id === y.id);
  if (i < 0) { S[k].push(y); return true; }
  const l = S[k][i];
  if (y.ts > (l.ts || 0)) { if (k === "idee") y.voti = unisciVoti(l.voti, y.voti); S[k][i] = y; return true; }
  if (k === "idee") { const v = unisciVoti(l.voti, y.voti); if (JSON.stringify(v) !== JSON.stringify(l.voti || {})) { l.voti = v; return true; } }
  return false;
}
function pulisciRiserv(j) {
  const s = (v, n = 60) => (typeof v === "string" ? v.slice(0, n) : "");
  const o = { riservati: true };
  const g = nomi(j.gruppo); if (g.length) o.gruppo = g;
  if (typeof j.bambina === "string") o.bambina = s(j.bambina);
  if (j.voli && typeof j.voli === "object") o.voli = { andata: s(j.voli.andata, 20), ritorno: s(j.voli.ritorno, 20) };
  if (j.idalia && typeof j.idalia === "object") o.idalia = { conferma: s(j.idalia.conferma, 20), nome: s(j.idalia.nome) };
  if (j.alloggio && typeof j.alloggio === "object") o.alloggio = { indirizzo: s(j.alloggio.indirizzo, 120) };
  return o;
}
function applica(j, n) {
  if (j && j.riservati) { S.riserv = pulisciRiserv(j); n.riserv = true; return true; }
  if (!j || j.app !== "londra-in-tasca") return false;
  for (const k of ["idee", "spese"]) for (const x of (j[k] || [])) if (unisci(k, x)) n[k]++;
  return true;
}
function esito(n, err) {
  salva();
  msg = `Importato: ${n.idee} idee, ${n.spese} spese${n.riserv ? ", dati riservati" : ""}${err ? `. Non validi: ${err}` : ""}.`;
  render();
}
async function importaFile(files) {
  const n = { idee: 0, spese: 0, riserv: false }; let err = 0;
  for (const f of files) { try { if (!applica(JSON.parse(await f.text()), n)) err++; } catch { err++; } }
  esito(n, err);
}
function importaTesto(t) {
  const n = { idee: 0, spese: 0, riserv: false }; let err = 0;
  const m = /LIT1:([A-Za-z0-9+/=]+)/.exec(t);
  try { if (!applica(JSON.parse(m ? daB64(m[1]) : t), n)) err++; } catch { err++; }
  esito(n, err);
}
async function copia(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    const a = document.createElement("textarea"); a.value = t; a.readOnly = true; a.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.append(a);
    a.select(); a.setSelectionRange(0, 1e7);
    let ok = false; try { ok = document.execCommand("copy"); } catch { /* non disponibile */ } a.remove(); return ok;
  }
}
function riepilogoSpese() {
  const { tot, pag } = saldi();
  return [`Spese del viaggio a Londra`, `Totale: ${gbp(tot)}${inEur(tot)}`, ...vivi(S.spese).map(s => `- ${s.desc}: ${gbp(s.importo)}, pagato da ${s.chi}`), pag.length ? "Saldi:" : "Nessun saldo da pareggiare.", ...pag.map(([da, a, m]) => `- ${da} deve ${gbp(m)}${inEur(m)} a ${a}`)].join("\n");
}
function toast(testo, azione) {
  const t = $("#toast"); t.textContent = testo; t.hidden = false; di(testo); t.onclick = () => { t.hidden = true; if (azione) azione(); };
}

/* ---------- azioni ---------- */
const trova = (k, id) => S[k].find(x => x.id === id && !x.del);
const azioni = {
  tab(v) { tab = v; msg = ""; edit = null; bozza = null; scrollTo(0, 0); render(); focaTitolo(); },
  giorno(v) { g = +v; render(); },
  sub(v) { sub = v; msg = ""; render(); },
  filtro(v) { filtroG = v === "" ? null : v; render(); },
  stato(v) { const i = trova("idee", v); if (i) { i.stato = (i.stato + 1) % 4; i.ts = Date.now(); salva(); render(); } },
  voto(v) {
    const i = trova("idee", v); if (!i) return;
    if (!S.me) { msg = "Scegli prima il tuo nome, in alto nella pagina."; render(); return; }
    i.voti = i.voti || {}; i.voti[S.me] = [votato(i) ? 0 : 1, Date.now()]; salva(); render();
  },
  modIdea(v) { edit = { k: "idee", id: v }; bozza = null; scrollTo(0, 0); render(); },
  modSpesa(v) { edit = { k: "spese", id: v }; scrollTo(0, 0); render(); },
  annulla() { edit = null; bozza = null; render(); },
  delIdea(v) { const i = trova("idee", v); if (i && confirm("Eliminare l'idea?")) { i.del = true; i.ts = Date.now(); salva(); render(); focaTitolo(); } },
  delSpesa(v) { const s = trova("spese", v); if (s && confirm("Eliminare la spesa?")) { s.del = true; s.ts = Date.now(); salva(); render(); focaTitolo(); } },
  fatto(v) { S.fatti[v] = !S.fatti[v]; salva(); render(); },
  nota(_, el) { const k = el.dataset.v, t = el.value.trim(); if (t) S.note[k] = { t, ts: Date.now() }; else delete S.note[k]; salva(); },
  cambio(_, el) { const n = Number(String(el.value).replace(",", ".")); S.cambio = n > 0 ? n : 0; S.cambioQ = 0; S.cambioData = ""; salva(); render(); },
  me(v) { S.me = v; salva(); msg = ""; render(); },
  valP(v) { S.valP = v; salva(); render(); },
  profilo(v) { if (S.valP) { if (v) S.profili[S.valP] = v; else delete S.profili[S.valP]; salva(); render(); } },
  spuntaV(v) { if (!S.valP) return; const m = (S.val[S.valP] = S.val[S.valP] || {}); m[v] = !m[v]; salva(); render(); },
  azzeraV() { if (S.valP && confirm("Azzerare tutte le spunte della lista di " + S.valP + "?")) { S.val[S.valP] = {}; salva(); render(); } },
  async cambioOnline() {
    try {
      const r = await fetch("https://api.frankfurter.dev/v1/latest?base=GBP&symbols=EUR", { cache: "no-store" });
      const j = await r.json(), v = Number(j && j.rates && j.rates.EUR);
      if (!(v > 0)) throw new Error("risposta non valida");
      S.cambio = v; S.cambioQ = Date.now(); S.cambioData = String(j.date || "").slice(0, 10); salva();
      msg = `Cambio aggiornato: 1 £ vale ${String(v).replace(".", ",")} €.`;
    } catch { msg = "Nessuna rete o servizio non raggiungibile: resta l'ultimo cambio salvato."; }
    render();
  },
  reset() { if (confirm("Cancellare idee, spese, note e dati riservati da questo telefono?")) { try { localStorage.removeItem(CH); } catch { /* ok */ } S = vuoto(); msg = ""; render(); } },
  neve() { S.neve = S.neve === false; salva(); const c = $("#neve"); if (c) c.hidden = S.neve === false; render(); },
  importa(_, el) { importaFile([...el.files]); },
  importaTesto() { const t = $("#incolla").value.trim(); if (!t) { msg = "Incolla prima il messaggio ricevuto."; render(); return; } importaTesto(t); },
  togliRiserv() { if (confirm("Rimuovere i dati riservati da questo telefono?")) { S.riserv = null; salva(); render(); } },
  async copiaCodice() { msg = (await copia(messaggio())) ? "Testo copiato: incollalo in un messaggio." : "Copia non riuscita, usa «Condividi file»."; render(); },
  async copiaSpese() { msg = (await copia(riepilogoSpese())) ? "Riepilogo copiato." : "Copia non riuscita."; render(); },
  async whatsapp() {
    const t = messaggio();
    const url = "https://wa.me/?text=" + encodeURIComponent(t);
    if (url.length > 3500) { msg = (await copia(t)) ? "Messaggio lungo, copiato: aprilo in WhatsApp e incolla." : "Messaggio troppo lungo: usa «Condividi file»."; render(); return; }
    window.open(url, "_blank", "noopener");
  },
  scarica() {
    if (navigator.standalone === true) { msg = "Su iPhone usa «Invia su WhatsApp» o «Copia testo»."; render(); return; }
    const f = fileDati(), a = document.createElement("a");
    a.href = URL.createObjectURL(f); a.download = f.name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
  async condividi() {
    const f = fileDati();
    try {
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: "Londra in tasca" });
      else azioni.scarica();
    } catch (e) { if (!e || e.name !== "AbortError") { msg = "Condivisione non riuscita: usa «Invia su WhatsApp» o «Copia testo»."; render(); } }
  }
};
const moduli = {
  idea(d) {
    const testo = String(d.get("testo") || "").trim(); if (!testo) return;
    const id = d.get("id"), campi = { testo, link: normLink(d.get("link")), nota: String(d.get("nota") || "").trim(), giorno: +d.get("giorno") || 0 };
    const x = id && trova("idee", id);
    if (x) Object.assign(x, campi, { ts: Date.now() });
    else S.idee.push(Object.assign({ id: uid(), stato: 0, voti: {}, autore: S.me }, campi, { ts: Date.now() }));
    edit = null; bozza = null; msg = ""; salva(); render();
  },
  spesa(d) {
    const importo = Number(String(d.get("importo")).replace(",", ".")), desc = String(d.get("desc") || "").trim();
    if (!(importo > 0) || !desc) return;
    const id = d.get("id"), campi = { desc, importo, chi: d.get("chi"), tra: d.getAll("tra") }, x = id && trova("spese", id);
    if (x) Object.assign(x, campi, { ts: Date.now() }); else S.spese.push(Object.assign({ id: uid() }, campi, { ts: Date.now() }));
    edit = null; salva(); render();
  }
};
document.addEventListener("click", e => { const t = e.target.closest("[data-az]"); if (t) azioni[t.dataset.az](t.dataset.v, t); });
document.addEventListener("change", e => {
  const t = e.target.closest("[data-chg]"); if (!t) return;
  azioni[t.dataset.chg](t.type === "file" ? "" : (t.type === "checkbox" || t.tagName === "TEXTAREA" ? t.dataset.v : t.value), t);
});
document.addEventListener("input", e => {
  const t = e.target.closest("[data-conv]"); if (!t || !(S.cambio > 0)) return;
  const altro = $(t.dataset.conv === "gbp" ? "#c-eur" : "#c-gbp"), v = Number(String(t.value).replace(",", "."));
  if (!altro) return;
  altro.value = Number.isFinite(v) && t.value !== "" ? (Math.round((t.dataset.conv === "gbp" ? v * S.cambio : v / S.cambio) * 100) / 100).toFixed(2) : "";
});
document.addEventListener("submit", e => { const f = e.target.closest("form[data-form]"); if (f) { e.preventDefault(); moduli[f.dataset.form](new FormData(f), f); } });

/* ---------- condivisione da altre app (Android), offline, aggiornamenti, neve ---------- */
(function daCondivisione() {
  const p = new URLSearchParams(location.search);
  if (!(p.has("url") || p.has("text") || p.has("title"))) return;
  const link = primoLink([p.get("url"), p.get("text")].filter(Boolean).join(" "));
  const testo = (p.get("title") || p.get("text") || "").replace(link, "").trim().slice(0, 200);
  bozza = { testo, link, nota: "" }; tab = "idee"; msg = "Idea precompilata dalla condivisione: controlla e premi «Aggiungi idea».";
  try { history.replaceState(null, "", location.pathname); } catch { /* ok */ }
})();

if ("serviceWorker" in navigator) {
  const aveva = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (aveva) toast("App aggiornata. Tocca per ricaricare.", () => location.reload()); });
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").then(r => {
    r.update().catch(() => {});
    document.addEventListener("visibilitychange", () => { if (!document.hidden) r.update().catch(() => {}); });
  }).catch(() => {}));
}

(function neve() {
  const c = $("#neve"); if (!c) return;
  const rid = matchMedia("(prefers-reduced-motion: reduce)");
  const spenta = () => rid.matches || S.neve === false;
  c.hidden = spenta();
  rid.addEventListener("change", () => { c.hidden = spenta(); });
  const x = c.getContext("2d"); let w, h; const fi = [];
  const mis = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
  mis(); addEventListener("resize", mis);
  for (let i = 0; i < 55; i++) fi.push({ x: Math.random() * 3000, y: Math.random() * 2000, r: 1 + Math.random() * 2.6, v: 0.25 + Math.random() * 0.7, o: Math.random() * 6 });
  let t = 0;
  (function giro() {
    if (!document.hidden && !spenta()) {
      x.clearRect(0, 0, w, h); t += 0.01;
      fi.forEach(f => {
        f.y += f.v; f.x += Math.sin(t + f.o) * 0.35;
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
        x.beginPath(); x.arc(f.x % w, f.y, f.r, 0, 6.3); x.fillStyle = f.r > 2.2 ? "rgba(255,190,220,.75)" : "rgba(255,255,255,.7)"; x.fill();
      });
    }
    requestAnimationFrame(giro);
  })();
})();

render();
setInterval(() => { if (tab === "giorni") aggiornaAdesso(); }, 30000);
