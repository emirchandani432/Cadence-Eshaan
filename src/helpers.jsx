// Shared helpers, constants, and tiny presentational components used across views.
export const PALETTE = ["#E03A3E","#4FA8E8","#33B36B","#E8A53C","#9A6BF0","#E0734A","#2E80C2","#C56BD6","#5FD18C","#EC6A9C","#1E5F9E","#F0C04A"];

export const uid = () => Math.random().toString(36).slice(2, 9);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const initials = (n) => (n || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
export const MS = 86400000;
export const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const dayDiff = (a, b) => Math.round((Date.parse(b + "T00:00:00") - Date.parse(a + "T00:00:00")) / MS);
export function fmtDue(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
export const isOverdue = (iso, status) => iso && status !== "done" && iso < todayISO();

export const COLUMNS = [
  { id: "todo", label: "To do", dot: "#7686A0" },
  { id: "doing", label: "In progress", dot: "#E8A53C" },
  { id: "done", label: "Done", dot: "#33B36B" },
];
export const PRIO = { low: "#7686A0", med: "#E8A53C", high: "#FF6B45" };

export function download(name, text, type) {
  const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
export const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function remaining(dueISO, nowMs) {
  if (!dueISO) return null;
  const due = new Date(dueISO + "T23:59:59").getTime();
  let diff = due - nowMs; const past = diff < 0; diff = Math.abs(diff);
  const sec = Math.floor(diff / 1000), min = Math.floor(sec / 60), hr = Math.floor(min / 60), day = Math.floor(hr / 24);
  let txt;
  if (day >= 60) txt = `${Math.round(day / 30)} months`;
  else if (day >= 14) txt = `${Math.floor(day / 7)} weeks`;
  else if (day >= 2) txt = `${day} days`;
  else if (hr >= 1) txt = `${hr}h ${min % 60}m`;
  else if (min >= 1) txt = `${min}m ${sec % 60}s`;
  else txt = `${sec}s`;
  return { txt, past, soon: !past && diff < 5 * 86400000 };
}
export const ROLE_C = { owner: "#E03A3E", editor: "#4FA8E8", viewer: "#6E83A2" };
export const genCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();
// Two distinct invite codes per project: viewers join read-only, editors can edit.
export const genCodes = () => { const viewerCode = genCode(); let editorCode = genCode(); while (editorCode === viewerCode) editorCode = genCode(); return { viewerCode, editorCode }; };
export const viewerCodeOf = (p) => (p && (p.viewerCode || p.code)) || "";
export const editorCodeOf = (p) => (p && p.editorCode) || "";
// What gets uploaded to the shared store when a project is published — strip per-user fields.
export const publishableProject = (p) => { const { myRole, invited, invitedAs, invitedEmail, deleted, deletedAt, ...rest } = p; return rest; };
export const codeRoleFor = (p, code) => editorCodeOf(p).toUpperCase() === code ? "editor" : viewerCodeOf(p).toUpperCase() === code ? "viewer" : null;

export function UserAv({ u, size = 32 }) {
  if (u && u.avatar) return <span style={{ width: size, height: size, borderRadius: 9, backgroundImage: `url(${u.avatar})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0, display: "inline-block" }} />;
  return <span className="av" style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: 9, background: (u && u.color) || "#6E83A2" }}>{initials((u && u.name) || "You")}</span>;
}
export function Confetti() {
  const cols = ["#E03A3E", "#4FA8E8", "#33B36B", "#E8A53C", "#9A6BF0"];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
      {Array.from({ length: 90 }).map((_, i) => {
        const l = Math.random() * 100, d = 0.7 + Math.random() * 0.9, delay = Math.random() * 0.3, sz = 6 + Math.random() * 8;
        return <span key={i} style={{ position: "absolute", left: l + "%", top: "-12px", width: sz, height: sz * 0.6, background: cols[i % cols.length], borderRadius: 2, transform: `rotate(${Math.random() * 360}deg)`, animation: `conff ${d}s ${delay}s ease-in forwards` }} />;
      })}
    </div>
  );
}

export function MemberAv({ m, size = 20 }) {
  return (
    <span style={{ position: "relative", width: size, height: size, borderRadius: 99, background: m.color, display: "inline-grid", placeItems: "center", fontSize: size * 0.4, fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
      {initials(m.name)}
      {m.done && <span style={{ position: "absolute", left: "-12%", top: "47%", width: "124%", height: Math.max(2, size * 0.11), background: "#33B36B", transform: "rotate(-45deg)" }} />}
    </span>
  );
}

export const BG_PRESETS = [
  { name: "None", css: "" },
  { name: "Red", css: "rgba(224,58,62,.30)" },
  { name: "Blue", css: "rgba(79,168,232,.30)" },
  { name: "Green", css: "rgba(51,179,107,.30)" },
  { name: "Purple", css: "rgba(154,107,240,.30)" },
  { name: "Amber", css: "rgba(232,165,60,.30)" },
];
