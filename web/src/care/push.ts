// Web Push in the browser: ask permission, subscribe with our VAPID public key and store the
// subscription server-side (push Edge Function). The private VAPID key never leaves Supabase.
import { supabase } from "./auth";

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushState = "unsupported" | "needs-install" | "denied" | "off" | "on";

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

function urlB64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function call(body: unknown) {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  const res = await fetch(`${URL_}/functions/v1/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ANON}`, apikey: ANON ?? "" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

export async function getPushState(): Promise<PushState> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    // iOS Safari exposes push only to apps added to the Home Screen.
    return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "on" : "off";
}

export async function enablePush(): Promise<PushState> {
  if (!VAPID_PUBLIC || !URL_) throw new Error("Powiadomienia nie są skonfigurowane.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC) }));
  const out = await call({ action: "subscribe", subscription: sub.toJSON() });
  if (!out.ok) throw new Error("Nie udało się zapisać subskrypcji.");
  return "on";
}

export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await call({ action: "unsubscribe", endpoint: sub.endpoint });
    await sub.unsubscribe();
  }
  return "off";
}

export async function sendTestPush(): Promise<number> {
  const out = await call({ action: "test" });
  return out.sent ?? 0;
}
