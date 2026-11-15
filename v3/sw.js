/* Londra in tasca 3: copia salvata per l'uso senza rete. Cambiare VERSIONE a ogni pubblicazione. */
const VERSIONE = "lit3-1";
const FILE = ["./", "index.html", "style.css", "dati.js", "app.js", "installa.js", "manifest.webmanifest",
  "icone/icona-192.png", "icone/icona-512.png", "icone/icona-maskable-512.png"];
self.addEventListener("install", e => e.waitUntil(
  caches.open(VERSIONE).then(c => c.addAll(FILE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())));
/* elimina solo le vecchie copie di questa versione (prefisso lit3-) */
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x.startsWith("lit3-") && x !== VERSIONE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
/* prima la rete (limite di 4 secondi), se manca o è lenta la copia salvata */
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const rete = Promise.race([fetch(e.request, { cache: "no-cache" }), new Promise((_, no) => setTimeout(() => no(new Error("lenta")), 4000))]);
  e.respondWith(rete.then(r => {
    if (r.ok && r.type === "basic" && !r.redirected && !u.search) {
      const copia = r.clone(); e.waitUntil(caches.open(VERSIONE).then(c => c.put(e.request, copia)));
    }
    return r;
  }).catch(() => caches.open(VERSIONE).then(c => c.match(e.request, { ignoreSearch: true })).then(r => r || caches.open(VERSIONE).then(c => c.match("index.html")))));
});
