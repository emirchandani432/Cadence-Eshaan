// Frontend helpers to read/write the shared tracker doc via the Vercel API.
// Falls back gracefully (caller catches) so local dev without the API still works.
export async function apiLoad() {
  const r = await fetch("/api/tracker", { cache: "no-store" });
  if (!r.ok) throw new Error("api load failed");
  return r.json();
}
export async function apiSave(doc) {
  const r = await fetch("/api/tracker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!r.ok) throw new Error("api save failed");
  return r.json();
}
