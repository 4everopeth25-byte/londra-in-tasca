"use strict";
/* Mappa offline di Londra: scarico dei dati (una volta, con la rete), mappa vettoriale (MapLibre + PMTiles letto dalla memoria del telefono),
   posizione dal GPS, percorsi a piedi (grafo OpenStreetMap) e in metro (rete TfL). Dopo il download non serve nessun servizio esterno.
   Usa le funzioni di app.js (esc, render, azioni, toast, ic, mapsUrl, oggiIso, TRIP, g). */
const Mappa = (() => {
  const CFG = TRIP.mappa, CACHE = "dati-londra", BB = CFG.bbox, LONDRA = CFG.londra;
  const base = () => (/^https?:/.test(CFG.url) ? CFG.url : new URL(CFG.url, location.href).href);
  const url = f => base() + f.nome;
  const dir = () => location.origin + location.pathname.replace(/[^/]*$/, "");
  const MB = n => (n / 1e6).toFixed(0).replace(/^0$/, "1");
  let st = { fase: "controllo", pct: 0, mb: 0, errore: "" }, ctrl = null, map = null, caricandoMappa = null, G = null, MET = null, box = null;
  let pos = null, watch = 0, permesso = "sconosciuto", seg = [], giornoM = null, da = "gps", a = "", passeggino = true, piani = [], scelto = 0, destMappa = null, marcatori = [], marcDest = null, trovando = false;
  const dentro = (b, la, lo) => lo >= b[0] && lo <= b[2] && la >= b[1] && la <= b[3];
  const hav = (la1, lo1, la2, lo2) => { const p = Math.PI / 180, x = (lo2 - lo1) * p * Math.cos((la1 + la2) / 2 * p), y = (la2 - la1) * p; return 6371000 * Math.hypot(x, y); };
  const km = m => (m >= 950 ? (m / 1000).toFixed(1).replace(".", ",") + " km" : Math.round(m / 10) * 10 + " m");
  const minuti = s => Math.max(1, Math.round(s / 60)) + " min";
  const aggiorna = () => { const e = document.getElementById("mappa-stato"), p = document.getElementById("mappa-pos"); if (e) e.innerHTML = cartaStato(); if (p) p.innerHTML = cartaPosizione(); };
  const luoghi = () => {
    const l = [{ id: "casa", nome: "Alloggio", ll: TRIP.alloggio.ll }];
    TRIP.giorni.forEach((d, i) => d.tappe.forEach((t, k) => { if (t.ll) l.push({ id: `${i}-${k}`, nome: `${t.nome}`, ll: t.ll, giorno: i, ora: t.ora }); }));
    return l.filter(x => x.ll);
  };
  const luogo = id => (id === "mappa" ? destMappa : id === "gps" ? (pos && { nome: "La mia posizione", ll: [pos.lat, pos.lon] }) : luoghi().find(x => x.id === id));

  /* ---------- dati sul telefono ---------- */
  async function controlla() {
    try {
      if (!("caches" in window)) throw new Error("no");
      const c = await caches.open(CACHE), r = await Promise.all(CFG.file.map(f => c.match(url(f))));
      st = r.every(Boolean) ? { fase: "pronta" } : { fase: "assente" };
    } catch { st = { fase: "errore", errore: "Questo browser non può salvare la mappa sul telefono." }; }
    aggiorna();
  }
  async function scarica() {
    if (st.fase === "scarico") return;
    if (!navigator.onLine) { st = { fase: "errore", errore: "Serve la rete per scaricare la mappa: riprova con il Wi-Fi." }; aggiorna(); return; }
    st = { fase: "scarico", pct: 0, mb: 0 }; ctrl = new AbortController(); aggiorna();
    try {
      try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch { /* ok */ }
      const c = await caches.open(CACHE), tot = CFG.file.reduce((s, f) => s + f.byte, 0); let fatti = 0, ultimo = 0;
      for (const f of CFG.file) {
        const r = await fetch(url(f), { signal: ctrl.signal, cache: "no-store" }); if (!r.ok) throw new Error(`Scaricamento non riuscito (${r.status}).`);
        const rd = r.body.getReader(), parti = []; let n = 0;
        for (;;) {
          const { done, value } = await rd.read(); if (done) break;
          parti.push(value); n += value.length; fatti += value.length;
          if (Date.now() - ultimo > 250) { ultimo = Date.now(); st.pct = Math.min(99, Math.round(fatti / tot * 100)); st.mb = fatti / 1e6; aggiorna(); }
        }
        if (n !== f.byte) throw new Error("File incompleto: riprova.");
        await c.put(url(f), new Response(new Blob(parti), { headers: { "content-type": "application/octet-stream" } }));
      }
      st = { fase: "pronta" };
      try { localStorage.setItem("lit-mappa-ok", String(Date.now())); } catch { /* ok */ }
      if (typeof toast === "function") toast("Mappa di Londra scaricata: funziona anche senza rete.", () => { vsub = "mappa"; azioni.tab("viaggio"); });
    } catch (e) {
      st = e && e.name === "AbortError" ? { fase: "assente" } : { fase: "errore", errore: e && e.name === "QuotaExceededError" ? "Spazio insufficiente sul telefono: libera un po' di memoria e riprova." : ((e && e.message) || "Scaricamento non riuscito.") };
    }
    ctrl = null; aggiorna(); if (typeof render === "function" && tab === "viaggio" && vsub === "mappa") { render(); monta(); }
  }
  async function elimina() {
    if (!confirm("Togliere dal telefono la mappa e i percorsi offline? Si possono scaricare di nuovo.")) return;
    try { await caches.delete(CACHE); } catch { /* ok */ }
    G = null; if (map) { try { map.remove(); } catch { /* ok */ } map = null; caricandoMappa = null; if (box) box.replaceChildren(); }
    piani = []; st = { fase: "assente" }; try { localStorage.removeItem("lit-mappa-ok"); } catch { /* ok */ } render(); monta();
  }

  /* ---------- posizione ---------- */
  async function leggiPermesso() {
    try { const p = await navigator.permissions.query({ name: "geolocation" }); permesso = p.state; p.onchange = () => { permesso = p.state; aggiorna(); }; } catch { /* Safari: nessuna interrogazione */ }
    return permesso;
  }
  function seguiPosizione() {
    if (!navigator.geolocation) { permesso = "non-disponibile"; aggiorna(); return; }
    if (watch) return; trovando = true; aggiorna();
    watch = navigator.geolocation.watchPosition(p => {
      trovando = false; permesso = "granted"; pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, ts: p.timestamp }; disegnaMe(); aggiorna();
      if (map && !map._centrato) { map._centrato = true; if (dentro(BB, pos.lat, pos.lon)) map.easeTo({ center: [pos.lon, pos.lat], zoom: Math.max(map.getZoom(), 15) }); }
      if (piani.length && da === "gps") controllaRotta();
    }, e => { trovando = false; watch = 0; permesso = e.code === 1 ? "denied" : permesso; pos = e.code === 1 ? null : pos; if (e.code !== 1) permesso = "errore"; aggiorna(); }, { enableHighAccuracy: true, maximumAge: 4000, timeout: 25000 });
  }
  function fermaPosizione() { if (watch) navigator.geolocation.clearWatch(watch); watch = 0; pos = null; disegnaMe(); aggiorna(); }
  function cerchio(lat, lon, r) { const o = []; for (let i = 0; i <= 48; i++) { const t = i / 48 * 2 * Math.PI; o.push([lon + r * Math.sin(t) / (111320 * Math.cos(lat * Math.PI / 180)), lat + r * Math.cos(t) / 110540]); } return o; }
  function disegnaMe() {
    if (!map || !map.getSource("me")) return;
    map.getSource("me").setData({ type: "FeatureCollection", features: pos ? [{ type: "Feature", properties: { t: "punto" }, geometry: { type: "Point", coordinates: [pos.lon, pos.lat] } }, { type: "Feature", properties: { t: "precisione" }, geometry: { type: "Polygon", coordinates: [cerchio(pos.lat, pos.lon, Math.min(pos.acc || 30, 400))] } }] : [] });
  }
  /* all'apertura dell'app: se il permesso c'è già e si è a Londra senza dati, scarica da solo (su rete mobile prima chiede) */
  async function avvio() {
    await controlla(); if (st.fase !== "assente" || !navigator.onLine || !navigator.geolocation) return;
    try { if (localStorage.getItem("lit-mappa-no-auto")) return; } catch { /* ok */ }
    if ((await leggiPermesso()) !== "granted") return;
    navigator.geolocation.getCurrentPosition(p => {
      if (!dentro(LONDRA, p.coords.latitude, p.coords.longitude) || st.fase !== "assente") return;
      const c = navigator.connection; if (c && c.saveData) return;
      if (c && c.type === "cellular" && typeof toast === "function") toast(`Sei a Londra senza la mappa offline. Scaricare ${MB(CFG.file.reduce((s, f) => s + f.byte, 0))} MB con la rete mobile?`, scarica);
      else scarica();
    }, () => {}, { enableHighAccuracy: false, maximumAge: 600000, timeout: 8000 });
  }

  /* ---------- mappa ---------- */
  const script = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => no(new Error("Libreria non caricata: " + src)); document.head.append(s); });
  async function iniziaMappa() {
    if (map || caricandoMappa) return caricandoMappa;
    caricandoMappa = (async () => {
      if (!document.getElementById("css-maplibre")) { const l = document.createElement("link"); l.id = "css-maplibre"; l.rel = "stylesheet"; l.href = "vendor/maplibre-gl.css"; document.head.append(l); }
      if (!window.maplibregl) await script("vendor/maplibre-gl-csp.js");
      if (!window.pmtiles) await script("vendor/pmtiles.js");
      maplibregl.setWorkerUrl(new URL("vendor/maplibre-gl-csp-worker.js", location.href).href);
      const blob = await (await (await caches.open(CACHE)).match(url(CFG.file[0]))).blob();
      const sorgente = { getKey: () => "londra", getBytes: async (o, l) => ({ data: await blob.slice(o, o + l).arrayBuffer() }) };
      const proto = new pmtiles.Protocol(); maplibregl.addProtocol("pmtiles", proto.tile); proto.add(new pmtiles.PMTiles(sorgente));
      const stile = await (await fetch("mappa/stile.json")).json(); stile.glyphs = dir() + "mappa/fonts/{fontstack}/{range}.pbf";
      map = new maplibregl.Map({ container: box, style: stile, center: [-0.1276, 51.5072], zoom: 12, minZoom: 9.5, maxZoom: 18.5, maxBounds: [[BB[0] - 0.08, BB[1] - 0.06], [BB[2] + 0.08, BB[3] + 0.06]], dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true }, fadeDuration: 0 });
      map.touchZoomRotate.disableRotation(); map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        map.addSource("rotta", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "rotta-bordo", type: "line", source: "rotta", paint: { "line-color": "#fff", "line-width": 9, "line-opacity": .9 }, layout: { "line-cap": "round", "line-join": "round" } });
        map.addLayer({ id: "rotta", type: "line", source: "rotta", paint: { "line-color": ["get", "colore"], "line-width": 5 }, layout: { "line-cap": "round", "line-join": "round" } });
        map.addSource("me", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "me-prec", type: "fill", source: "me", filter: ["==", ["get", "t"], "precisione"], paint: { "fill-color": "#1a73e8", "fill-opacity": .15 } });
        map.addLayer({ id: "me-bordo", type: "circle", source: "me", filter: ["==", ["get", "t"], "punto"], paint: { "circle-radius": 11, "circle-color": "#fff" } });
        map.addLayer({ id: "me", type: "circle", source: "me", filter: ["==", ["get", "t"], "punto"], paint: { "circle-radius": 7.5, "circle-color": "#1a73e8" } });
        disegnaMe(); segnaposti(); if (piani[scelto]) disegnaRotta(piani[scelto]);
      });
      map.on("click", e => { destMappa = { nome: "Punto scelto sulla mappa", ll: [e.lngLat.lat, e.lngLat.lng] }; a = "mappa"; disegnaDest(); render(); monta(); });
    })();
    try { await caricandoMappa; } catch (e) { caricandoMappa = null; st = { fase: "errore", errore: "Mappa non avviata: " + e.message }; aggiorna(); }
  }
  function segnaposti() {
    if (!map || !window.maplibregl) return; marcatori.forEach(m => m.remove()); marcatori = [];
    const gi = giornoM === null ? g : giornoM, d = TRIP.giorni[gi]; let n = 0;
    d.tappe.forEach(t => { if (!t.ll) return; n++; const el = document.createElement("button"); el.className = "pin-tappa"; el.type = "button"; el.textContent = n; el.setAttribute("aria-label", `${t.nome}, ${t.ora || ""}`);
      el.onclick = ev => { ev.stopPropagation(); a = `${gi}-${d.tappe.indexOf(t)}`; render(); monta(); };
      marcatori.push(new maplibregl.Marker({ element: el }).setLngLat([t.ll[1], t.ll[0]]).addTo(map)); });
  }
  function disegnaDest() {
    if (!map || !window.maplibregl) return; if (marcDest) { marcDest.remove(); marcDest = null; }
    const l = luogo(a); if (!l || !l.ll) return; const el = document.createElement("div"); el.className = "pin-meta"; marcDest = new maplibregl.Marker({ element: el }).setLngLat([l.ll[1], l.ll[0]]).addTo(map);
  }
  function monta() {
    const s = document.getElementById("mappa-segnaposto"); if (!s) return;
    if (!box) { box = document.createElement("div"); box.id = "mappa-box"; box.className = "mappa-box"; }
    s.appendChild(box);
    if (st.fase === "controllo") controlla();
    if (st.fase === "pronta") { if (!map) iniziaMappa().then(() => { if (map) { map.resize(); segnaposti(); disegnaDest(); } }); else { map.resize(); segnaposti(); disegnaDest(); } }
    aggiorna();
  }

  /* ---------- percorso a piedi ---------- */
  const FATT = [0.95, 1.0, 1.05, 1.15, 1.1], VEL = 1.25;
  async function caricaGrafo() {
    if (G) return G;
    const r = await (await caches.open(CACHE)).match(url(CFG.file[1])); if (!r) throw new Error("Dati del percorso non presenti: scarica la mappa.");
    const buf = await new Response(r.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer(), dv = new DataView(buf);
    if (String.fromCharCode(...new Uint8Array(buf, 0, 4)) !== "LPG1") throw new Error("Dati del percorso non validi.");
    const [n, m, np, nn, nb] = [4, 8, 12, 16, 20].map(o => dv.getUint32(o, true)); let o = 24;
    const prendi = (T, c) => { const b = T.BYTES_PER_ELEMENT * c, x = new T(buf.slice(o, o + b)); o += b; return x; };
    const lat = prendi(Int32Array, n), lon = prendi(Int32Array, n), ed = prendi(Uint32Array, m), ea = prendi(Uint32Array, m), lun = prendi(Uint16Array, m), cls = prendi(Uint8Array, m), nome = prendi(Uint32Array, m), pin = prendi(Uint32Array, m + 1), poly = prendi(Int16Array, np * 2), lens = prendi(Uint16Array, nn);
    const td = new TextDecoder(), nomi = []; let p = o; for (let i = 0; i < nn; i++) { nomi.push(td.decode(new Uint8Array(buf, p, lens[i]))); p += lens[i]; }
    const deg = new Uint32Array(n + 1); for (let e = 0; e < m; e++) { deg[ed[e] + 1]++; deg[ea[e] + 1]++; }
    for (let i = 0; i < n; i++) deg[i + 1] += deg[i];
    const ini = deg, pos2 = ini.slice(0, n), adj = new Uint32Array(2 * m);
    for (let e = 0; e < m; e++) { adj[pos2[ed[e]]++] = e * 2; adj[pos2[ea[e]]++] = e * 2 + 1; }
    const griglia = new Map(), ck = (la, lo) => Math.floor(la / 2000) * 100000 + Math.floor(lo / 3000);
    for (let i = 0; i < n; i++) { const k = ck(lat[i], lon[i]); (griglia.get(k) || griglia.set(k, []).get(k)).push(i); }
    /* componenti connesse: le mete si agganciano solo alla rete principale, per non finire su un tratto isolato */
    const comp = new Int32Array(n).fill(-1); let migliore = 0, mc = -1, nc = 0; const pila = new Uint32Array(n);
    for (let i = 0; i < n; i++) { if (comp[i] >= 0) continue; let top = 0, cnt = 0; pila[top++] = i; comp[i] = nc;
      while (top) { const u = pila[--top]; cnt++; for (let k = ini[u]; k < ini[u + 1]; k++) { const e = adj[k] >> 1, v = (adj[k] & 1) ? ed[e] : ea[e]; if (comp[v] < 0) { comp[v] = nc; pila[top++] = v; } } }
      if (cnt > migliore) { migliore = cnt; mc = nc; } nc++; }
    G = { n, m, lat, lon, ed, ea, lun, cls, nome, pin, poly, nomi, ini, adj, griglia, ck, comp, mc };
    return G;
  }
  function piuVicino(la, lo) {
    const { lat, lon, griglia } = G; let best = -1, bd = Infinity; const c0 = [Math.floor(la * 1e6 / 2000), Math.floor(lo * 1e6 / 3000)];
    for (let r = 0; r < 12; r++) {
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const l = griglia.get((c0[0] + dx) * 100000 + (c0[1] + dy)); if (!l) continue;
        for (const i of l) { if (G.comp[i] !== G.mc) continue; const d = hav(la, lo, lat[i] / 1e6, lon[i] / 1e6); if (d < bd) { bd = d; best = i; } }
      }
      if (best >= 0 && bd < r * 150) break;
    }
    return best < 0 ? null : { i: best, d: bd };
  }
  function costo(e, o) {
    const c = G.cls[e]; let f = FATT[c & 15] || 1.1, t;
    if (c & 16) { if (o.passeggino) return Infinity; f *= 2.2; }
    t = G.lun[e] / o.vel * f; if (c & 32) t += 12; return t;
  }
  function aStella(s, t, o) {
    const { n, lat, lon, ed, ea, ini, adj } = G, g = new Float32Array(n).fill(Infinity), prima = new Int32Array(n).fill(-1), fatto = new Uint8Array(n);
    const hk = [], hn = []; const push = (k, v) => { let i = hk.length; hk.push(k); hn.push(v); while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= k) break; hk[i] = hk[p]; hn[i] = hn[p]; i = p; } hk[i] = k; hn[i] = v; };
    const pop = () => { const v = hn[0], k0 = hk.pop(), n0 = hn.pop(); if (hk.length) { let i = 0; const L = hk.length; for (;;) { let c = 2 * i + 1; if (c >= L) break; if (c + 1 < L && hk[c + 1] < hk[c]) c++; if (hk[c] >= k0) break; hk[i] = hk[c]; hn[i] = hn[c]; i = c; } hk[i] = k0; hn[i] = n0; } return v; };
    const tl = lat[t] / 1e6, to = lon[t] / 1e6, h = u => hav(lat[u] / 1e6, lon[u] / 1e6, tl, to) / o.vel * 0.88;
    g[s] = 0; push(h(s), s); let esp = 0;
    while (hk.length) {
      const u = pop(); if (fatto[u]) continue; fatto[u] = 1; if (u === t) break; if (++esp > 900000) break;
      for (let k = ini[u]; k < ini[u + 1]; k++) { const ee = adj[k], e = ee >> 1, v = (ee & 1) ? ed[e] : ea[e], c = costo(e, o); if (c === Infinity) continue; const ng = g[u] + c; if (ng < g[v]) { g[v] = ng; prima[v] = ee; push(ng + h(v), v); } }
    }
    if (!isFinite(g[t])) return null;
    const arc = []; for (let v = t; v !== s;) { const ee = prima[v]; arc.push(ee); v = (ee & 1) ? ea[ee >> 1] : ed[ee >> 1]; } arc.reverse();
    return { arc, sec: g[t] };
  }
  function geomArco(ee) {
    const { lat, lon, ed, ea, pin, poly } = G, e = ee >> 1, pts = []; let la = lat[ed[e]], lo = lon[ed[e]]; pts.push([lo / 1e6, la / 1e6]);
    for (let k = pin[e]; k < pin[e + 1]; k++) { la += poly[2 * k] * 10; lo += poly[2 * k + 1] * 10; pts.push([lo / 1e6, la / 1e6]); }
    pts.push([lon[ea[e]] / 1e6, lat[ea[e]] / 1e6]); return (ee & 1) ? pts.reverse() : pts;
  }
  const rotta = async (p1, p2, o) => {
    let r = await rotta1(p1, p2, o);
    if (!r && o.passeggino) { r = await rotta1(p1, p2, { ...o, passeggino: false }); if (r) r.conScale = true; }
    return r;
  };
  const rotta1 = async (p1, p2, o) => {
    await caricaGrafo(); const s = piuVicino(p1[0], p1[1]), t = piuVicino(p2[0], p2[1]); if (!s || !t || s.d > 900 || t.d > 900) return null;
    const r = s.i === t.i ? { arc: [], sec: 0 } : aStella(s.i, t.i, o); if (!r) return null;
    let linea = [[p1[1], p1[0]]]; let tot = 0; const grezzi = [];
    for (const ee of r.arc) { const gm = geomArco(ee), e = ee >> 1; linea.push(...gm); tot += G.lun[e]; grezzi.push({ nome: G.nomi[G.nome[e]] || "", m: G.lun[e], pts: gm, scale: !!(G.cls[e] & 16) }); }
    const passi = []; for (const x of grezzi) { const u = passi[passi.length - 1]; if (u && u.nome === x.nome && u.scale === x.scale) { u.m += x.m; u.pts = u.pts.concat(x.pts); } else passi.push({ ...x }); }
    for (let k = 0; k < passi.length;) { const x = passi[k]; if (passi.length > 1 && x.m < 25 && !x.scale) { const v = passi[k > 0 ? k - 1 : k + 1]; v.m += x.m; v.pts = k > 0 ? v.pts.concat(x.pts) : x.pts.concat(v.pts); passi.splice(k, 1); const w = passi[k > 0 ? k - 1 : 0], n2 = passi[k]; if (w && n2 && w !== n2 && w.nome === n2.nome && w.scale === n2.scale) { w.m += n2.m; w.pts = w.pts.concat(n2.pts); passi.splice(k, 1); } } else k++; }
    passi.forEach(p => { p.in = rumo(p.pts, false); p.dir = rumo(p.pts, true); });
    linea.push([p2[1], p2[0]]);
    const conn = s.d + t.d; tot += conn;
    return { linea, passi, m: tot, sec: r.sec + conn / o.vel, conn, scale: passi.some(p => p.scale) };
  };
  const bearing = (a1, b1) => (Math.atan2((b1[0] - a1[0]) * Math.cos(a1[1] * Math.PI / 180), b1[1] - a1[1]) * 180 / Math.PI + 360) % 360;
  const diffAng = (x, y) => ((x - y + 540) % 360) - 180;
  /* direzione di un tratto, misurata su circa 25 m dall'inizio (o dalla fine) per non farsi ingannare dai vertici vicini */
  function rumo(pts, fine) {
    const q = fine ? pts.slice().reverse() : pts; let acc = 0, k = 1;
    for (; k < q.length - 1; k++) { acc += hav(q[k - 1][1], q[k - 1][0], q[k][1], q[k][0]); if (acc >= 25) break; }
    const r = bearing(q[0], q[Math.min(k, q.length - 1)]); return fine ? (r + 180) % 360 : r;
  }
  const dove = p => (p.nome ? `su ${p.nome}` : p.scale ? "sulle scale" : "sul percorso pedonale");
  function istruzioni(passi) {
    return passi.map((p, i) => {
      if (i === 0) return `Parti e cammina ${dove(p)} per ${km(p.m)}`;
      const d = diffAng(p.in, passi[i - 1].dir), ad = Math.abs(d), lato = d > 0 ? "destra" : "sinistra";
      const verbo = ad < 25 ? "Prosegui" : ad < 60 ? `Svolta leggermente a ${lato}` : ad < 135 ? `Gira a ${lato}` : "Torna indietro";
      return `${verbo} ${dove(p)} per ${km(p.m)}`;
    });
  }

  /* ---------- metro ---------- */
  async function caricaMetro() { if (!MET) MET = await (await fetch("mappa/metro.json")).json(); return MET; }
  const VM = { tube: 11, dlr: 8, "elizabeth-line": 15, overground: 11 }, SOSTA = 35, ATTESA = 180, CAMBIO = 150;
  function lineeAttive() { const oggi = oggiIso(); if (oggi === "2026-12-25") return null; return MET.l.map(l => !(oggi === "2026-12-26" && l[0] === "elizabeth")); }
  function dijkstraMetro(s0, attive) {
    const S = MET.s.length, L = MET.l.length, N = S * L, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), servite = Array.from({ length: S }, () => []);
    const vic = Array.from({ length: N }, () => []);
    MET.e.forEach(([x, y, l, d]) => { if (!attive[l]) return; const t = d / (VM[MET.l[l][3]] || 11) + SOSTA; vic[x * L + l].push([y * L + l, t]); vic[y * L + l].push([x * L + l, t]); if (!servite[x].includes(l)) servite[x].push(l); if (!servite[y].includes(l)) servite[y].push(l); });
    const coda = [];
    for (const l of servite[s0]) { dist[s0 * L + l] = ATTESA; coda.push([ATTESA, s0 * L + l]); }
    while (coda.length) {
      let k = 0; for (let i = 1; i < coda.length; i++) if (coda[i][0] < coda[k][0]) k = i; const [d, u] = coda.splice(k, 1)[0]; if (d > dist[u]) continue;
      const st0 = Math.floor(u / L), l0 = u % L;
      for (const [v, t] of vic[u]) if (d + t < dist[v]) { dist[v] = d + t; prev[v] = u; coda.push([d + t, v]); }
      for (const l of servite[st0]) if (l !== l0 && d + CAMBIO < dist[st0 * L + l]) { dist[st0 * L + l] = d + CAMBIO; prev[st0 * L + l] = u; coda.push([d + CAMBIO, st0 * L + l]); }
    }
    return { dist, prev, L };
  }
  function legMetro(R, fine) {
    const { dist, prev, L } = R; let best = -1, bd = Infinity; for (let l = 0; l < L; l++) if (dist[fine * L + l] < bd) { bd = dist[fine * L + l]; best = fine * L + l; }
    if (best < 0) return null; const catena = []; for (let u = best; u >= 0; u = prev[u]) catena.push(u); catena.reverse();
    const tratti = []; for (const u of catena) { const s = Math.floor(u / L), l = u % L, ult = tratti[tratti.length - 1]; if (ult && ult.l === l) { if (ult.stazioni[ult.stazioni.length - 1] !== s) ult.stazioni.push(s); } else if (!ult || ult.stazioni[ult.stazioni.length - 1] !== s || ult.l !== l) tratti.push({ l, stazioni: [s] }); }
    const veri = tratti.filter(t => t.stazioni.length > 1); return { sec: bd, tratti: veri };
  }
  async function pianoMetro(p1, p2, o, pedonale) {
    await caricaMetro(); const attive = lineeAttive(); if (!attive) return { errore: "Il 25 dicembre la metro non circola." };
    const cand = (p, n) => MET.s.map((s, i) => [hav(p[0], p[1], s[1], s[2]), i]).sort((x, y) => x[0] - y[0]).slice(0, n).filter(x => x[0] < 2000);
    const cs = cand(p1, 4), ce = cand(p2, 4); if (!cs.length || !ce.length) return { errore: "Nessuna stazione vicina alla partenza o all'arrivo." };
    let mig = null;
    for (const [ds, si] of cs) { const R = dijkstraMetro(si, attive); for (const [de, ei] of ce) { if (si === ei) continue; const leg = legMetro(R, ei); if (!leg) continue; const tot = ds * 1.35 / o.vel + leg.sec + de * 1.35 / o.vel; if (!mig || tot < mig.tot) mig = { tot, si, ei, leg }; } }
    if (!mig) return { errore: "Nessun collegamento in metro trovato." };
    const A = MET.s[mig.si], B = MET.s[mig.ei], w1 = await rotta(p1, [A[1], A[2]], o), w2 = await rotta([B[1], B[2]], p2, o); if (!w1 || !w2) return { errore: "Percorso a piedi verso le stazioni non trovato." };
    const linee = [{ t: "piedi", linea: w1.linea }]; const passi = [{ tipo: "piedi", testo: `A piedi fino a ${A[0]}: ${km(w1.m)}, ${minuti(w1.sec)}` }];
    mig.leg.tratti.forEach((tr, i) => { const li = MET.l[tr.l], pts = tr.stazioni.map(s => [MET.s[s][2], MET.s[s][1]]); linee.push({ t: "metro", colore: li[2], linea: pts });
      passi.push({ tipo: "metro", colore: li[2], testo: `${i ? "Cambia e prendi" : "Prendi"} la ${li[1]} da ${MET.s[tr.stazioni[0]][0]} a ${MET.s[tr.stazioni[tr.stazioni.length - 1]][0]}: ${tr.stazioni.length - 1} ${tr.stazioni.length === 2 ? "fermata" : "fermate"}` }); });
    passi.push({ tipo: "piedi", testo: `Esci a ${B[0]} e cammina fino alla meta: ${km(w2.m)}, ${minuti(w2.sec)}` });
    linee.push({ t: "piedi", linea: w2.linea });
    return { sec: w1.sec + mig.leg.sec + w2.sec, m: w1.m + w2.m, linee, passi, nota: "Tempi stimati con orari medi: ritardi, chiusure e lavori non sono inclusi." + (o.passeggino ? " Nelle stazioni controlla gli ascensori per il passeggino." : "") };
  }

  /* ---------- calcolo e disegno ---------- */
  async function calcola() {
    const L1 = luogo(da), L2 = luogo(a);
    if (!L1 || !L2) { piani = [{ errore: da === "gps" ? "La posizione non è ancora disponibile: tocca «Usa la mia posizione» oppure scegli una partenza dall'elenco." : "Scegli la partenza e la meta." }]; render(); monta(); return; }
    const o = { vel: passeggino ? 1.1 : VEL, passeggino };
    piani = [{ attesa: true }]; render(); monta();
    try {
      const w = await rotta(L1.ll, L2.ll, o);
      const out = [];
      if (w) out.push({ tipo: "piedi", titolo: "A piedi", sec: w.sec, m: w.m, linee: [{ t: "piedi", linea: w.linea }], passi: istruzioni(w.passi).map(t => ({ tipo: "piedi", testo: t })), fine: `Arrivo: ${L2.nome}`, nota: w.scale ? "Il percorso comprende delle scale: con il passeggino cerca un ascensore o una rampa vicina." : "" });
      else out.push({ errore: "Percorso a piedi non trovato: partenza o meta fuori dall'area della mappa, oppure raggiungibile solo con le scale (prova a togliere «Evita le scale»)." });
      let met = null; try { met = await pianoMetro(L1.ll, L2.ll, o); } catch { met = { errore: "Percorso in metro non disponibile." }; }
      if (met && !met.errore) out.push(Object.assign({ tipo: "metro", titolo: "Con la metro" }, met)); else if (met) out.push({ tipo: "metro", titolo: "Con la metro", nota: met.errore, errore: met.errore, soft: true });
      const ok = out.filter(x => !x.errore).sort((x, y) => x.sec - y.sec); if (ok.length > 1 && ok[0].tipo === "metro" && ok[1].sec - ok[0].sec > 120) ok[0].consigliato = true; else if (ok.length) ok[0].consigliato = true;
      piani = out; scelto = Math.max(0, out.findIndex(x => x.consigliato));
    } catch (e) { piani = [{ errore: "Calcolo non riuscito: " + ((e && e.message) || "errore") }]; }
    render(); monta(); if (piani[scelto] && !piani[scelto].errore) disegnaRotta(piani[scelto]);
  }
  function disegnaRotta(p) {
    if (!map || !map.getSource || !map.getSource("rotta") || !p || p.errore) return;
    const feat = p.linee.map(l => ({ type: "Feature", properties: { t: l.t === "metro" ? "metro" : "piedi", colore: l.t === "metro" ? l.colore : "#1a5f9e" }, geometry: { type: "LineString", coordinates: l.linea } }));
    map.getSource("rotta").setData({ type: "FeatureCollection", features: feat });
    const pts = p.linee.flatMap(l => l.linea), b = pts.reduce((r, c) => [Math.min(r[0], c[0]), Math.min(r[1], c[1]), Math.max(r[2], c[0]), Math.max(r[3], c[1])], [180, 90, -180, -90]);
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, maxZoom: 17, duration: 600 });
  }
  function controllaRotta() { /* avviso se ci si allontana molto dal percorso: ricalcolo su richiesta */ }

  /* ---------- schermata ---------- */
  function cartaStato() {
    const tot = CFG.file.reduce((s, f) => s + f.byte, 0);
    if (st.fase === "controllo") return `<div class="nome">Mappa offline</div><div class="desc">Controllo in corso.</div>`;
    if (st.fase === "scarico") return `<div class="nome">Scarico la mappa di Londra</div><progress max="100" value="${st.pct}" aria-label="Avanzamento del download"></progress><div class="desc" role="status">${st.pct}%, ${st.mb.toFixed(0)} di ${MB(tot)} MB. Tieni aperta l'app.</div><div class="riga"><button class="btn" data-az="m_annulla">Annulla</button></div>`;
    if (st.fase === "pronta") return `<div class="nome">Mappa offline pronta<span class="et">sul telefono</span></div><div class="desc">Mappa, percorsi a piedi e metro funzionano anche in modalità aereo. Dati © OpenStreetMap, Protomaps e Transport for London.</div><div class="riga"><button class="btn" data-az="m_elimina">Togli dal telefono</button></div>`;
    if (st.fase === "errore") return `<div class="nome">Mappa offline</div><div class="msg avv" role="alert">${esc(st.errore)}</div><div class="riga"><button class="btn pri" data-az="m_scarica">Riprova</button></div>`;
    return `<div class="nome">Mappa offline non ancora sul telefono</div><div class="desc">Il pacchetto (mappa e percorsi di Londra centrale) pesa circa ${MB(tot)} MB. Scaricalo adesso con il Wi-Fi: dopo funziona anche senza SIM e senza rete.</div><div class="riga"><button class="btn pri" data-az="m_scarica">Scarica la mappa (${MB(tot)} MB)</button></div>`;
  }
  function cartaPosizione() {
    const fuori = pos && !dentro(LONDRA, pos.lat, pos.lon);
    let t = "La posizione non è attiva.";
    if (permesso === "denied") t = "Il permesso per la posizione è negato: riattivalo nelle impostazioni del browser per questo sito.";
    else if (permesso === "non-disponibile") t = "Questo telefono non fornisce la posizione al browser.";
    else if (trovando) t = "Cerco la posizione, può servire qualche secondo all'aperto…";
    else if (pos) t = fuori ? "Sei fuori da Londra: scegli la partenza dall'elenco." : `Posizione attiva, precisione circa ${km(pos.acc || 0)}.`;
    else if (permesso === "errore") t = "Posizione non disponibile al momento: prova all'aperto.";
    return `<div class="nome">Posizione</div><div class="desc" role="status">${esc(t)} Il GPS funziona anche senza rete, ma non in galleria o sottoterra.</div>
      <div class="riga">${watch ? `<button class="btn" data-az="m_pos_off">Smetti di seguirmi</button>` : `<button class="btn pri" data-az="m_pos">Usa la mia posizione</button>`}</div>`;
  }
  function opzioni(sel, conGps) {
    const gruppi = [`<option value="casa"${sel === "casa" ? " selected" : ""}>Alloggio</option>`];
    TRIP.giorni.forEach((d, i) => { const o = d.tappe.map((t, k) => (t.ll ? `<option value="${i}-${k}"${sel === `${i}-${k}` ? " selected" : ""}>${esc((t.ora && !/^[A-Z]/.test(t.ora) ? t.ora.replace("~", "") + " " : "") + t.nome)}</option>` : "")).join(""); if (o) gruppi.push(`<optgroup label="${esc(d.breve)}">${o}</optgroup>`); });
    if (destMappa) gruppi.push(`<option value="mappa"${sel === "mappa" ? " selected" : ""}>Punto scelto sulla mappa</option>`);
    return (conGps ? `<option value="gps"${sel === "gps" ? " selected" : ""}>La mia posizione</option>` : "") + gruppi.join("");
  }
  function risultati() {
    if (!piani.length) return "";
    return piani.map((p, i) => {
      if (p.attesa) return `<div class="scheda"><div class="desc" role="status">Calcolo il percorso…</div></div>`;
      if (p.errore && !p.titolo) return `<div class="msg avv" role="alert">${esc(p.errore)}</div>`;
      if (p.errore) return `<div class="scheda"><div class="nome">${esc(p.titolo)}</div><div class="desc">${esc(p.errore)}</div></div>`;
      return `<div class="scheda${i === scelto ? " acceso" : ""}"><div class="nome">${esc(p.titolo)}: ${minuti(p.sec)}${p.tipo === "metro" ? ` (${km(p.m)} a piedi)` : `, ${km(p.m)}`}${p.consigliato ? `<span class="et">Consigliato</span>` : ""}</div>
        <ol class="passi">${p.passi.map(x => `<li${x.colore ? ` style="--lin:${x.colore}"` : ""}>${esc(x.testo)}</li>`).join("")}</ol>${p.fine ? `<div class="desc">${esc(p.fine)}</div>` : ""}${p.nota ? `<div class="desc piccolo">${esc(p.nota)}</div>` : ""}
        <div class="riga"><button class="btn${i === scelto ? "" : " pri"}" data-az="m_mostra" data-v="${i}">${i === scelto ? "Sulla mappa" : "Mostra sulla mappa"}</button></div></div>`;
    }).join("");
  }
  function vista() {
    const gi = giornoM === null ? g : giornoM;
    const giorni = TRIP.giorni.map((d, i) => `<button class="chip" data-az="m_giorno" data-v="${i}" aria-pressed="${i === gi}">${d.iso.slice(8)}</button>`).join("");
    const pronta = st.fase === "pronta", oggi = oggiIso();
    return `<div class="scheda" id="mappa-stato">${cartaStato()}</div>
      <div class="scheda" id="mappa-pos">${cartaPosizione()}</div>
      ${pronta ? `<div class="chips" role="group" aria-label="Tappe del giorno sulla mappa">${giorni}</div>` : ""}
      <div id="mappa-segnaposto" class="mappa-segnaposto${pronta ? "" : " vuoto"}">${pronta ? "" : `<div class="desc">La mappa comparirà qui dopo il download.</div>`}</div>
      ${pronta ? `<p class="mute piccolo">Tocca un numero o un punto della mappa per sceglierlo come meta. © OpenStreetMap contributors, Protomaps.</p>
      <form class="f scheda" data-form="m_percorso" id="mappa-form"><div class="nome">Percorso</div>
        <label class="mute" for="m-da">Partenza</label><select id="m-da" data-chg="m_da">${opzioni(da, true)}</select>
        <label class="mute" for="m-a">Meta</label><select id="m-a" data-chg="m_a"><option value="">Scegli la meta</option>${opzioni(a, false)}</select>
        <label class="c" style="min-height:46px"><input type="checkbox" data-chg="m_pass" data-v="x"${passeggino ? " checked" : ""}><span><b>Evita le scale</b><br><small class="mute">Per il passeggino di Ludovica. Cammino più lento.</small></span></label>
        ${oggi === "2026-12-25" ? `<div class="mute piccolo">Il 25 dicembre metro, treni e bus non circolano: il percorso è solo a piedi.</div>` : oggi === "2026-12-26" ? `<div class="mute piccolo">Il 26 dicembre la metro ha orario ridotto e la Elizabeth line è ferma.</div>` : ""}
        <div class="riga"><button class="btn pri" type="submit">Calcola il percorso</button></div></form>
      ${risultati()}` : ""}`;
  }
  Object.assign(azioni, {
    m_scarica() { scarica(); }, m_annulla() { if (ctrl) ctrl.abort(); }, m_elimina() { elimina(); },
    m_pos() { seguiPosizione(); }, m_pos_off() { fermaPosizione(); },
    m_giorno(v) { giornoM = +v; render(); monta(); },
    m_da(v) { da = v; }, m_a(v) { a = v; disegnaDest(); }, m_pass(_, el) { passeggino = el.checked; },
    m_mostra(v) { scelto = +v; render(); monta(); if (map) disegnaRotta(piani[scelto]); }
  });
  Object.assign(moduli, { m_percorso() { calcola(); } });
  return { vista, monta, avvio, pronta: () => st.fase === "pronta", stato: () => st.fase };
})();
