import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: register the service worker (installable app + push notifications).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// A Home Screen app (and a long-open tab) keeps the old bundle in memory. When the app comes
// back to the foreground, compare the deployed entry script with ours and reload if it changed.
// Skipped in the wizard so a half-filled form is never lost.
const currentEntry = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.getAttribute("src");
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible" || !currentEntry || location.pathname.startsWith("/kreator")) return;
  try {
    const html = await (await fetch("/", { cache: "no-store" })).text();
    const latest = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1];
    if (latest && latest !== currentEntry) location.reload();
  } catch {
    /* offline: keep the current version */
  }
});
