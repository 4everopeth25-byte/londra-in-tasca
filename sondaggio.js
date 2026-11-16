"use strict";
/* Sondaggio collaborativo: proposte, voti, commenti e classifica condivisi con Supabase (accesso anonimo con codice e nome).
   L'amministratore entra con email e password in una sessione separata. I permessi veri sono nelle policy del database:
   qui si limita la schermata, non si decide la sicurezza. Usa le funzioni di app.js (esc, render, dire, azioni, moduli). */
const Sond = (() => {
  const URL_SB = "https://wecmatagiojrcaoimxvv.supabase.co", CHIAVE = "sb_publishable_5dCJJDSQstrpYgzCmSzkvw_wnHSVY81";
  const CAT = [["attrazioni", "Attrazioni"], ["musei", "Musei e mostre"], ["esperienze", "Esperienze"], ["ristoranti", "Ristoranti"], ["locali", "Locali e cocktail bar"], ["shopping", "Shopping"], ["parchi", "Parchi e passeggiate"], ["altro", "Altro"]];
  const FASI = ["", "Raccolta proposte", "Votazione", "Chiuso"];
  const catNome = k => (CAT.find(c => c[0] === k) || CAT[7])[1];
  let cl = null, ad = null, ad0 = null, uid = "", pronto = false, errore = "", admin = false, camp = null, me = null, canale = null, timer = 0, scad = 0;
  let P = [], V = [], C = [], PA = [], CL = [], tutte = [];
  const ui = { v: "proposte", id: null, cat: "", cerca: "", ord: "classifica", nuova: false, modif: null, cod: "" };
  const k = () => (admin ? ad : cl), ok = u => /^https:\/\//i.test(u || "");
  const gest = () => admin || (!!camp && camp.creato_da === uid);
  const fase = c => (!c ? 1 : c.fase === 3 || (c.chiusura && new Date(c.chiusura) <= Date.now()) ? 3 : c.fase === 1 && c.votazione_inizio && new Date(c.votazione_inizio) <= Date.now() ? 2 : c.fase);
  const visibile = () => typeof tab !== "undefined" && tab === "altro" && sub === "sondaggio";
  const libero = () => { const a = document.activeElement; return !a || !a.closest || !a.closest("form,textarea,input,select"); };
  const traduci = e => { const m = (e && e.message) || "Errore"; return e && e.code === "42501" ? "Operazione non consentita in questa fase o per questo account." : e && e.code === "23505" ? "Esiste già una proposta con questo titolo." : /Failed to fetch|NetworkError|Load failed/i.test(m) ? "Connessione assente: riprova tra poco." : m; };
  const q = async p => { const r = await p; if (r.error) throw r.error; return r.data; };
  const dopo = () => { if (visibile() && libero()) render(); };
  const cella = d => new Date(d).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  function crea() {
    if (pronto || errore) return;
    if (!window.supabase) { errore = "Libreria non caricata."; return; }
    const o = (chiave) => ({ auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: chiave } });
    cl = supabase.createClient(URL_SB, CHIAVE, o("lit-sond-anon")); ad0 = ad = supabase.createClient(URL_SB, CHIAVE, o("lit-sond-admin")); pronto = true;
    addEventListener("online", () => camp && ricarica()); document.addEventListener("visibilitychange", () => { if (!document.hidden && camp && visibile()) ricarica(); });
  }
  async function sessione() {
    crea(); if (errore) return;
    const { data } = await cl.auth.getSession();
    if (!data.session) await q(cl.auth.signInAnonymously());
    uid = (await cl.auth.getUser()).data.user.id;
    if ((await cl.rpc("is_admin")).data === true) { ad = cl; admin = true; }
    else { const a = await ad0.auth.getSession(); if (a.data.session && (await ad0.rpc("is_admin")).data === true) { ad = ad0; admin = true; } }
  }
  async function avvia() {
    try { await sessione(); } catch (e) { errore = "Accesso anonimo non riuscito: " + traduci(e); }
    let salvato = ""; try { salvato = localStorage.getItem("lit-sond-codice") || ""; } catch { /* ok */ }
    if (!errore && (salvato || admin)) { try { if (salvato) await apri(salvato); else await elenco(); } catch (e) { if (salvato) { try { localStorage.removeItem("lit-sond-codice"); } catch { /* ok */ } } } }
    dopo();
  }
  async function elenco() { let r = k().from("campaigns").select("*").order("created_at", { ascending: false }); if (!admin) r = r.eq("creato_da", uid); tutte = await q(r); }
  async function apri(codice) {
    const c = await q(k().from("campaigns").select("*").eq("codice", codice.toUpperCase()).maybeSingle());
    if (!c) throw new Error("Sondaggio non trovato o accesso non consentito.");
    camp = c; me = await q(cl.from("participants").select("*").eq("campaign_id", c.id).eq("user_id", uid).maybeSingle());
    if (!admin) { try { localStorage.setItem("lit-sond-codice", c.codice); } catch { /* ok */ } }
    await ricarica(); sottoscrivi();
  }
  async function ricarica() {
    if (!camp) return;
    try {
      const id = camp.id, db = k();
      const [c, p, pa, v, co, cla] = await Promise.all([
        q(db.from("campaigns").select("*").eq("id", id).single()), q(db.from("proposals").select("*").eq("campaign_id", id).order("created_at")),
        q(db.from("participants").select("*").eq("campaign_id", id).order("joined_at")),
        q(db.from("votes").select("*, proposals!inner(campaign_id)").eq("proposals.campaign_id", id)),
        q(db.from("comments").select("*, proposals!inner(campaign_id)").eq("proposals.campaign_id", id).order("created_at")),
        q(db.from("classifica").select("*").eq("campaign_id", id))]);
      camp = c; P = p; PA = pa; V = v; C = co; CL = cla;
      if (gest()) me = pa.find(x => x.user_id === uid && !x.revocato) || null;
      else { me = pa.find(x => me && x.id === me.id) || null; if (!me || me.revocato) { camp = null; try { localStorage.removeItem("lit-sond-codice"); } catch { /* ok */ } errore = "Accesso a questo sondaggio non più valido."; } }
      pianificaScadenza();
    } catch (e) { errore = traduci(e); }
    dopo();
  }
  function pianifica() { clearTimeout(timer); timer = setTimeout(ricarica, 350); }
  function pianificaScadenza() {
    clearTimeout(scad); if (!camp) return;
    const t = [camp.votazione_inizio, camp.chiusura].filter(Boolean).map(x => new Date(x).getTime()).filter(x => x > Date.now()).sort((a, b) => a - b)[0];
    if (t && t - Date.now() < 2147e6) scad = setTimeout(() => { dopo(); pianificaScadenza(); }, t - Date.now() + 500);
  }
  function sottoscrivi() {
    fuori(); const db = k();
    canale = db.channel("sond-" + camp.id);
    for (const t of ["campaigns", "proposals", "participants", "votes", "comments"]) canale.on("postgres_changes", { event: "*", schema: "public", table: t }, pianifica);
    canale.subscribe();
  }
  function fuori() { if (canale) { try { k().removeChannel(canale); } catch { /* ok */ } canale = null; } }
  function ripresa() { if (camp && !canale) { sottoscrivi(); ricarica(); } }

  /* ---------- viste ---------- */
  const link = () => location.origin + location.pathname.replace(/[^/]*$/, "") + "#s=" + camp.codice;
  const miei = id => V.find(v => v.proposal_id === id && me && v.participant_id === me.id);
  const nomeDi = id => (PA.find(x => x.id === id) || {}).nome || "?";
  const riga = c => CL.find(x => x.proposal_id === c) || { positivi: 0, negativi: 0, totale: 0, punteggio: 0, posizione: 0 };
  const intest = () => {
    const f = fase(camp);
    return `<div class="scheda acceso"><div class="nome">${esc(camp.titolo)}<span class="et" role="status">Fase ${f}: ${FASI[f]}</span></div>${camp.descrizione ? `<div class="desc">${esc(camp.descrizione)}</div>` : ""}
      <div class="desc">${gest() ? `Gestione${me ? `, partecipi come ${esc(me.nome)}` : ""}` : `Sei ${esc(me ? me.nome : "?")}`}. Codice <span class="codice">${esc(camp.codice)}</span>.${camp.votazione_inizio && f === 1 ? ` Votazione dal ${cella(camp.votazione_inizio)}.` : ""}${camp.chiusura && f < 3 ? ` Chiusura il ${cella(camp.chiusura)}.` : ""}</div>
      <div class="riga"><button class="btn pri" data-az="s_invita">Invita su WhatsApp</button><button class="btn" data-az="s_copia">Copia il link</button><button class="btn" data-az="${gest() ? "s_miei" : "s_esci"}">${gest() ? "I miei sondaggi" : "Esci"}</button></div>
      ${gest() && !me ? `<form class="f" data-form="s_partecipa"><label class="mute" for="s-pn">Vuoi partecipare anche tu? Scegli il tuo nome</label><input id="s-pn" name="nome" maxlength="30" required><button class="btn" type="submit">Partecipa</button></form>` : ""}</div>`;
  };
  function vistaEntra() {
    return `<div class="scheda"><div class="nome">Entra in un sondaggio</div><div class="desc">Scrivi il codice ricevuto e scegli il nome con cui compari. Il telefono si ricorda di te.</div>
      <form class="f" data-form="s_entra"><label class="mute" for="s-cod">Codice del sondaggio</label><input id="s-cod" name="cod" maxlength="12" autocapitalize="characters" autocomplete="off" required value="${esc(ui.cod)}">
      <label class="mute" for="s-nome">Il tuo nome</label><input id="s-nome" name="nome" maxlength="30" required autocomplete="nickname">
      <label class="mute" for="s-inv">Codice di invito (solo se richiesto)</label><input id="s-inv" name="inv" maxlength="12" autocapitalize="characters" autocomplete="off">
      <button class="btn pri" type="submit">Entra</button></form></div>
      <div class="riga"><button class="btn" data-az="s_miei">Crea o gestisci i miei sondaggi</button></div>`;
  }
  function vistaLogin() {
    return `<div class="scheda"><div class="nome">Accesso amministratore</div><div class="desc">Email e password dell'account amministratore. Restano solo in questa sessione del browser.</div>
      <form class="f" data-form="s_login"><label class="mute" for="s-em">Email</label><input id="s-em" name="email" type="email" autocomplete="username" required>
      <label class="mute" for="s-pw">Password</label><input id="s-pw" name="pw" type="password" autocomplete="current-password" required>
      <button class="btn pri" type="submit">Accedi</button></form></div><div class="riga"><button class="btn" data-az="s_esci">Indietro</button></div>`;
  }
  function vistaElenco() {
    return `<div class="scheda"><div class="nome">Sondaggi</div>${tutte.length ? tutte.map(c => `<div class="riga" style="justify-content:space-between"><span>${esc(c.titolo)} <span class="mute">${esc(c.codice)} · fase ${fase(c)}</span></span><button class="btn" data-az="s_apri" data-v="${esc(c.codice)}">Apri</button></div>`).join("") : `<div class="desc">Nessun sondaggio: creane uno. Ne sarai il gestore da questo telefono.</div>`}</div>
      <div class="scheda"><div class="nome">Nuovo sondaggio</div><form class="f" data-form="s_nuovo"><label class="mute" for="s-t">Titolo</label><input id="s-t" name="titolo" minlength="3" maxlength="120" required placeholder="Es. Londra Natale 2026">
      <label class="mute" for="s-d">Descrizione</label><input id="s-d" name="desc" maxlength="500"><button class="btn pri" type="submit">Crea il sondaggio</button></form></div>
      <div class="riga"><button class="btn" data-az="${admin ? "s_esci" : "s_chiudi"}">${admin ? "Esci dall'area amministratore" : "Indietro"}</button></div>`;
  }
  function schedaProposta(p) {
    const r = riga(p.id), m = miei(p.id), f = fase(camp), n = C.filter(c => c.proposal_id === p.id).length;
    const voto = !me ? "" : `<div class="riga" role="group" aria-label="Il tuo voto">${[[1, "Mi piace", "👍"], [-1, "Non mi piace", "👎"]].map(([v, l, e]) => `<button class="btn${m && m.valore === v ? " pri" : ""}" data-az="s_vota" data-v="${p.id}|${v}" aria-pressed="${!!m && m.valore === v}" ${f === 2 ? "" : "disabled"}>${e}<span class="vh"> ${l}</span></button>`).join("")}</div>`;
    return `<article class="scheda"><div class="nome">${f === 3 && r.posizione ? `${r.posizione}. ` : ""}${esc(p.titolo)}<span class="et">${r.punteggio > 0 ? "+" : ""}${r.punteggio}</span></div>
      <div class="desc">${esc(catNome(p.categoria))}. Proposta da ${esc(nomeDi(p.participant_id))}. ${r.positivi} a favore, ${r.negativi} contrari. ${n} ${n === 1 ? "commento" : "commenti"}.${p.selezionato ? " Selezionata per l'itinerario." : ""}</div>
      ${voto}<div class="riga"><button class="btn" data-az="s_dettaglio" data-v="${p.id}">Dettagli e commenti</button></div></article>`;
  }
  function formProposta(x = {}) {
    return `<form class="f" data-form="s_proposta"><input type="hidden" name="id" value="${esc(x.id || "")}">
      <label class="mute" for="sp-t">Nome dell'attività</label><input id="sp-t" name="titolo" required minlength="2" maxlength="120" value="${esc(x.titolo || "")}">
      <label class="mute" for="sp-c">Categoria</label><select id="sp-c" name="categoria">${CAT.map(([v, l]) => `<option value="${v}"${x.categoria === v ? " selected" : ""}>${l}</option>`).join("")}</select>
      <label class="mute" for="sp-d">Descrizione</label><input id="sp-d" name="descrizione" maxlength="1000" value="${esc(x.descrizione || "")}">
      <label class="mute" for="sp-i">Indirizzo</label><input id="sp-i" name="indirizzo" maxlength="200" value="${esc(x.indirizzo || "")}">
      <label class="mute" for="sp-m">Link Google Maps (https)</label><input id="sp-m" name="maps_url" inputmode="url" maxlength="500" value="${esc(x.maps_url || "")}">
      <label class="mute" for="sp-s">Sito ufficiale (https)</label><input id="sp-s" name="sito_url" inputmode="url" maxlength="500" value="${esc(x.sito_url || "")}">
      <label class="mute" for="sp-g">Link a un'immagine (facoltativo, https)</label><input id="sp-g" name="immagine_url" inputmode="url" maxlength="500" value="${esc(x.immagine_url || "")}">
      <div class="riga"><button class="btn pri" type="submit">${x.id ? "Salva le modifiche" : "Aggiungi proposta"}</button><button class="btn" type="button" data-az="s_annulla">Annulla</button></div></form>`;
  }
  function vistaProposte() {
    const f = fase(camp), puo = !!me && f === 1;
    let l = P.filter(p => (!ui.cat || p.categoria === ui.cat) && (!ui.cerca || (p.titolo + " " + p.descrizione + " " + p.indirizzo).toLowerCase().includes(ui.cerca.toLowerCase())));
    l.sort((a, b) => ui.ord === "recenti" ? new Date(b.created_at) - new Date(a.created_at) : ui.ord === "nome" ? a.titolo.localeCompare(b.titolo, "it") : (riga(b.id).punteggio - riga(a.id).punteggio) || (riga(b.id).positivi - riga(a.id).positivi) || (riga(b.id).totale - riga(a.id).totale));
    const chips = [["", "Tutte"], ...CAT].map(([v, t]) => `<button class="chip" data-az="s_cat" data-v="${v}" aria-pressed="${ui.cat === v}">${t}</button>`).join("");
    const ord = [["classifica", "Per punteggio"], ["recenti", "Più recenti"], ["nome", "Per nome"]].map(([v, t]) => `<button class="chip" data-az="s_ord" data-v="${v}" aria-pressed="${ui.ord === v}">${t}</button>`).join("");
    return `${puo ? `<details class="scheda nuova"${ui.nuova || ui.modif ? " open" : ""}><summary>Nuova proposta</summary>${formProposta(ui.modif && P.find(p => p.id === ui.modif) || {})}</details>` : `<div class="mute">${f === 2 ? "Le proposte sono bloccate: si vota." : f === 3 ? "Il sondaggio è chiuso." : ""}</div>`}
      <form class="f" data-form="s_cerca" role="search"><label class="mute" for="s-q">Cerca</label><input id="s-q" name="q" type="search" value="${esc(ui.cerca)}" placeholder="Nome, indirizzo, descrizione"></form>
      <div class="chips" role="group" aria-label="Categoria">${chips}</div><div class="chips" role="group" aria-label="Ordine">${ord}</div>
      ${l.length ? l.map(schedaProposta).join("") : `<div class="scheda"><div class="desc">${P.length ? "Nessuna proposta con questi filtri." : "Ancora nessuna proposta."}</div></div>`}`;
  }
  function vistaDettaglio() {
    const p = P.find(x => x.id === ui.id); if (!p) { ui.v = "proposte"; return vistaProposte(); }
    const f = fase(camp), mia = me && p.participant_id === me.id, cm = C.filter(c => c.proposal_id === p.id), r = riga(p.id);
    const apertiC = f === 1 || (f === 2 && camp.commenti_in_votazione);
    return `<div class="riga"><button class="btn" data-az="s_indietro">Indietro</button></div>
      <div class="scheda"><div class="nome">${esc(p.titolo)}</div><div class="desc">${esc(catNome(p.categoria))}. Proposta da ${esc(nomeDi(p.participant_id))}, ${cella(p.created_at)}.</div>
      ${p.descrizione ? `<div class="desc">${esc(p.descrizione)}</div>` : ""}${p.indirizzo ? `<div class="desc">${esc(p.indirizzo)}</div>` : ""}
      <div class="desc">Punteggio ${r.punteggio} (${r.positivi} a favore, ${r.negativi} contrari, ${r.totale} voti).</div>
      <div class="riga">${ok(p.maps_url) ? `<a class="map" target="_blank" rel="noopener" href="${esc(p.maps_url)}">Google Maps</a>` : ""}${ok(p.sito_url) ? `<a class="map" target="_blank" rel="noopener" href="${esc(p.sito_url)}">Sito ufficiale</a>` : ""}${ok(p.immagine_url) ? `<a class="map" target="_blank" rel="noopener" href="${esc(p.immagine_url)}">Immagine</a>` : ""}</div>
      ${(mia && f === 1) || gest() ? `<div class="riga">${mia && f === 1 ? `<button class="btn" data-az="s_modifica" data-v="${p.id}">Modifica</button>` : ""}<button class="btn rosso" data-az="s_elimina" data-v="${p.id}">Elimina</button></div>` : ""}</div>
      <h2 class="h-sez">Commenti</h2>
      ${cm.length ? cm.map(c => `<div class="scheda"><div class="desc"><b>${esc(nomeDi(c.participant_id))}</b> <span class="mute">${cella(c.created_at)}</span></div><div>${esc(c.testo)}</div>${(me && c.participant_id === me.id && apertiC) || gest() ? `<div class="riga"><button class="btn rosso" data-az="s_delcom" data-v="${c.id}">Elimina</button></div>` : ""}</div>`).join("") : `<div class="mute">Nessun commento.</div>`}
      ${apertiC && me ? `<form class="f" data-form="s_commento"><input type="hidden" name="pid" value="${p.id}"><label class="mute" for="s-co">Scrivi un commento</label><input id="s-co" name="testo" required maxlength="500"><button class="btn pri" type="submit">Pubblica</button></form>` : `<div class="mute">I commenti sono chiusi.</div>`}`;
  }
  function vistaClassifica() {
    const l = [...CL].sort((a, b) => a.posizione - b.posizione), f = fase(camp);
    return `<div class="mute">${f === 3 ? "Classifica definitiva." : "Classifica provvisoria: si aggiorna in tempo reale."} Punteggio = voti a favore meno contrari.</div>` +
      (l.length ? `<div class="scheda">${l.map(r => `<div class="riga" style="justify-content:space-between"><span><b>${r.posizione}.</b> ${esc(r.titolo)} <span class="mute">${esc(catNome(r.categoria))} · ${esc(r.proponente)}</span></span><span>${r.punteggio > 0 ? "+" : ""}${r.punteggio} <span class="mute">(${r.positivi}/${r.negativi})</span></span></div>`).join("")}</div>` : `<div class="scheda"><div class="desc">Nessuna proposta.</div></div>`);
  }
  function vistaAdmin() {
    const dt = v => (v ? new Date(new Date(v) - new Date(v).getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "");
    return `<div class="scheda"><div class="nome">Fasi</div><div class="desc">Fase attuale: ${fase(camp)} (${FASI[fase(camp)]}).</div>
      <div class="chips avvolgi">${[1, 2, 3].map(n => `<button class="chip" data-az="s_fase" data-v="${n}" aria-pressed="${camp.fase === n}">${n}. ${FASI[n]}</button>`).join("")}</div>
      <div class="desc">Per riaprire un sondaggio chiuso scegli la fase 1 o 2: le scadenze impostate qui sotto vanno tolte o spostate.</div>
      <form class="f" data-form="s_scad"><label class="mute" for="a-v">Inizio votazione automatico</label><input id="a-v" name="vi" type="datetime-local" value="${dt(camp.votazione_inizio)}">
      <label class="mute" for="a-c">Chiusura automatica</label><input id="a-c" name="ch" type="datetime-local" value="${dt(camp.chiusura)}">
      <label class="riga"><input type="checkbox" name="cv"${camp.commenti_in_votazione ? " checked" : ""}> Commenti aperti durante la votazione</label>
      <label class="riga"><input type="checkbox" name="inv"${camp.richiede_invito ? " checked" : ""}> Serve un codice di invito personale</label>
      <button class="btn pri" type="submit">Salva impostazioni</button></form></div>
      <div class="scheda"><div class="nome">Partecipanti (${PA.length})</div>${PA.map(x => `<div class="riga" style="justify-content:space-between"><span>${esc(x.nome)}${x.revocato ? ' <span class="et">revocato</span>' : ""}</span><span><button class="btn" data-az="s_revoca" data-v="${x.id}|${x.revocato ? 0 : 1}">${x.revocato ? "Ripristina" : "Revoca"}</button></span></div>`).join("") || `<div class="desc">Nessuno.</div>`}
      <div class="riga"><button class="btn" data-az="s_codiceInvito">Genera un codice di invito</button></div><div id="s-inviti" class="desc"></div></div>
      <div class="scheda"><div class="nome">Titolo e descrizione</div><form class="f" data-form="s_titolo"><input name="titolo" required minlength="3" maxlength="120" value="${esc(camp.titolo)}" aria-label="Titolo"><input name="desc" maxlength="500" value="${esc(camp.descrizione)}" aria-label="Descrizione"><button class="btn pri" type="submit">Salva</button></form></div>
      <div class="scheda"><div class="nome">Itinerario</div><div class="desc">Seleziona le attività da inserire nell'itinerario. La classifica non cambia. Distanze e orari restano da completare.</div>
      ${[...CL].sort((a, b) => a.posizione - b.posizione).map(r => { const p = P.find(x => x.id === r.proposal_id) || {}; return `<form class="f" data-form="s_sel"><input type="hidden" name="id" value="${p.id}"><label class="riga"><input type="checkbox" name="sel"${p.selezionato ? " checked" : ""}> <b>${r.posizione}. ${esc(r.titolo)}</b></label>
        <div class="riga"><input name="giorno" type="number" min="1" max="31" placeholder="Giorno" value="${p.giorno ?? ""}" aria-label="Giorno" style="width:90px"><input name="zona" maxlength="60" placeholder="Zona" value="${esc(p.zona || "")}" aria-label="Zona"></div>
        <input name="note" maxlength="500" placeholder="Note organizzative" value="${esc(p.note_org || "")}" aria-label="Note"><button class="btn" type="submit">Salva</button></form>`; }).join("") || `<div class="desc">Nessuna proposta.</div>`}</div>
      <div class="scheda"><div class="nome">Esporta per aggiornare l'itinerario</div><div class="desc">Un solo file con classifica, proposte, selezioni, voti e commenti, da dare a Claude.</div><div class="riga"><button class="btn pri" data-az="s_esporta">Scarica il file</button><button class="btn" data-az="s_esportaCopia">Copia il contenuto</button></div></div>
      <div class="scheda"><div class="nome">Elimina il sondaggio</div><div class="riga"><button class="btn rosso" data-az="s_delcamp">Elimina definitivamente</button></div></div>`;
  }
  function vista() {
    if (visibile() && !pronto && !errore) { avvia(); }
    let corpo;
    if (errore && !camp) corpo = `<div class="msg avv">${esc(errore)}</div>` + (admin ? vistaElenco() : vistaEntra());
    else if (!pronto) corpo = `<div class="scheda"><div class="desc">Collegamento in corso.</div></div>`;
    else if (ui.v === "login") corpo = vistaLogin();
        else if ((admin || ui.v === "miei") && !camp) corpo = vistaElenco();
    else if (!camp) corpo = vistaEntra();
    else {
      const vv = [["proposte", "Proposte"], ["classifica", "Classifica"], ...(gest() ? [["admin", "Gestione"]] : [])];
      const nav = `<div class="chips avvolgi" role="group" aria-label="Sezioni del sondaggio">${vv.map(([v, t]) => `<button class="chip" data-az="s_vista" data-v="${v}" aria-pressed="${ui.v === v || (v === "proposte" && ui.v === "dettaglio")}">${t}</button>`).join("")}</div>`;
      corpo = intest() + (errore ? `<div class="msg avv">${esc(errore)}</div>` : "") + nav + ({ proposte: vistaProposte, dettaglio: vistaDettaglio, classifica: vistaClassifica, admin: vistaAdmin }[ui.v] || vistaProposte)();
    }
    return corpo;
  }

  /* dati effettivamente presenti nel database, nell'ordine della classifica */
  const esporta = () => ({
    sondaggio: { titolo: camp.titolo, descrizione: camp.descrizione, fase: fase(camp), votazione_inizio: camp.votazione_inizio, chiusura: camp.chiusura, esportato: new Date().toISOString(), partecipanti: PA.filter(x => !x.revocato).map(x => x.nome) },
    classifica: [...CL].sort((a, b) => a.posizione - b.posizione).map(r => { const p = P.find(x => x.id === r.proposal_id) || {}; return {
      posizione: r.posizione, titolo: r.titolo, categoria: catNome(r.categoria), proponente: r.proponente, punteggio: r.punteggio, positivi: r.positivi, negativi: r.negativi, totale_voti: r.totale,
      descrizione: p.descrizione, indirizzo: p.indirizzo, google_maps: p.maps_url, sito: p.sito_url, immagine: p.immagine_url,
      selezionato_per_itinerario: !!p.selezionato, giorno: p.giorno, zona: p.zona, note_organizzative: p.note_org,
      voti: V.filter(v => v.proposal_id === r.proposal_id).map(v => ({ partecipante: nomeDi(v.participant_id), voto: v.valore === 1 ? "mi piace" : "non mi piace", data: v.updated_at })),
      commenti: C.filter(c => c.proposal_id === r.proposal_id).map(c => ({ autore: nomeDi(c.participant_id), testo: c.testo, data: c.created_at })) }; })
  });
  /* ---------- azioni ---------- */
  const esegui = async (fn, ok2) => { errore = ""; try { await fn(); if (ok2) dire(ok2); } catch (e) { dire(traduci(e), "avv"); } await ricarica(); };
  const val = (f, n) => String(f.get(n) || "").trim();
  const num = v => (v === "" ? null : Math.max(1, Math.min(31, parseInt(v, 10) || 1)));
  Object.assign(azioni, {
    s_vista(v) { ui.v = v; render(); }, s_cat(v) { ui.cat = v; render(); }, s_ord(v) { ui.ord = v; render(); },
    s_dettaglio(v) { ui.id = v; ui.v = "dettaglio"; scrollTo(0, 0); render(); }, s_indietro() { ui.v = "proposte"; render(); },
    s_annulla() { ui.modif = null; ui.nuova = false; render(); }, s_modifica(v) { ui.modif = v; ui.v = "proposte"; scrollTo(0, 0); render(); },
    s_login() { ui.v = "login"; render(); }, async s_miei() { fuori(); camp = null; ui.v = "miei"; try { crea(); if (!(await cl.auth.getSession()).data.session) await q(cl.auth.signInAnonymously()); uid = (await cl.auth.getUser()).data.user.id; await elenco(); } catch (e) { dire(traduci(e), "avv"); } render(); },
    async s_chiudi() { fuori(); camp = null; ui.v = "proposte"; errore = ""; try { localStorage.removeItem("lit-sond-codice"); } catch { /* ok */ } if (admin) { try { await elenco(); } catch { /* ok */ } } render(); },
    async s_esci() {
      fuori(); if (admin) { try { if (ad === cl) await cl.rpc("lascia_admin"); else await ad.auth.signOut(); } catch { /* ok */ } ad = ad0; admin = false; }
      camp = null; me = null; ui.v = "proposte"; errore = ""; try { localStorage.removeItem("lit-sond-codice"); } catch { /* ok */ } render();
    },
    async s_apri(cod) { ui.v = "proposte"; try { await apri(cod); } catch (e) { dire(traduci(e), "avv"); } render(); },
    s_invita() { window.open("https://wa.me/?text=" + encodeURIComponent(`Londra in tasca, sondaggio «${camp.titolo}»: apri il link, scrivi il tuo nome e partecipa.\n${link()}`), "_blank", "noopener"); },
    async s_copia() { dire((await copia(link())) ? "Link copiato." : "Copia non riuscita."); render(); },
    s_vota(v) {
      const [id, n] = v.split("|"), m = miei(id), valore = +n;
      return esegui(async () => { if (m && m.valore === valore) await q(cl.from("votes").delete().eq("proposal_id", id).eq("participant_id", me.id)); else await q(cl.from("votes").upsert({ proposal_id: id, participant_id: me.id, valore }, { onConflict: "proposal_id,participant_id" })); });
    },
    s_elimina(v) { if (confirm("Eliminare questa proposta, con voti e commenti?")) return esegui(async () => { await q(k().from("proposals").delete().eq("id", v)); ui.v = "proposte"; }, "Proposta eliminata."); },
    s_delcom(v) { if (confirm("Eliminare il commento?")) return esegui(() => q(k().from("comments").delete().eq("id", v))); },
    s_fase(v) { return esegui(() => q(k().from("campaigns").update({ fase: +v }).eq("id", camp.id)), "Fase aggiornata."); },
    s_revoca(v) { const [id, r] = v.split("|"); return esegui(() => q(k().from("participants").update({ revocato: r === "1" }).eq("id", id))); },
    s_delcamp() { if (confirm("Eliminare l'intero sondaggio con proposte, voti e commenti? Non si può annullare.")) return esegui(async () => { await q(k().from("campaigns").delete().eq("id", camp.id)); fuori(); camp = null; ui.v = "miei"; await elenco(); }, "Sondaggio eliminato.").then(render); },
    s_esporta() {
      const f = new File([JSON.stringify(esporta(), null, 1)], `sondaggio-${camp.codice}.json`, { type: "application/json" }), u = URL.createObjectURL(f), l = document.createElement("a");
      l.href = u; l.download = f.name; document.body.append(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); dire("File scaricato: " + f.name); render();
    },
    async s_esportaCopia() { dire((await copia(JSON.stringify(esporta()))) ? "Contenuto copiato: incollalo nella chat." : "Copia non riuscita: usa «Scarica il file»."); render(); },
    async s_codiceInvito() {
      try { const r = await q(k().from("invites").insert({ campaign_id: camp.id }).select("codice").single()); const e = document.getElementById("s-inviti"); if (e) e.textContent = "Codice di invito, valido una volta: " + r.codice; } catch (e) { dire(traduci(e), "avv"); render(); }
    }
  });
  Object.assign(moduli, {
    async s_entra(f) {
      ui.cod = val(f, "cod").toUpperCase();
      try { crea(); if (!(await cl.auth.getSession()).data.session) await q(cl.auth.signInAnonymously());
        await q(cl.rpc("entra", { p_codice: ui.cod, p_nome: val(f, "nome"), p_invito: val(f, "inv") || null })); errore = ""; await apri(ui.cod); dire("Benvenuto nel sondaggio."); } catch (e) { dire(traduci(e), "avv"); }
      render();
    },
    async s_partecipa(f) { await esegui(() => q(cl.rpc("entra", { p_codice: camp.codice, p_nome: val(f, "nome") })), "Ora partecipi al sondaggio."); render(); },
    async s_login(f) {
      try { crea(); const r = await ad.auth.signInWithPassword({ email: val(f, "email"), password: String(f.get("pw") || "") }); if (r.error) throw new Error("Email o password non corrette.");
        if ((await ad.rpc("is_admin")).data !== true) { await ad.auth.signOut(); throw new Error("Questo account non è amministratore."); }
        admin = true; ui.v = "proposte"; errore = ""; await elenco(); } catch (e) { dire(traduci(e), "avv"); }
      render();
    },
    async s_nuovo(f) { try { const c = await q(k().from("campaigns").insert({ titolo: val(f, "titolo"), descrizione: val(f, "desc"), creato_da: uid }).select("codice").single()); await apri(c.codice); ui.v = "admin"; dire("Sondaggio creato. Scegli fasi e scadenze, poi invita il gruppo."); } catch (e) { dire(traduci(e), "avv"); } render(); },
    s_cerca(f) { ui.cerca = val(f, "q"); render(); },
    async s_proposta(f) {
      const id = val(f, "id"), d = { titolo: val(f, "titolo"), categoria: val(f, "categoria"), descrizione: val(f, "descrizione"), indirizzo: val(f, "indirizzo"), maps_url: val(f, "maps_url"), sito_url: val(f, "sito_url"), immagine_url: val(f, "immagine_url") };
      for (const c of ["maps_url", "sito_url", "immagine_url"]) if (d[c] && !ok(d[c])) { dire("I link devono iniziare con https://", "avv"); render(); return; }
      await esegui(async () => { if (id) await q(cl.from("proposals").update(d).eq("id", id)); else await q(cl.from("proposals").insert({ ...d, campaign_id: camp.id, participant_id: me.id })); ui.modif = null; ui.nuova = false; }, id ? "Proposta aggiornata." : "Proposta aggiunta."); render();
    },
    async s_commento(f) { await esegui(() => q(cl.from("comments").insert({ proposal_id: val(f, "pid"), participant_id: me.id, testo: val(f, "testo") }))); render(); },
    async s_scad(f) { await esegui(() => q(k().from("campaigns").update({ votazione_inizio: f.get("vi") ? new Date(f.get("vi")).toISOString() : null, chiusura: f.get("ch") ? new Date(f.get("ch")).toISOString() : null, commenti_in_votazione: f.get("cv") === "on", richiede_invito: f.get("inv") === "on" }).eq("id", camp.id)), "Impostazioni salvate."); render(); },
    async s_titolo(f) { await esegui(() => q(k().from("campaigns").update({ titolo: val(f, "titolo"), descrizione: val(f, "desc") }).eq("id", camp.id)), "Salvato."); render(); },
    async s_sel(f) { await esegui(() => q(k().from("proposals").update({ selezionato: f.get("sel") === "on", giorno: num(val(f, "giorno")), zona: val(f, "zona"), note_org: val(f, "note") }).eq("id", val(f, "id"))), "Itinerario aggiornato."); render(); }
  });
  /* link #s=CODICE: apre la schermata di ingresso con il codice già scritto */
  function daLink() { const m = /^#s=([A-Za-z0-9]{4,12})$/.exec(location.hash); if (!m) return false; ui.cod = m[1].toUpperCase(); try { history.replaceState(null, "", location.pathname + location.search); } catch { /* ok */ } tab = "altro"; sub = "sondaggio"; return true; }
  return { vista, fuori, ripresa, daLink, stato: () => ({ pronto, admin, camp: !!camp, errore }) };
})();

if (Sond.daLink()) render();
addEventListener("hashchange", () => { if (Sond.daLink()) render(); });
