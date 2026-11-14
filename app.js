"use strict";
/* Londra in tasca: PWA senza librerie. Dati del viaggio in dati.js, idee e spese nel telefono (localStorage). */
const CH = "lit-v1";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const gbp = n => "£" + (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
const vivi = a => a.filter(x => !x.del);
const STATI = ["da valutare", "sì", "no", "fatta"];

const vuoto = () => ({ me: "", idee: [], spese: [], fatti: {}, riserv: null });
let S = carica();
function carica() { try { return Object.assign(vuoto(), JSON.parse(localStorage.getItem(CH) || "{}")); } catch { return vuoto(); } }
function salva() { try { localStorage.setItem(CH, JSON.stringify(S)); } catch { /* memoria non disponibile */ } }
const gruppo = () => (S.riserv && S.riserv.gruppo && S.riserv.gruppo.length ? S.riserv.gruppo : TRIP.gruppoDefault);

let tab = "giorni", g = giornoIniziale(), msg = "";
function giornoIniziale() {
  const o = new Date(), iso = `${o.getFullYear()}-${String(o.getMonth() + 1).padStart(2, "0")}-${String(o.getDate()).padStart(2, "0")}`;
  const i = TRIP.giorni.findIndex(d => d.iso === iso);
  return i < 0 ? 0 : i;
}

/* ---------- Google Maps ---------- */
const luogo = x => encodeURIComponent(/Luton/.test(x) ? x : x + ", London");
function mapsUrl(qs, modo) {
  const q = qs.filter(Boolean);
  if (!q.length) return "";
  if (q.length === 1) return "https://www.google.com/maps/search/?api=1&query=" + luogo(q[0]);
  return `https://www.google.com/maps/dir/?api=1&origin=${luogo(q[0])}&destination=${luogo(q[q.length - 1])}` +
    (q.length > 2 ? `&waypoints=${q.slice(1, -1).map(luogo).join("%7C")}` : "") + `&travelmode=${modo}`;
}

/* ---------- viste ---------- */
function vistaGiorni() {
  const d = TRIP.giorni[g], oggi = oggiNelViaggio() && giornoIniziale() === g;
  const chips = TRIP.giorni.map((x, i) => `<button class="chip${i === g ? " on" : ""}${i === g && oggi ? " oggi" : ""}" data-az="giorno" data-v="${i}">${esc(x.breve)}<small>giorno ${i + 1}</small></button>`).join("");
  const tappe = d.tappe.map(t => `<li>${t.ora ? `<span class="ora">${esc(t.ora)}</span>` : ""}<div class="nome">${esc(t.nome)}</div>
    ${t.desc ? `<div class="desc">${esc(t.desc)}</div>` : ""}
    <div class="riga">${t.costo ? `<span class="pill">${esc(t.costo)}</span>` : ""}${t.q ? `<a class="map" target="_blank" rel="noopener" href="${mapsUrl([t.q], d.mezzo)}">Mappa</a>` : ""}</div></li>`).join("");
  const percorso = mapsUrl(d.tappe.map(t => t.q), d.mezzo);
  const pub = d.pub ? `<div class="card pub"><h3 style="margin-top:0">Pub</h3><div class="nome">${esc(d.pub.nome)}</div>
    <div class="desc">${esc(d.pub.dove)}</div><div class="desc" style="margin-top:6px">${esc(d.pub.alt)}</div>
    <div class="riga"><a class="map" target="_blank" rel="noopener" href="${mapsUrl([d.pub.q], d.mezzo)}">Mappa del pub</a></div></div>` : "";
  return `<div class="chips">${chips}</div>
    <section class="hero"><span class="kan">第${i2k(g + 1)}日</span><h2>${esc(d.titolo)}</h2><p>${esc(d.data)}</p></section>
    <ol class="tl">${tappe}</ol>
    ${percorso ? `<p><a class="map pri" target="_blank" rel="noopener" href="${percorso}">Percorso del giorno su Google Maps</a></p>` : ""}
    ${pub}${d.nota ? `<div class="card nota"><div class="desc">${esc(d.nota)}</div></div>` : ""}`;
}
const i2k = n => "一二三四五"[n - 1] || n;
function oggiNelViaggio() { const o = new Date(); return o >= new Date("2026-12-23T00:00:00") && o < new Date("2026-12-28T00:00:00"); }

function vistaPrenot() {
  const r = S.riserv, cod = (x, k) => x ? `<div class="codice">${esc(x)}</div>` : `<div class="mute">Codice nel file riservato: importalo da «Scambio».</div>`;
  const fatti = TRIP.promemoria.map(p => `<label class="c${S.fatti[p.id] ? " fatto" : ""}"><input type="checkbox" data-chg="fatto" data-v="${p.id}"${S.fatti[p.id] ? " checked" : ""}><span><b>${esc(p.t)}</b>${p.d ? `<br><small class="mute">${esc(p.d)}</small>` : ""}</span></label>`).join("");
  return `<h2>Prenotazioni</h2>
    <div class="card"><div class="nome">Andata, Wizz Air W4 6747</div><div class="desc">Mer 23/12, 19:05 da Venezia Marco Polo, arrivo a Luton alle 20:25. Solo bagaglio a mano 40x30x20.</div>${cod(r && r.voli && r.voli.andata)}</div>
    <div class="card"><div class="nome">Ritorno, Ryanair FR 761</div><div class="desc">Dom 27/12, 20:55 da Luton, arrivo a Venezia alle 00:05 del 28/12. Carta d'imbarco solo sull'app.</div>${cod(r && r.voli && r.voli.ritorno)}</div>
    <div class="card"><div class="nome">Cena della vigilia, Idalia</div><div class="desc">Pillar Hall, 5 Olympia Way, London W14 0EY. Gio 24/12 alle 20:15, tavolo per 5. Tolleranza di 15 minuti.</div>
      ${r && r.idalia ? `<div class="codice">OpenTable n. ${esc(r.idalia.conferma)}</div><div class="mute">Nome: ${esc(r.idalia.nome)}</div>` : `<div class="mute">Conferma nel file riservato.</div>`}
      <div class="riga"><a class="map" target="_blank" rel="noopener" href="${mapsUrl(["Idalia, Pillar Hall, 5 Olympia Way, London W14 0EY"], "transit")}">Mappa</a></div></div>
    <div class="card"><div class="nome">Alloggio</div><div class="desc">A pochi passi da King's Cross. Indirizzo non ancora noto.</div></div>
    ${r && r.bambina ? `<div class="card"><div class="nome">Gruppo</div><div class="desc">${esc(gruppo().join(", "))} e ${esc(r.bambina)} (4 anni).</div></div>` : ""}
    <h3>Da fare</h3><div class="card">${fatti}</div>
    <h3>Da verificare</h3><div class="card"><ul class="lista">${TRIP.daVerificare.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <h3>Info utili</h3><div class="card"><ul class="lista">${TRIP.info.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
}

function vistaIdee() {
  const lista = vivi(S.idee).sort((a, b) => b.ts - a.ts).map(i => `<div class="card"><div class="nome">${esc(i.testo)}</div>
    <div class="desc">${esc(i.autore || "senza nome")}${i.giorno ? ` · giorno ${i.giorno}` : ""}</div>
    <div class="riga"><button class="stato s${i.stato}" data-az="stato" data-v="${i.id}">${STATI[i.stato]}</button>
    <button class="btn tondo rosso" data-az="delIdea" data-v="${i.id}" aria-label="Elimina">✕</button></div></div>`).join("");
  return `<h2>Idee</h2><p class="mute">Aggiungi un'idea sul tuo telefono. Poi esporta da «Scambio» per condividerla.</p>
    <form class="f" data-form="idea"><input type="text" name="testo" placeholder="Es. Pomeriggio al Natural History Museum" required maxlength="200">
    <select name="giorno"><option value="0">Qualsiasi giorno</option>${TRIP.giorni.map((d, i) => `<option value="${i + 1}">Giorno ${i + 1}, ${esc(d.breve)}</option>`).join("")}</select>
    <button class="btn pri" type="submit">Aggiungi idea</button></form>
    ${lista || `<div class="vuoto">Ancora nessuna idea.</div>`}`;
}

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

function vistaSpese() {
  const ps = gruppo(), { tot, pag } = saldi();
  const lista = vivi(S.spese).sort((a, b) => b.ts - a.ts).map(s => `<div class="card"><div class="nome">${esc(s.desc)} · ${gbp(s.importo)}</div>
    <div class="desc">Pagato da ${esc(s.chi)}, diviso tra ${s.tra && s.tra.length ? esc(s.tra.join(", ")) : "tutti"}</div>
    <div class="riga"><button class="btn tondo rosso" data-az="delSpesa" data-v="${s.id}" aria-label="Elimina">✕</button></div></div>`).join("");
  return `<h2>Spese</h2>
    <div class="card"><div class="mute">Totale speso</div><div class="tot">${gbp(tot)}</div>
    ${pag.length ? `<ul class="lista" style="margin-top:8px">${pag.map(([da, a, m]) => `<li><b>${esc(da)}</b> deve ${gbp(m)} a <b>${esc(a)}</b></li>`).join("")}</ul>` : `<div class="mute">Nessun saldo da pareggiare.</div>`}</div>
    <form class="f" data-form="spesa"><input type="text" name="desc" placeholder="Descrizione" required maxlength="80">
    <input type="number" name="importo" placeholder="Importo in sterline" step="0.01" min="0.01" inputmode="decimal" required>
    <select name="chi">${ps.map(p => `<option${p === S.me ? " selected" : ""}>${esc(p)}</option>`).join("")}</select>
    <div class="chk">${ps.map(p => `<label><input type="checkbox" name="tra" value="${esc(p)}" checked>${esc(p)}</label>`).join("")}</div>
    <button class="btn pri" type="submit">Aggiungi spesa</button></form>
    ${lista || `<div class="vuoto">Ancora nessuna spesa.</div>`}`;
}

function vistaDati() {
  const ps = gruppo();
  return `<h2>Scambio dati</h2>${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
    <div class="card"><div class="nome">Chi sei?</div>
    <select data-chg="me"><option value="">Scegli il tuo nome</option>${ps.map(p => `<option${p === S.me ? " selected" : ""}>${esc(p)}</option>`).join("")}</select></div>
    <div class="card"><div class="nome">Invia le tue idee e spese</div>
    <div class="desc">Crea un file e mandalo su WhatsApp a chi aggiorna l'app.</div>
    <div class="riga"><button class="btn pri" data-az="condividi">Condividi file</button><button class="btn" data-az="scarica">Scarica</button></div></div>
    <div class="card"><div class="nome">Importa file</div>
    <div class="desc">Unisce idee e spese di altri senza duplicati. Accetta anche il file dei dati riservati.</div>
    <div class="riga"><input type="file" id="file" accept="application/json,.json" multiple data-chg="importa"></div></div>
    <div class="card"><div class="nome">Dati riservati</div>
    <div class="desc">${S.riserv ? "Importati: codici e nomi sono visibili in «Prenota»." : "Non importati."}</div>
    ${S.riserv ? `<div class="riga"><button class="btn rosso" data-az="togliRiserv">Rimuovi dal telefono</button></div>` : ""}</div>
    <p class="mute">Idee e spese: ${vivi(S.idee).length} e ${vivi(S.spese).length}, salvate solo su questo telefono.</p>`;
}

const viste = { giorni: vistaGiorni, prenot: vistaPrenot, idee: vistaIdee, spese: vistaSpese, dati: vistaDati };
function render() {
  $("#vista").innerHTML = viste[tab]();
  document.querySelectorAll(".tab button").forEach(b => b.classList.toggle("on", b.dataset.t === tab));
  const gg = Math.ceil((new Date(TRIP.partenza) - new Date()) / 864e5);
  $("#conto").innerHTML = gg > 0 ? `<b>${gg}</b><span>giorni</span>` : `<b>🎄</b><span>buon viaggio</span>`;
}

/* ---------- scambio ---------- */
function pacchetto() {
  return { app: "londra-in-tasca", v: 1, autore: S.me, esportato: Date.now(), idee: S.idee, spese: S.spese };
}
function nomeFile() {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `londra-${(S.me || "anon").replace(/[^\w-]/g, "")}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
}
const fileDati = () => new File([JSON.stringify(pacchetto(), null, 1)], nomeFile(), { type: "application/json" });

async function importa(files) {
  const n = { idee: 0, spese: 0 }; let err = 0, riserv = false;
  for (const f of files) {
    try {
      const j = JSON.parse(await f.text());
      if (j.riservati) { S.riserv = j; riserv = true; continue; }
      if (j.app !== "londra-in-tasca") { err++; continue; }
      for (const k of ["idee", "spese"]) for (const x of j[k] || []) {
        if (!x || typeof x.id !== "string") continue;
        if (k === "spese") x.importo = Number(x.importo) || 0;
        const i = S[k].findIndex(y => y.id === x.id);
        if (i < 0) { S[k].push(x); n[k]++; } else if ((x.ts || 0) > (S[k][i].ts || 0)) { S[k][i] = x; n[k]++; }
      }
    } catch { err++; }
  }
  salva();
  msg = `Importato: ${n.idee} idee, ${n.spese} spese${riserv ? ", dati riservati" : ""}${err ? `. File non validi: ${err}` : ""}.`;
  render();
}

/* ---------- azioni ---------- */
const trova = (k, id) => S[k].find(x => x.id === id);
const azioni = {
  tab(v) { tab = v; msg = ""; scrollTo(0, 0); render(); },
  giorno(v) { g = +v; render(); },
  stato(v) { const i = trova("idee", v); if (i) { i.stato = (i.stato + 1) % 4; i.ts = Date.now(); salva(); render(); } },
  delIdea(v) { const i = trova("idee", v); if (i && confirm("Eliminare l'idea?")) { i.del = true; i.ts = Date.now(); salva(); render(); } },
  delSpesa(v) { const s = trova("spese", v); if (s && confirm("Eliminare la spesa?")) { s.del = true; s.ts = Date.now(); salva(); render(); } },
  fatto(v) { S.fatti[v] = !S.fatti[v]; salva(); render(); },
  me(v) { S.me = v; salva(); msg = ""; render(); },
  importa(_, el) { importa([...el.files]); },
  togliRiserv() { if (confirm("Rimuovere i dati riservati da questo telefono?")) { S.riserv = null; salva(); render(); } },
  scarica() {
    const f = fileDati(), a = document.createElement("a");
    a.href = URL.createObjectURL(f); a.download = f.name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
  async condividi() {
    const f = fileDati();
    try {
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: "Londra in tasca" });
      else azioni.scarica();
    } catch { /* condivisione annullata */ }
  }
};
const moduli = {
  idea(d, f) {
    const testo = String(d.get("testo") || "").trim(); if (!testo) return;
    S.idee.push({ id: uid(), testo, giorno: +d.get("giorno") || 0, stato: 0, autore: S.me, ts: Date.now() });
    salva(); render();
  },
  spesa(d, f) {
    const importo = Number(String(d.get("importo")).replace(",", ".")), desc = String(d.get("desc") || "").trim();
    if (!(importo > 0) || !desc) return;
    S.spese.push({ id: uid(), desc, importo, chi: d.get("chi"), tra: d.getAll("tra"), ts: Date.now() });
    salva(); render();
  }
};
document.addEventListener("click", e => { const t = e.target.closest("[data-az]"); if (t) azioni[t.dataset.az](t.dataset.v, t); });
document.addEventListener("change", e => { const t = e.target.closest("[data-chg]"); if (t) azioni[t.dataset.chg](t.type === "file" ? "" : (t.type === "checkbox" ? t.dataset.v : t.value), t); });
document.addEventListener("submit", e => { const f = e.target.closest("form[data-form]"); if (f) { e.preventDefault(); moduli[f.dataset.form](new FormData(f), f); } });

/* ---------- offline e neve ---------- */
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

(function neve() {
  const c = $("#neve"); if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const x = c.getContext("2d"); let w, h, fi = [];
  const mis = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
  mis(); addEventListener("resize", mis);
  for (let i = 0; i < 55; i++) fi.push({ x: Math.random() * 3000, y: Math.random() * 2000, r: 1 + Math.random() * 2.6, v: 0.25 + Math.random() * 0.7, o: Math.random() * 6 });
  let t = 0;
  (function giro() {
    if (!document.hidden) {
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
