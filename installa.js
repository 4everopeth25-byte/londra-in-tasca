/* Striscia di installazione: pulsante «Installa» se Chrome lo permette, istruzioni altrimenti. Si può chiudere. */
let evento = null;
const installata = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const chiusa = () => { try { return sessionStorage.getItem("lit-installa-chiusa") === "1"; } catch { return false; } };
const ua = navigator.userAgent;
const chromeVero = /Chrome\/\d+/.test(ua) && !/SamsungBrowser|HeyTap|OPR\/|EdgA|YaBrowser|; wv\)/.test(ua);

const iphone = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const safari = iphone && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

function striscia() {
  document.getElementById("installa")?.remove();
  if (installata() || chiusa()) return;
  const d = document.createElement("div");
  d.id = "installa"; d.className = "installa"; d.setAttribute("role", "region"); d.setAttribute("aria-label", "Installa l'app");
  const testo = evento
    ? `<b>Installa Londra in tasca</b><span>Avrai l'icona tra le app e funzionerà anche senza rete.</span>`
    : iphone
      ? (safari
        ? `<b>Per installare l'app</b><span>Tocca il tasto Condividi (quadrato con freccia), poi «Aggiungi alla schermata Home».</span>`
        : `<b>Apri questa pagina in Safari</b><span>Su iPhone l'installazione funziona solo da Safari. Copia l'indirizzo e aprilo lì.</span>`)
    : chromeVero
      ? `<b>Per installare l'app</b><span>Menu ⋮ in alto a destra, «Aggiungi a schermata Home», poi «Installa».</span>`
      : `<b>Apri questa pagina in Chrome</b><span>Questo browser non installa le app web. Copia l'indirizzo e aprilo in Chrome.</span>`;
  d.innerHTML = `<div class="tx">${testo}</div>${evento ? `<button class="btn pri" id="installa-si">Installa</button>` : ""}<button class="btn tondo" id="installa-no" aria-label="Chiudi">✕</button>`;
  document.body.append(d);
  document.getElementById("installa-no").onclick = () => { try { sessionStorage.setItem("lit-installa-chiusa", "1"); } catch { /* ok */ } d.remove(); };
  const si = document.getElementById("installa-si");
  if (si) si.onclick = async () => { evento.prompt(); await evento.userChoice.catch(() => {}); evento = null; d.remove(); };
}
addEventListener("beforeinstallprompt", e => { e.preventDefault(); evento = e; striscia(); });
addEventListener("appinstalled", () => document.getElementById("installa")?.remove());
setTimeout(striscia, 1500);
