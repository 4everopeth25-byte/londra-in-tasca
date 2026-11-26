/* Londra in tasca (versione principale): copia salvata per l'uso senza rete. Cambiare VERSIONE a ogni pubblicazione. */
const VERSIONE = "lit-35";
const FILE = ["./", "index.html", "style.css", "notte.css", "dati.js", "app.js", "sondaggio.js", "push.js", "vendor/supabase.js", "fonts/Fraunces.ttf", "fonts/Fraunces-Italic.ttf", "fonts/DMSans.ttf", "installa.js", "manifest.webmanifest", "mappa/mappa.js", "mappa/stile.json", "mappa/metro.json", "mappa/luoghi.json", "vendor/maplibre-gl-csp.js", "vendor/maplibre-gl-csp-worker.js", "vendor/maplibre-gl.css", "vendor/pmtiles.js",
  ...["Regular", "Medium", "Italic"].flatMap(f => ["0-255", "256-511"].map(r => `mappa/fonts/Noto%20Sans%20${f}/${r}.pbf`)),
  "icone/icona-192.png", "icone/icona-512.png", "icone/icona-maskable-512.png"];
self.addEventListener("install", e => e.waitUntil(
  caches.open(VERSIONE).then(c => c.addAll(FILE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())));
/* elimina solo le vecchie copie di questa app (prefisso lit-), non quelle delle sottocartelle /v3/ e /v4/ (lit3-, lit4-) */
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x.startsWith("lit-") && x !== VERSIONE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
/* prima la rete (limite di 4 secondi), se manca o è lenta la copia salvata */
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  /* solo le pagine di questa app: i grossi file dei dati della mappa (altra cartella o altro sito) li gestisce l'app stessa */
  if (e.request.method !== "GET" || u.origin !== location.origin || !u.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  const rete = Promise.race([fetch(e.request, { cache: "no-cache" }), new Promise((_, no) => setTimeout(() => no(new Error("lenta")), 4000))]);
  e.respondWith(rete.then(r => {
    if (r.ok && r.type === "basic" && !r.redirected && !u.search) {
      const copia = r.clone(); e.waitUntil(caches.open(VERSIONE).then(c => c.put(e.request, copia)));
    }
    return r;
  }).catch(() => caches.open(VERSIONE).then(c => c.match(e.request, { ignoreSearch: true })).then(r => r || caches.open(VERSIONE).then(c => c.match("index.html")))));
});
/* notifiche push: la funzione «notifica» di Supabase manda {titolo, testo, n, url}; si mostra l'avviso e si aggiorna il numero sull'icona */
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { /* testo semplice */ }
  const n = Number(d.n) || 0;
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.titolo || "Londra in tasca", { body: d.testo || "Ci sono novità tra le idee.", icon: "icone/icona-192.png", badge: "icone/icona-192.png", tag: "lit-idee", renotify: true, data: { url: d.url || "./?vai=idee" } }),
    (self.navigator && self.navigator.setAppBadge ? (n > 0 ? self.navigator.setAppBadge(n) : self.navigator.clearAppBadge()) : Promise.resolve()).catch(() => {}),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => cs.forEach(c => c.postMessage({ lit: "push" })))]));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./?vai=idee", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    return c ? c.focus().then(w => w.navigate(url)) : self.clients.openWindow(url);
  }));
});
