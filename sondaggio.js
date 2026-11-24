"use strict";
/* Idee condivise: ogni idea è un sondaggio nel gruppo permanente LONDRA2026 su Supabase (accesso anonimo, si sceglie un nome).
   I permessi veri sono nelle policy del database: qui si limita la schermata, non si decide la sicurezza.
   Usa le funzioni di app.js (esc, render, dire, azioni, moduli). */
const Sond = (() => {
  const URL_SB = "https://wecmatagiojrcaoimxvv.supabase.co", CHIAVE = "sb_publishable_5dCJJDSQstrpYgzCmSzkvw_wnHSVY81";
  const CAT = [["attrazioni", "Attrazioni"], ["musei", "Musei e mostre"], ["esperienze", "Esperienze"], ["ristoranti", "Ristoranti"], ["locali", "Locali e cocktail bar"], ["shopping", "Shopping"], ["parchi", "Parchi e passeggiate"], ["altro", "Altro"]];
  const catNome = k => (CAT.find(c => c[0] === k) || CAT[7])[1];
  let cl = null, uid = "", pronto = false, errore = "", camp = null, me = null, canale = null, timer = 0;
  let P = [], V = [], C = [], PA = [];
  const leggi = (k2, d) => { try { return JSON.parse(localStorage.getItem(k2)) || d; } catch { return d; } }, scrivi = (k2, v) => { try { localStorage.setItem(k2, JSON.stringify(v)); } catch { /* ok */ } };
  const k = () => cl, ok = u => /^https:\/\//i.test(u || "");
  const fase = c => (!c ? 1 : c.fase === 3 || (c.chiusura && new Date(c.chiusura) <= Date.now()) ? 3 : c.fase === 1 && c.votazione_inizio && new Date(c.votazione_inizio) <= Date.now() ? 2 : c.fase);
  const visibile = () => typeof tab !== "undefined" && tab === "idee";
  const libero = () => { const a = document.activeElement; return !a || !a.closest || !a.closest("form,textarea,input,select"); };
  const traduci = e => { const m = (e && e.message) || "Errore"; return e && e.code === "42501" ? "Operazione non consentita in questa fase o per questo account." : e && e.code === "23505" ? "Esiste già una proposta con questo titolo." : /Failed to fetch|NetworkError|Load failed/i.test(m) ? "Connessione assente: riprova tra poco." : m; };
  const q = async p => { const r = await p; if (r.error) throw r.error; return r.data; };
  let firmaG = "";
  const dopo = () => {
    if (typeof aggiornaBadge === "function") aggiornaBadge();
    const f = JSON.stringify(P.filter(p => p.stato === 1).map(p => [p.id, p.giorno, p.titolo, p.categoria, p.descrizione, p.note_org])), cambiata = f !== firmaG; firmaG = f;
    if (cambiata && typeof ricomponi === "function") ricomponi();
    const t = typeof tab !== "undefined" ? tab : "";
    if ((t === "idee" || t === "oggi" || (t === "viaggio" && cambiata)) && libero()) render();
  };
  const cella = d => new Date(d).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  function crea() {
    if (pronto || errore) return;
    if (!window.supabase) { errore = "Libreria non caricata."; return; }
    cl = supabase.createClient(URL_SB, CHIAVE, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "lit-sond-anon" } }); pronto = true;
    addEventListener("online", () => { if (camp) ricarica(); else sveglia(); }); document.addEventListener("visibilitychange", () => { if (document.hidden) return; if (camp && visibile()) ricarica(); else if (!camp) sveglia(); });
  }
  async function sessione() {
    crea(); if (errore) return;
    const { data } = await cl.auth.getSession();
    if (!data.session) await q(cl.auth.signInAnonymously());
    uid = (await cl.auth.getUser()).data.user.id;
  }
  async function apri(codice) {
    const c = await q(cl.from("campaigns").select("*").eq("codice", codice.toUpperCase()).maybeSingle());
    if (!c) throw new Error("Gruppo non trovato o accesso non consentito.");
    camp = c; me = await q(cl.from("participants").select("*").eq("campaign_id", c.id).eq("user_id", uid).maybeSingle());
    await ricarica(); sottoscrivi();
  }
  async function ricarica() {
    if (!camp) return;
    try {
      const id = camp.id;
      const [c, p, pa, v, co] = await Promise.all([
        q(cl.from("campaigns").select("*").eq("id", id).single()), q(cl.from("proposals").select("*").eq("campaign_id", id).order("created_at")),
        q(cl.from("participants").select("*").eq("campaign_id", id).order("joined_at")),
        q(cl.from("votes").select("*, proposals!inner(campaign_id)").eq("proposals.campaign_id", id)),
        q(cl.from("comments").select("*, proposals!inner(campaign_id)").eq("proposals.campaign_id", id).order("created_at"))]);
      camp = c; P = p; PA = pa; V = v; C = co;
      me = pa.find(x => me && x.id === me.id) || null;
      if (!me || me.revocato) { camp = null; errore = "Accesso non più valido: scegli di nuovo il tuo nome."; }
      notificaIdee();
    } catch (e) { errore = traduci(e); }
    dopo();
  }
  function pianifica() { clearTimeout(timer); timer = setTimeout(ricarica, 350); }
  function sottoscrivi() {
    chiudiCanale(); const db = k();
    canale = db.channel("sond-" + camp.id);
    for (const t of ["campaigns", "proposals", "participants", "votes", "comments"]) canale.on("postgres_changes", { event: "*", schema: "public", table: t }, pianifica);
    canale.subscribe();
  }
  function chiudiCanale() { if (canale) { try { k().removeChannel(canale); } catch { /* ok */ } canale = null; } }

  /* ---------- supporto ---------- */
  const miei = id => V.find(v => v.proposal_id === id && me && v.participant_id === me.id);
  const nomeDi = id => (PA.find(x => x.id === id) || {}).nome || "?";
  const esegui = async (fn, ok2) => { errore = ""; try { await fn(); if (ok2) dire(ok2); } catch (e) { dire(traduci(e), "avv"); } await ricarica(); };
  const val = (f, n) => String(f.get(n) || "").trim();
  Object.assign(azioni, { s_delcom(v) { if (confirm("Eliminare il commento?")) return esegui(() => q(cl.from("comments").delete().eq("id", v))); } });
  Object.assign(moduli, { async s_commento(f) { await esegui(() => q(cl.from("comments").insert({ proposal_id: val(f, "pid"), participant_id: me.id, testo: val(f, "testo") }))); render(); } });

  /* ---------- Idee: ogni idea è un sondaggio nel gruppo permanente ---------- */
  const GRUPPO = "LONDRA2026", STATI = ["In votazione", "Approvata", "Respinta", "Fatta"];
  const I = { s: "", cat: "", ord: "recenti", nuova: false, modif: null, det: null, bozza: null };
  const viste = new Set(leggi("lit-idee-viste", []));
  let caricato = false, avviando = false, gruppoVis = null;
  const orgMio = () => !!(camp && me && (camp.organizzatori || []).some(x => x.toLowerCase() === me.nome.toLowerCase()));
  const gestI = () => orgMio() || (!!camp && camp.creato_da === uid);
  const conta = id => { const v = V.filter(x => x.proposal_id === id); return { s: v.filter(x => x.valore === 1).length, n: v.filter(x => x.valore === -1).length, d: v.filter(x => x.valore === 0).length }; };
  const mioVoto = id => { const v = miei(id); return v ? v.valore : null; };
  const daVotareI = p => p.stato === 0 && me && mioVoto(p.id) === null;
  async function sveglia() {
    if (avviando) return; avviando = true;
    try {
      crea(); if (errore) { avviando = false; return; } await sessione();
      gruppoVis = await q(cl.from("campaigns").select("*").eq("codice", GRUPPO).maybeSingle());
      if (gruppoVis && !camp) { const m = await q(cl.from("participants").select("id").eq("campaign_id", gruppoVis.id).eq("user_id", uid).maybeSingle()); if (m) await apri(GRUPPO); }
    } catch (e) { errore = traduci(e); }
    caricato = true; avviando = false; dopo();
  }
  function notificaIdee() {
    if (!me) return;
    const nuove = P.filter(p => p.participant_id !== me.id && !viste.has(p.id));
    if (!nuove.length) return;
    const primo = viste.size === 0 && !leggi("lit-idee-avviato", false);
    nuove.forEach(p => viste.add(p.id)); scrivi("lit-idee-viste", [...viste].slice(-500)); scrivi("lit-idee-avviato", true);
    if (primo || (visibile() && libero()) || typeof toast !== "function") return;
    toast((nuove.length === 1 ? `${nomeDi(nuove[0].participant_id)} ha aggiunto un'idea: ${nuove[0].titolo}` : `${nuove.length} nuove idee da votare`) + ". Tocca per vederle.", () => { tab = "idee"; I.det = null; scrollTo(0, 0); render(); });
  }
  const titoloIdee = () => { const n = me ? P.filter(daVotareI).length : 0; return `<h1 class="vt">${n > 0 ? `${n} ${n === 1 ? "idea" : "idee"} da votare` : "Idee"}</h1>`; };
  function sceltaNome() {
    const nomi = (gruppoVis && gruppoVis.nomi_ammessi) || [];
    return `${titoloIdee()}${avviso()}<div class="scheda"><div class="nome">Chi sei?</div><div class="desc">Scegli il tuo nome una volta sola: da quel momento vedi e voti tutte le idee del gruppo. Ogni nome si può scegliere da un solo telefono.</div>
      <div class="chips avvolgi">${nomi.map(n => `<button class="chip" data-az="i_sono" data-v="${esc(n)}">${esc(n)}</button>`).join("")}</div></div>`;
  }
  function formIdea(x = {}) {
    return `<form class="f" data-form="i_idea"><input type="hidden" name="id" value="${esc(x.id || "")}">
      <label class="mute" for="i-t">Idea</label><input id="i-t" name="titolo" required minlength="2" maxlength="120" placeholder="Es. Natural History Museum" value="${esc(x.titolo || "")}">
      <label class="mute" for="i-c">Categoria</label><select id="i-c" name="categoria">${CAT.map(([v, l]) => `<option value="${v}"${x.categoria === v ? " selected" : ""}>${l}</option>`).join("")}</select>
      <label class="mute" for="i-l">Link (TikTok, Instagram, sito, Maps)</label><input id="i-l" name="link" inputmode="url" autocapitalize="none" maxlength="500" value="${esc(x.sito_url || "")}">
      <label class="mute" for="i-n">Nota o indirizzo (facoltativo)</label><input id="i-n" name="nota" maxlength="500" value="${esc(x.descrizione || "")}">
      <label class="mute" for="i-g">Giorno del viaggio (facoltativo, da 1 a 5)</label><input id="i-g" name="giorno" type="number" min="1" max="5" value="${x.giorno ?? ""}">
      <div class="riga"><button class="btn pri" type="submit">${x.id ? "Salva le modifiche" : "Aggiungi idea"}</button><button class="btn" type="button" data-az="i_annulla">Annulla</button></div></form>`;
  }
  function schedaI(p) {
    const c = conta(p.id), mv = mioVoto(p.id), n = C.filter(x => x.proposal_id === p.id).length, tot = ((camp.nomi_ammessi || []).length) || PA.length;
    const esito = c.s > c.n ? "Sì in vantaggio" : c.n > c.s ? "No in vantaggio" : "Pari";
    const chiusa = p.stato !== 0;
    return `<article class="scheda${p.stato === 1 ? " acceso" : ""} st${p.stato}"><div class="nome">${esc(p.titolo)}<span class="et">${STATI[p.stato]}</span></div>
      <div class="desc">${esc(catNome(p.categoria))}. Di ${esc(nomeDi(p.participant_id))}${p.giorno ? `, giorno ${p.giorno}` : ""}. ${c.s} sì, ${c.n} no, ${c.d} non so su ${tot}. ${chiusa ? "" : esito + "."}</div>
      ${p.descrizione ? `<div class="desc">${esc(p.descrizione)}</div>` : ""}${p.indirizzo ? `<div class="desc">${esc(p.indirizzo)}</div>` : ""}${ok(p.sito_url) || ok(p.maps_url) ? `<div class="riga">${ok(p.maps_url) ? `<a class="map" target="_blank" rel="noopener" href="${esc(p.maps_url)}">Apri su Maps</a>` : ""}${ok(p.sito_url) ? `<a class="map" target="_blank" rel="noopener" href="${esc(p.sito_url)}">Apri il link</a>` : ""}</div>` : ""}
      <div class="riga" role="group" aria-label="Il tuo voto">${[[1, "Sì"], [-1, "No"], [0, "Non so"]].map(([v, l]) => `<button class="btn${mv === v ? " pri" : ""}" data-az="i_vota" data-v="${p.id}|${v}" aria-pressed="${mv === v}"${chiusa ? " disabled" : ""}>${l}</button>`).join("")}</div>
      <div class="riga"><button class="btn" data-az="i_det" data-v="${p.id}">Commenti${n ? ` (${n})` : ""}</button></div></article>`;
  }
  function dettaglioI() {
    const p = P.find(x => x.id === I.det); if (!p) { I.det = null; return vistaIdee(); }
    const mia = me && p.participant_id === me.id, cm = C.filter(c => c.proposal_id === p.id), chiusoG = fase(camp) === 3;
    return `<div class="riga"><button class="btn" data-az="i_indietro">Indietro</button></div>${schedaI(p)}
      ${mia || gestI() ? `<div class="scheda"><div class="nome">Gestisci l'idea</div><div class="chips avvolgi" role="group" aria-label="Stato">${STATI.map((t, i) => `<button class="chip" data-az="i_stato" data-v="${p.id}|${i}" aria-pressed="${p.stato === i}">${t}</button>`).join("")}</div>
        <div class="riga"><button class="btn" data-az="i_modifica" data-v="${p.id}">Modifica</button><button class="btn rosso" data-az="i_elimina" data-v="${p.id}">Elimina</button></div></div>` : ""}
      <h2 class="h-sez">Commenti</h2>${cm.length ? cm.map(c => `<div class="scheda"><div class="desc"><b>${esc(nomeDi(c.participant_id))}</b> <span class="mute">${cella(c.created_at)}</span></div><div>${esc(c.testo)}</div>${me && (c.participant_id === me.id || gestI()) ? `<div class="riga"><button class="btn rosso" data-az="s_delcom" data-v="${c.id}">Elimina</button></div>` : ""}</div>`).join("") : `<div class="mute">Nessun commento.</div>`}
      ${me && !chiusoG ? `<form class="f" data-form="s_commento"><input type="hidden" name="pid" value="${p.id}"><label class="mute" for="s-co">Scrivi un commento</label><input id="s-co" name="testo" required maxlength="500"><button class="btn pri" type="submit">Pubblica</button></form>` : ""}`;
  }
  /* Grafico dei voti: una barra per idea (Sì, No, Non so, manca) e i nomi di chi ha votato cosa. Il testo del bottone riassume tutto per i lettori di schermo. */
  function graficoVoti(l) {
    if (!l.length) return "";
    const nomi = (camp.nomi_ammessi && camp.nomi_ammessi.length) ? camp.nomi_ammessi : PA.map(x => x.nome);
    const an = !I.grVisto; I.grVisto = true;
    const GR = [[1, "s", "✓", "Sì"], [-1, "n", "✕", "No"], [0, "d", "?", "Non so"], [null, "m", "–", "Non ha votato"]];
    const righe = [...l].sort((a, b) => (conta(b.id).s - conta(b.id).n) - (conta(a.id).s - conta(a.id).n) || new Date(b.created_at) - new Date(a.created_at)).map(p => {
      const per = new Map(V.filter(x => x.proposal_id === p.id).map(x => [nomeDi(x.participant_id).toLowerCase(), x.valore]));
      const st = nomi.map(n => ({ n, v: per.has(n.toLowerCase()) ? per.get(n.toLowerCase()) : null }));
      const riass = GR.map(([v, , , t]) => { const x = st.filter(y => y.v === v).map(y => y.n); return x.length ? `${t}: ${x.join(", ")}` : ""; }).filter(Boolean).join(". ");
      let k = 0;
      const barra = GR.map(([v, c]) => { const n = st.filter(y => y.v === v).length; return n ? `<i class="${c}" style="flex:${n};--i:${k++}"></i>` : ""; }).join("");
      const chip = st.map(y => { const g = GR.find(z => z[0] === y.v); return `<b class="${g[1]}"><span aria-hidden="true">${g[2]}</span> ${esc(y.n)}</b>`; }).join("");
      return `<button class="gr-riga${an ? " anima" : ""}" data-az="i_det" data-v="${p.id}" aria-label="${esc(p.titolo)}, ${STATI[p.stato]}. ${esc(riass)}. Apri i dettagli e i commenti."><span class="gr-t">${esc(p.titolo)}<span class="et">${STATI[p.stato]}</span></span><span class="gr-barra" aria-hidden="true">${barra}</span><span class="gr-nomi" aria-hidden="true">${chip}</span></button>`;
    }).join("");
    const pers = nomi.map(n => { const x = l.filter(p => V.some(v => v.proposal_id === p.id && nomeDi(v.participant_id).toLowerCase() === n.toLowerCase())).length; return `<b class="${x === l.length ? "s" : x ? "d" : "m"}">${esc(n)} ${x}/${l.length}</b>`; }).join("");
    return `<details class="scheda grafico" open><summary>Grafico dei voti</summary>
      <div class="gr-leg" aria-hidden="true">${GR.map(([, c, , t]) => `<span class="${c}">${t === "Non ha votato" ? "Manca" : t}</span>`).join("")}</div>${righe}
      <div class="desc" style="margin-top:12px"><b>Chi ha votato</b>, idee votate su ${l.length}:</div><div class="gr-nomi gr-pers">${pers}</div></details>`;
  }
  function vistaIdee() {
    try { return vistaIdeeBase(); } catch (e) { return `<h1 class="vt">Idee</h1><div class="msg avv"><b>Errore nella pagina.</b> ${esc(e && e.message)}</div><div class="riga"><button class="btn" data-az="i_riprova">Riprova</button></div>`; }
  }
  function vistaIdeeBase() {
    if (!caricato) { if (!avviando && !errore) sveglia(); return `${titoloIdee()}<div class="scheda"><div class="desc">Collegamento in corso.</div></div>`; }
    if (!camp) return errore ? `${titoloIdee()}<div class="msg avv">${esc(errore)}</div><div class="riga"><button class="btn" data-az="i_riprova">Riprova</button></div>` : (gruppoVis ? sceltaNome() : `${titoloIdee()}<div class="msg avv">Gruppo non trovato.</div>`);
    if (I.det) return dettaglioI();
    const mia = me && me.id;
    let l = P.filter(p => (!I.cat || p.categoria === I.cat) && (I.s === "" || (I.s === "mie" ? daVotareI(p) : p.stato === +I.s)));
    l.sort((a, b) => I.ord === "voti" ? (conta(b.id).s - conta(b.id).n) - (conta(a.id).s - conta(a.id).n) : new Date(b.created_at) - new Date(a.created_at));
    const stati = [["", "Ogni stato"], ["mie", "Da votare da me"], ["0", "In votazione"], ["1", "Approvate"], ["2", "Respinte"], ["3", "Fatte"]].map(([v, t]) => `<button class="chip" data-az="i_fs" data-v="${v}" aria-pressed="${I.s === v}">${t}</button>`).join("");
    const cats = [["", "Ogni categoria"], ...CAT].map(([v, t]) => `<button class="chip" data-az="i_fc" data-v="${v}" aria-pressed="${I.cat === v}">${t}</button>`).join("");
    return `${titoloIdee()}${avviso()}${errore ? `<div class="msg avv">${esc(errore)}</div>` : ""}<p class="mute">Ogni idea è un sondaggio: votano i quattro adulti con Sì, No o Non so. Le idee e i voti arrivano da soli su tutti i telefoni. Sei ${esc(me ? me.nome : "?")}.</p>
      <details class="scheda nuova"${I.nuova || I.modif ? " open" : ""}><summary>Nuova idea</summary>${formIdea(I.modif && P.find(p => p.id === I.modif) || I.bozza || {})}</details>
      <div class="chips" role="group" aria-label="Filtra per stato">${stati}</div><div class="chips" role="group" aria-label="Filtra per categoria">${cats}</div>
      <div class="chips" role="group" aria-label="Ordine"><button class="chip" data-az="i_ord" data-v="recenti" aria-pressed="${I.ord !== "voti"}">Più recenti</button><button class="chip" data-az="i_ord" data-v="voti" aria-pressed="${I.ord === "voti"}">Più votate</button></div>
      ${graficoVoti(l)}
      ${l.length ? l.map(schedaI).join("") : `<div class="scheda"><div class="desc">${P.length ? "Nessuna idea con questi filtri." : "Ancora nessuna idea: aggiungi la prima."}</div></div>`}`;
  }
  const banner = () => (caricato && !camp && gruppoVis && !errore ? `<div class="msg avv" role="status"><b>Scegli chi sei per vedere e votare le idee del gruppo.</b><div class="riga"><button class="btn" data-az="vai" data-v="idee">Apri Idee</button></div></div>` : "");
  const linkOk = u => (!u ? "" : /^https?:\/\//i.test(u) ? u.replace(/^http:\/\//i, "https://") : "https://" + u.replace(/^\/+/, ""));
  Object.assign(azioni, {
    i_fs(v) { I.s = v; render(); }, i_fc(v) { I.cat = v; render(); }, i_ord(v) { I.ord = v; render(); },
    i_det(v) { I.det = v; scrollTo(0, 0); render(); }, i_indietro() { I.det = null; render(); }, i_annulla() { I.modif = null; I.nuova = false; I.bozza = null; render(); },
    i_modifica(v) { I.modif = v; I.det = null; scrollTo(0, 0); render(); }, i_riprova() { errore = ""; caricato = false; render(); },
    async i_sono(nome) {
      if (avviando) return; avviando = true; dire("Accesso in corso…"); render();
      const lento = new Promise((_, no) => setTimeout(() => no(new Error("Il collegamento è lento o si è bloccato: chiudi e riapri l'app, poi riprova.")), 15000));
      try {
        const id = await Promise.race([q(cl.rpc("entra", { p_codice: GRUPPO, p_nome: nome })), lento]);
        camp = gruppoVis; me = { id, nome, user_id: uid }; errore = ""; dire(`Benvenuto, ${nome}.`); render();   /* subito, poi i dati */
        await Promise.race([apri(GRUPPO), lento]);
      } catch (e) { dire(traduci(e), "avv"); if (!me || !camp) { camp = null; me = null; } }
      avviando = false; render();
    },
    i_vota(v) { const [id, n] = v.split("|"), val2 = +n, m = mioVoto(id); return esegui(async () => { if (m === val2) await q(cl.from("votes").delete().eq("proposal_id", id).eq("participant_id", me.id)); else await q(cl.from("votes").upsert({ proposal_id: id, participant_id: me.id, valore: val2 }, { onConflict: "proposal_id,participant_id" })); }); },
    i_stato(v) { const [id, n] = v.split("|"); return esegui(() => q(cl.from("proposals").update({ stato: +n }).eq("id", id))); },
    i_elimina(v) { if (confirm("Eliminare questa idea, con voti e commenti?")) return esegui(async () => { await q(cl.from("proposals").delete().eq("id", v)); I.det = null; }, "Idea eliminata.").then(render); }
  });
  Object.assign(moduli, {
    async i_idea(f) {
      const id = val(f, "id"), link = linkOk(val(f, "link")), g = val(f, "giorno");
      const d = { titolo: val(f, "titolo"), categoria: val(f, "categoria"), descrizione: val(f, "nota"), sito_url: link, giorno: g ? Math.max(1, Math.min(5, parseInt(g, 10) || 1)) : null };
      await esegui(async () => {
        if (id) await q(cl.from("proposals").update(d).eq("id", id));
        else { const r = await q(cl.from("proposals").insert({ ...d, campaign_id: camp.id, participant_id: me.id }).select("id").single()); viste.add(r.id); await q(cl.from("votes").upsert({ proposal_id: r.id, participant_id: me.id, valore: 1 }, { onConflict: "proposal_id,participant_id" })); }
        I.modif = null; I.nuova = false; I.bozza = null;
      }, id ? "Idea aggiornata." : "Idea aggiunta: il tuo Sì è già registrato."); render();
    }
  });
  /* idea precompilata da «Condividi» di un'altra app (TikTok, Instagram, Maps): il modulo si apre già scritto */
  const precompila = b => { I.bozza = { titolo: b.testo || "", sito_url: b.link || "", descrizione: b.nota || "" }; I.nuova = true; };
  return { contesto: () => ({ cl, camp, me }), aggiorna: () => { if (camp) ricarica(); }, vistaIdee, banner, sveglia, precompila, approvate: () => P.filter(p => p.stato === 1).map(p => ({ id: p.id, titolo: p.titolo, categoria: p.categoria, descrizione: p.descrizione || "", giorno: p.giorno || 0, created_at: p.created_at, autore: nomeDi(p.participant_id), note_org: p.note_org || "", zona: p.zona || "", indirizzo: p.indirizzo || "", maps_url: p.maps_url || "" })), daVotare: () => (me ? P.filter(daVotareI).length : 0), filtraMie: () => { I.s = "mie"; } };
})();

if (typeof condiviso !== "undefined" && condiviso) Sond.precompila(condiviso);
setTimeout(() => Sond.sveglia(), 1800);
