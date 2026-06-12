// All localStorage keys and load/save helpers in one place.
export const STORE_KEY = "cadence:data:v2";
export const USER_KEY = "cadence:user:v1";
export function loadData() { try { const v = localStorage.getItem(STORE_KEY); if (v) return JSON.parse(v); } catch (e) {} return null; }
export function saveData(d) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) {} }
export function loadUser() { try { const v = localStorage.getItem(USER_KEY); if (v) return JSON.parse(v); } catch (e) {} return null; }
export function saveUser(u) { try { u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY); } catch (e) {} }
export const GKEY = "cadence:gantt:v3";
export const OKEY = "cadence:opens:v1";
export function loadGantt() { try { const v = localStorage.getItem(GKEY); if (v) return JSON.parse(v); } catch (e) {} return null; }
export function saveGantt(g) { try { localStorage.setItem(GKEY, JSON.stringify(g)); } catch (e) {} }
export function loadOpens() { try { const v = localStorage.getItem(OKEY); if (v) return JSON.parse(v); } catch (e) {} return {}; }
export function bumpOpen(pid) { try { const o = loadOpens(); o[pid] = (o[pid] || 0) + 1; localStorage.setItem(OKEY, JSON.stringify(o)); } catch (e) {} }
export const CKEY = "cadence:contacts:v1";
export function loadContacts() { try { const v = localStorage.getItem(CKEY); if (v) return JSON.parse(v); } catch (e) {} return { info: {}, groups: [] }; }
export function saveContacts(c) { try { localStorage.setItem(CKEY, JSON.stringify(c)); } catch (e) {} }
export const NKEY = "cadence:notif:v1";
export function loadNotif() { try { const v = localStorage.getItem(NKEY); if (v) return JSON.parse(v); } catch (e) {} return { read: [], removed: [] }; }
export function saveNotif(n) { try { localStorage.setItem(NKEY, JSON.stringify(n)); } catch (e) {} }
export const CALKEY = "cadence:caldnotes:v1";
export function loadCalNotes() { try { const v = localStorage.getItem(CALKEY); if (v) return JSON.parse(v); } catch (e) {} return {}; }
export function saveCalNotes(n) { try { localStorage.setItem(CALKEY, JSON.stringify(n)); } catch (e) {} }
export const TRACKER_KEY = "cadence:tracker:v3"; // v3: re-seeded from the 2026-06-12 Excel export (COM-1 + Culvers + Costco + ALDI)
export const SHEETS_KEY = "cadence:tracker:sheets:v1";
export const DEFAULT_SHEETS = [
  { id: "main", label: "All Projects" },
  { id: "culvers", label: "Culvers" },
  { id: "aldi", label: "Aldi" },
  { id: "costco", label: "Costco" },
];
export function loadSheets() { try { const v = localStorage.getItem(SHEETS_KEY); if (v) return JSON.parse(v); } catch (e) {} return DEFAULT_SHEETS; }
export function saveSheets(s) { try { localStorage.setItem(SHEETS_KEY, JSON.stringify(s)); } catch (e) {} }
export function sheetKey(id) { return id === "main" ? TRACKER_KEY : `cadence:tracker:sheet:${id}`; }
export function loadTracker(id = "main") { try { const v = localStorage.getItem(sheetKey(id)); if (v) { const p = JSON.parse(v); return Array.isArray(p) ? { rows: p } : p; } } catch (e) {} return null; }
export function saveTracker(d, id = "main") { try { localStorage.setItem(sheetKey(id), JSON.stringify(d)); } catch (e) {} }
