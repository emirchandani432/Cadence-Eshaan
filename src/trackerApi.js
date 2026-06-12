// Frontend helpers to read/write the shared tracker doc via the Vercel API.
// Falls back gracefully (caller catches) so local dev without the API still works.
// The API requires an app key (set APP_KEY + VITE_APP_KEY to the same value in Vercel).
const KEY = import.meta.env.VITE_APP_KEY || "";
const AUTH = KEY ? { "x-app-key": KEY } : {};

export async function apiLoad() {
  const r = await fetch("/api/tracker", { cache: "no-store", headers: AUTH });
  if (!r.ok) throw new Error("api load failed");
  return r.json();
}
export async function apiSave(doc) {
  const r = await fetch("/api/tracker", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...AUTH },
    body: JSON.stringify(doc),
  });
  if (!r.ok) throw new Error("api save failed");
  return r.json();
}
