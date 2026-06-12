// Tracker view — the Excel-style multi-sheet project tracker synced to the shared DB.
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Mail, Trash2, Search, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { uid } from "../helpers.jsx";
import { SHEETS_KEY } from "../storage.js";
import { EMAIL_DIR } from "../trackerData.js";
import { SEED_SHEETS } from "../sheetsData.js";
import { apiLoad, apiSave } from "../trackerApi.js";

const TRACKER_BLOCK = new Set(["SEATTLE", "DALLAS", "IOWA", "OTHERS", "COM-1"]);
const trackerEmailFor = (name) => {
  const parts = String(name || "").trim().split(/\s+/).map(p => p.replace(/[^A-Za-z]/g, "")).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length >= 2) return `${parts[0].toLowerCase()}.${parts[parts.length - 1].toLowerCase()}@rtmec.com`;
  return `${parts[0].toLowerCase()}@rtmec.com`;
};
const rowEmails = (r) => {
  const out = [];
  ["pm", "ml", "me", "pe", "ee", "fp"].forEach(k => String(r[k] || "").split(/\n|\/| and /).forEach(part => {
    const nm = part.trim(); if (!nm) return;
    const e = trackerEmailFor(nm); if (e && !out.includes(e)) out.push(e);
  }));
  return out;
};
const ALL_NAMES = Object.keys(EMAIL_DIR).map(k => k.replace(/\b\w/g, c => c.toUpperCase()));

function RoleCell({ value, onSave, effLight, theme }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [sugIdx, setSugIdx] = useState(-1);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const taRef = useRef(null);
  const pickingRef = useRef(false);

  const names = String(value || "").split(/\n|\/| and /).map(s => s.trim()).filter(Boolean);

  const commit = (text) => {
    setEditing(false);
    setSuggestions([]);
    onSave(text.split(/\n/).map(s => s.trim()).filter(Boolean).join("\n"));
  };

  // Get the last partial word on the last line to drive suggestions
  const getLastWord = (text) => {
    const lastLine = text.split("\n").pop() || "";
    return lastLine.trim();
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setDraft(text);
    const word = getLastWord(text);
    if (word.length >= 1) {
      const wl = word.toLowerCase();
      const matches = ALL_NAMES.filter(n => n.toLowerCase().includes(wl)).slice(0, 8);
      if (taRef.current) {
        const r = taRef.current.getBoundingClientRect();
        setDropPos({ top: r.bottom, left: r.left });
      }
      setSuggestions(matches);
      setSugIdx(-1);
    } else {
      setSuggestions([]);
    }
  };

  const pickSuggestion = (name) => {
    const lines = draft.split("\n");
    lines[lines.length - 1] = name;
    const next = lines.join("\n");
    setDraft(next);
    setSuggestions([]);
    setSugIdx(-1);
    taRef.current?.focus();
  };

  const handleKey = (e) => {
    if (suggestions.length === 0) {
      if (e.key === "Escape") commit(draft);
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setSugIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSugIdx(i => Math.max(i - 1, -1)); }
    else if ((e.key === "Enter" || e.key === "Tab") && sugIdx >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[sugIdx]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  if (editing) {
    return (
      <div style={{ position: "relative" }}>
        <textarea ref={taRef} className="trk-role-edit" autoFocus rows={Math.max(1, draft.split("\n").length)}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKey}
          onBlur={() => { if (!pickingRef.current) commit(draft); }} />
        {suggestions.length > 0 && createPortal(
          <div style={{ position: "fixed", top: dropPos.top, left: dropPos.left, zIndex: 9999, background: theme === "light" ? "#fff" : theme === "twilight" ? "#2E2B50" : "#172E4B", border: `1px solid ${theme === "light" ? "#c0cad8" : theme === "twilight" ? "#423E6E" : "#26456B"}`, borderRadius: 8, boxShadow: "0 8px 28px rgba(0,0,0,.35)", minWidth: 220, overflow: "hidden" }}>
            {suggestions.map((s, i) => (
              <div key={s} data-suggestion="1" tabIndex={-1}
                onMouseDown={e => { e.preventDefault(); pickingRef.current = true; pickSuggestion(s); setTimeout(() => { pickingRef.current = false; }, 100); }}
                style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", background: i === sugIdx ? "#E03A3E" : "transparent", color: i === sugIdx ? "#fff" : theme === "light" ? "#1b2330" : "#E4DEFF", fontFamily: "Outfit", fontWeight: 500 }}>
                {s}
              </div>
            ))}
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="trk-role" onDoubleClick={() => { setDraft(names.join("\n")); setEditing(true); }} title="Double-click to edit">
      {names.length === 0 ? <span style={{ color: "#b9c1cd", paddingLeft: 8 }}>—</span> :
        names.map((n, i) => { const e = trackerEmailFor(n); return <div key={i}>{e ? <a href={"mailto:" + e} onClick={ev => ev.stopPropagation()}>{n}</a> : <span>{n}</span>}</div>; })}
    </div>
  );
}
const TRACKER_COLS = [
  { key: "projectName", label: "Project Name", w: 250, sticky: true },
  { key: "rowNumber", label: "Row #", w: 60 },
  { key: "internalLocation", label: "Internal Location", w: 130 },
  { key: "mepCentralHost", label: "MEP Central Host", w: 150 },
  { key: "vantagepoint", label: "Vantagepoint #", w: 130 },
  { key: "client", label: "Client", w: 190 },
  { key: "pm", label: "PM", w: 150 },
  { key: "ml", label: "ML", w: 150 },
  { key: "me", label: "ME", w: 170 },
  { key: "pe", label: "PE", w: 170 },
  { key: "ee", label: "EE", w: 170 },
  { key: "fp", label: "FP", w: 150 },
  { key: "statusNotes", label: "Status Notes", w: 200 },
  { key: "dueDates", label: "Due Dates", w: 100 },
  { key: "bidPermitDate", label: "Bid/Permit Date", w: 120 },
  { key: "bidPermitNote", label: "Bid/Permit Note", w: 150 },
  { key: "qaqc", label: "QAQC", w: 90 },
  { key: "stamp", label: "Stamp", w: 110 },
  { key: "stage", label: "Stage", w: 170 },
];
export function TrackerView({ ctx }) {
  const { effLight, theme } = ctx;
  // All sheets are held in state together and synced as one document — each sheet
  // (COM-1, Culvers, Costco, ALDI) keeps its own rows, columns and statuses.
  const [sheets, setSheets] = useState(() => {
    try { const v = localStorage.getItem(SHEETS_KEY); if (v) { const p = JSON.parse(v); if (Array.isArray(p) && p.length && p[0].rows) return p; } } catch (e) {}
    return SEED_SHEETS;
  });
  const [activeSheet, setActiveSheet] = useState(() => (SEED_SHEETS[0] && SEED_SHEETS[0].id) || "com1");
  const [renamingSheet, setRenamingSheet] = useState(null);
  const sheetObj = sheets.find(s => s.id === activeSheet) || sheets[0] || { id: "com1", name: "COM-1", rows: [], cols: [], statuses: [] };
  const data = (sheetObj.rows || []).map((r, i) => r._id ? r : { ...r, _id: "r" + (r.rowNumber || i) });
  const cols = (sheetObj.cols || TRACKER_COLS).filter(c => c.key !== "rowNumber");
  const statuses = sheetObj.statuses || [];
  const activeLabel = sheetObj.name || sheetObj.label || "";
  const patchSheet = (fn) => setSheets(ss => ss.map(s => s.id === activeSheet ? { ...s, ...fn(s) } : s));
  const setData = (v) => patchSheet(s => ({ rows: typeof v === "function" ? v((s.rows || []).map((r, i) => r._id ? r : { ...r, _id: "r" + (r.rowNumber || i) })) : v }));
  const setCols = (v) => patchSheet(s => ({ cols: typeof v === "function" ? v((s.cols || TRACKER_COLS).filter(c => c.key !== "rowNumber")) : v }));
  const setStatuses = (v) => patchSheet(s => ({ statuses: typeof v === "function" ? v(s.statuses || []) : v }));
  const switchSheet = (id) => setActiveSheet(id);
  const addSheet = () => { const label = window.prompt("Sheet name:"); if (!label || !label.trim()) return; const id = "sheet_" + uid(); setSheets(ss => [...ss, { id, name: label.trim(), cols: [{ key: "projectName", label: "Project Name", w: 260, sticky: true }, { key: "stage", label: "Stage", w: 170 }], statuses: [], rows: [] }]); setActiveSheet(id); };
  const deleteSheet = (id) => { if (sheets.length <= 1) { alert("Can't delete the last sheet."); return; } const s = sheets.find(x => x.id === id); if (!window.confirm(`Delete sheet "${s ? (s.name || s.label) : ""}"?`)) return; const next = sheets.filter(x => x.id !== id); setSheets(next); if (activeSheet === id) setActiveSheet(next[0].id); };
  const renameSheet = (id, label) => { setSheets(ss => ss.map(s => s.id === id ? { ...s, name: label } : s)); setRenamingSheet(null); };

  // Brand tabs are filtered views of the master "All Projects" list (one synced
  // source of truth) — switching sheets only changes which rows are shown, not the data.
  const apiOk = useRef(false);
  const curV = useRef(0);
  const lastSave = useRef(0);
  const applyingRemote = useRef(false);
  const hydrated = useRef(false); // true once the DB's authoritative copy has loaded — guards against pushing a stale local cache up
  const buildDoc = () => ({ sheets: sheets.map(s => ({ ...s, rows: (s.rows || []).map(r => ({ ...r, emails: rowEmails(r) })) })) });
  const withIds = (sh) => sh.map(s => ({ ...s, rows: (s.rows || []).map((r, i) => r._id ? r : { ...r, _id: (s.id || "s") + i }) }));
  const docToSheets = (doc) => {
    if (!doc) return null;
    if (doc.sheets && doc.sheets.length) return doc.sheets;
    if (doc.rows && doc.rows.length) { const com = { id: "com1", name: "COM-1", cols: (doc.cols || TRACKER_COLS).filter(c => c.key !== "rowNumber"), statuses: doc.statuses || [], rows: doc.rows }; return [com, ...SEED_SHEETS.filter(s => s.id !== "com1")]; }
    return null;
  };
  // Load all sheets from the shared DB on open, then poll for others' changes (near real-time).
  useEffect(() => {
    let timer, cancelled = false;
    (async () => {
      try {
        const doc = await apiLoad();
        apiOk.current = true;
        const sh = docToSheets(doc);
        if (sh) { applyingRemote.current = true; setSheets(withIds(sh)); curV.current = (doc && doc.v) || 0; }
        else { const res = await apiSave({ sheets: SEED_SHEETS }); if (res && res.v) curV.current = res.v; }
      } catch (e) { apiOk.current = false; }
      hydrated.current = true;
      if (cancelled) return;
      timer = setInterval(async () => {
        if (!apiOk.current) return;
        try { const doc = await apiLoad(); if (doc && doc.v > curV.current && Date.now() - lastSave.current > 2500) { const sh = docToSheets(doc); if (sh) { applyingRemote.current = true; setSheets(withIds(sh)); curV.current = doc.v; } } } catch (e) {}
      }, 7000);
    })();
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, []);
  // Persist: local cache always; push to the DB (debounced) unless we just applied a remote change.
  useEffect(() => {
    try { localStorage.setItem(SHEETS_KEY, JSON.stringify(sheets)); } catch (e) {}
    if (!hydrated.current) return; // never push to the shared DB before we've loaded its copy (stops a stale local cache from overwriting it)
    if (applyingRemote.current) { applyingRemote.current = false; return; }
    if (!apiOk.current) return;
    const t = setTimeout(async () => {
      try { const res = await apiSave(buildDoc()); lastSave.current = Date.now(); if (res && res.v) curV.current = res.v; } catch (e) {}
    }, 700);
    return () => clearTimeout(t);
  }, [sheets]);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [person, setPerson] = useState("all");
  const [personDropOpen, setPersonDropOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState("");
  const personDropRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const [selRow, setSelRow] = useState(null);
  const [overId, setOverId] = useState(null);
  const ROLE_KEYS = ["pm", "ml", "me", "pe", "ee", "fp", "cv_se", "cv_pe", "co_pe", "al_pm", "al_me", "al_pe", "al_ee"];
  const namesIn = (r) => ROLE_KEYS.flatMap(k => String(r[k] || "").split(/\n|\/| and /).map(s => s.trim()).filter(s => s && !TRACKER_BLOCK.has(s.toUpperCase())));
  const people = ["all", ...Array.from(new Set(data.flatMap(namesIn))).sort()];
  const ql = q.trim().toLowerCase();
  // Normalize for brand matching: lowercase, strip punctuation/spaces (so "CULVER'S" matches the "Culvers" tab).
  const normName = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const rows = data.filter(r => {
    if (stage !== "all" && r.stage !== stage) return false;
    if (person !== "all" && !namesIn(r).includes(person)) return false;
    if (ql && !(`${r.projectName} ${r.client} ${r.vantagepoint} ${r.pm} ${r.ml} ${r.me} ${r.pe} ${r.ee} ${r.fp}`.toLowerCase().includes(ql))) return false;
    return true;
  });
  const STATUS_PALETTE = ["#E03A3E", "#E8A53C", "#33B36B", "#4FA8E8", "#9A6BF0", "#E0734A", "#2E80C2", "#C56BD6"];
  const statusColor = (s) => { const i = statuses.indexOf(s); return i >= 0 ? STATUS_PALETTE[i % STATUS_PALETTE.length] : "#7686A0"; };
  const update = (id, key, value) => setData(ds => ds.map(r => r._id === id ? { ...r, [key]: value } : r));
  const setStatus = (id, val) => { if (val === "__new") { const n = window.prompt("New status name:"); if (!n || !n.trim()) return; const nm = n.trim(); setStatuses(ss => ss.includes(nm) ? ss : [...ss, nm]); update(id, "stage", nm); return; } update(id, "stage", val); };
  const addRow = () => setData(ds => [{ _id: "r" + uid() }, ...ds]);
  const delRow = (id) => setData(ds => ds.filter(r => r._id !== id));
  const dropOnRow = (targetId) => { setData(ds => { if (!dragId || dragId === targetId) return ds; const from = ds.findIndex(r => r._id === dragId); const to = ds.findIndex(r => r._id === targetId); if (from < 0 || to < 0) return ds; const c = [...ds]; const [m] = c.splice(from, 1); c.splice(to, 0, m); return c; }); setDragId(null); setOverId(null); };
  const moveRow = (id, dir) => setData(ds => {
    const vis = ds.filter(r => rows.some(x => x._id === r._id));
    const vi = vis.findIndex(r => r._id === id); const tgt = vis[vi + dir]; if (!tgt) return ds;
    const a = ds.findIndex(r => r._id === id), b = ds.findIndex(r => r._id === tgt._id);
    const c = [...ds]; [c[a], c[b]] = [c[b], c[a]]; return c;
  });
  const [showColSettings, setShowColSettings] = useState(false);
  const [hiddenCols, setHiddenCols] = useState(() => { try { const v = localStorage.getItem("cadence:tracker:hidden"); return v ? JSON.parse(v) : []; } catch { return []; } });
  const toggleCol = (key) => setHiddenCols(prev => { const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]; localStorage.setItem("cadence:tracker:hidden", JSON.stringify(next)); return next; });
  const visibleCols = cols.filter(c => !hiddenCols.includes(c.key));
  useEffect(() => {
    if (!personDropOpen) return;
    const handler = (e) => { if (personDropRef.current && !personDropRef.current.contains(e.target)) setPersonDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [personDropOpen]);

  const addCol = () => { const label = window.prompt("New column name:"); if (!label || !label.trim()) return; setCols(cs => [...cs, { key: "c_" + uid(), label: label.trim(), w: 150 }]); };
  const delCol = (key) => {
    const c = cols.find(x => x.key === key);
    const nm = c ? (c.label || "this column") : "this column";
    if (!window.confirm(`Delete the "${nm}" column?\n\nThis removes it from every row in this sheet.`)) return;
    if (!window.confirm(`Are you sure? Deleting "${nm}" can't be undone and will sync to everyone on the team.`)) return;
    if (!window.confirm(`Are you sure? This is a really bad idea.`)) return;
    setCols(cs => cs.filter(c => c.key !== key));
  };
  const moveCol = (key, dir) => setCols(cs => { const i = cs.findIndex(c => c.key === key); const j = i + dir; if (j < 0 || j >= cs.length) return cs; const c = [...cs]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const startResize = (e, key, startW) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; let raf = 0, latest = startW;
    const onMove = (ev) => { latest = Math.max(50, startW + (ev.clientX - startX)); if (!raf) raf = requestAnimationFrame(() => { raf = 0; setCols(cs => cs.map(c => c.key === key ? { ...c, w: latest } : c)); }); };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); if (raf) cancelAnimationFrame(raf); setCols(cs => cs.map(c => c.key === key ? { ...c, w: latest } : c)); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };
  const emailTeam = (row) => {
    const em = rowEmails(row);
    if (!em.length) return;
    const u = new URLSearchParams();
    u.set("to", em.join(","));
    u.set("subject", `[${row.projectName}] `);
    window.open(`https://outlook.office.com/mail/deeplink/compose?${u.toString()}`, "_blank");
  };
  const GUT = 46;
  const cell = { border: "1px solid var(--line)", padding: "5px 8px", fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: "var(--panel)" };
  const headc = { ...cell, background: "var(--panel2)", fontWeight: 700, color: "var(--ink)", position: "sticky", top: 0, zIndex: 3 };
  const colBtn = { border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", fontSize: 14, fontWeight: 700, lineHeight: 1, padding: "0 1px" };
  const actBtn = { border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", display: "inline-grid", placeItems: "center", padding: 2 };
  return (
    <>
      <div className="head">
        <div><div className="h-title">Tracker</div><div className="h-sub">Your COM project tracker — every project and assignment, like the sheet.</div></div>
      </div>
      {/* Sheet tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 0, flexWrap: "wrap", borderBottom: "2px solid var(--line)", paddingBottom: 0, justifyContent: "flex-start", width: "96vw", maxWidth: "96vw", marginLeft: "calc(-48vw + 50%)" }}>
        {sheets.map(s => (
          <div key={s.id} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            {renamingSheet === s.id ? (
              <input autoFocus defaultValue={s.name}
                onBlur={e => renameSheet(s.id, e.target.value.trim() || s.name)}
                onKeyDown={e => { if (e.key === "Enter") renameSheet(s.id, e.target.value.trim() || s.name); if (e.key === "Escape") setRenamingSheet(null); }}
                style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 600, border: "1px solid var(--teal)", borderRadius: "8px 8px 0 0", padding: "9px 14px", background: "var(--panel2)", color: "var(--ink)", outline: "none", width: 140 }} />
            ) : (
              <button onDoubleClick={() => setRenamingSheet(s.id)} onClick={() => switchSheet(s.id)}
                style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 600, border: "none", borderRadius: "8px 8px 0 0", padding: "10px 20px", cursor: "pointer", background: activeSheet === s.id ? "var(--panel)" : "var(--panel2)", color: activeSheet === s.id ? "var(--ink)" : "var(--muted)", borderBottom: activeSheet === s.id ? "2px solid var(--primary)" : "2px solid transparent", marginBottom: -2, transition: ".12s" }}>
                {s.name}
              </button>
            )}
          </div>
        ))}
        <button onClick={addSheet} title="Add sheet" style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 700, border: "none", borderRadius: "8px 8px 0 0", padding: "10px 16px", cursor: "pointer", background: "transparent", color: "var(--muted)", marginBottom: -2, transition: ".12s" }}>+ New Sheet</button>
      </div>

      <div className="panel" style={{ padding: 12, width: "96vw", maxWidth: "96vw", marginLeft: "calc(-48vw + 50%)", borderTopLeftRadius: 0 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search project, client, person, VP#…"
              style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 10, border: "1px solid var(--line2)", background: "var(--bg)", color: "var(--ink)", fontFamily: "Outfit", fontSize: 14, outline: "none" }} />
          </div>
          <select className="btn" value={stage} onChange={e => setStage(e.target.value)}>
            <option value="all">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div ref={personDropRef} style={{ position: "relative" }}>
            <button className="btn" onClick={() => { setPersonDropOpen(v => !v); setPersonSearch(""); }}
              style={{ minWidth: 130, justifyContent: "space-between", gap: 8 }}>
              <span>{person === "all" ? "All people" : person}</span>
              <ChevronDown size={13} />
            </button>
            {personDropOpen && createPortal(
              (() => {
                const bg     = theme === "light" ? "#fff"     : theme === "twilight" ? "#2E2B50" : "#172E4B";
                const bg2    = theme === "light" ? "#F6F9FD"  : theme === "twilight" ? "#252340" : "#11223A";
                const border = theme === "light" ? "#C4D0E2"  : theme === "twilight" ? "#423E6E" : "#26456B";
                const ink    = theme === "light" ? "#16243A"  : theme === "twilight" ? "#E4DEFF" : "#E9EFF7";
                const muted  = theme === "light" ? "#566884"  : theme === "twilight" ? "#9B94CC" : "#90A2BC";
                const hover  = theme === "light" ? "#EDF1F8"  : theme === "twilight" ? "#373462" : "#1E3A5C";
                const accent = "#E03A3E";
                return (
                  <div onMouseDown={e => e.stopPropagation()}
                    style={{ position: "fixed", top: (personDropRef.current?.getBoundingClientRect().bottom ?? 0) + 4, left: personDropRef.current?.getBoundingClientRect().left ?? 0, zIndex: 9999, background: bg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,.35)", width: 220, overflow: "hidden" }}>
                    <div style={{ padding: "8px 8px 4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: bg2, border: `1px solid ${border}`, borderRadius: 7, padding: "5px 9px" }}>
                        <Search size={13} style={{ color: muted, flexShrink: 0 }} />
                        <input autoFocus value={personSearch} onChange={e => setPersonSearch(e.target.value)}
                          placeholder="Search people…"
                          style={{ background: "none", border: "none", outline: "none", fontFamily: "Outfit", fontSize: 13, color: ink, width: "100%" }} />
                      </div>
                    </div>
                    <div style={{ maxHeight: 240, overflowY: "auto", padding: "4px 6px 8px" }}>
                      {people
                        .filter(s => s === "all" || s.toLowerCase().includes(personSearch.toLowerCase()))
                        .map(s => (
                          <div key={s} onClick={() => { setPerson(s); setPersonDropOpen(false); setPersonSearch(""); }}
                            style={{ padding: "7px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: s === person ? 700 : 400, color: s === person ? accent : ink, background: s === person ? hover : "transparent" }}
                            onMouseEnter={e => e.currentTarget.style.background = hover}
                            onMouseLeave={e => e.currentTarget.style.background = s === person ? hover : "transparent"}>
                            {s === "all" ? "All people" : s}
                          </div>
                        ))}
                      {people.filter(s => s === "all" || s.toLowerCase().includes(personSearch.toLowerCase())).length === 0 &&
                        <div style={{ padding: "8px 10px", fontSize: 13, color: muted }}>No match</div>}
                    </div>
                  </div>
                );
              })(),
              document.body
            )}
          </div>
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{rows.length} of {data.length} projects</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={addRow}><Plus size={14} />Row</button>
          <button className="btn btn-sm" onClick={addCol}><Plus size={14} />Column</button>
          <div style={{ position: "relative" }}>
            <button className="btn btn-sm" onClick={() => setShowColSettings(v => !v)} title="Show/hide columns" style={{ gap: 6 }}>
              <Settings size={14} />{hiddenCols.length > 0 && <span style={{ background: "var(--primary)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 5px" }}>{hiddenCols.length}</span>}Columns
            </button>
            {showColSettings && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 14, padding: "10px 12px", minWidth: 200, boxShadow: "0 16px 40px rgba(0,0,0,.45)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 8 }}>Show / Hide Columns</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}>
                  {cols.map(c => (
                    <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", padding: "5px 6px", borderRadius: 8, background: hiddenCols.includes(c.key) ? "transparent" : "var(--raise)" }}>
                      <input type="checkbox" checked={!hiddenCols.includes(c.key)} onChange={() => toggleCol(c.key)} style={{ accentColor: "var(--primary)", width: 14, height: 14, cursor: "pointer" }} />
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: hiddenCols.includes(c.key) ? "var(--dim)" : "var(--ink)" }}>{c.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)", display: "flex", gap: 6 }}>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => setHiddenCols([]) || localStorage.removeItem("cadence:tracker:hidden")}>Show all</button>
                  <button className="btn btn-sm" style={{ fontSize: 12 }} onClick={() => setShowColSettings(false)}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <style>{`.trk-table input{width:100%;box-sizing:border-box;border:none;background:transparent;font-family:'Outfit';font-size:12.5px;color:var(--ink);padding:5px 8px;outline:none;}
.trk-table input:focus{background:var(--raise);box-shadow:inset 0 0 0 2px var(--teal);border-radius:2px;}
.trk-table select.trk-status{width:100%;box-sizing:border-box;border:none;font-family:'Outfit';font-size:12px;font-weight:600;padding:5px 6px;outline:none;cursor:pointer;border-radius:2px;}
.trk-gut{cursor:grab;}
.trk-role{padding:4px 8px;line-height:1.55;cursor:default;min-height:26px;}
.trk-role a{color:var(--teal);text-decoration:none;}
.trk-role a:hover{text-decoration:underline;}
.trk-table textarea.trk-role-edit{width:100%;box-sizing:border-box;border:none;background:var(--raise);box-shadow:inset 0 0 0 2px var(--teal);font-family:'Outfit';font-size:12.5px;color:var(--ink);padding:4px 8px;outline:none;resize:vertical;line-height:1.55;}`}</style>
        <div style={{ overflow: "auto", maxHeight: "84vh", border: "1px solid var(--line)", borderRadius: 8 }}>
          <table className="trk-table" style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%", background: "var(--panel)" }}>
            <thead>
              <tr>
                <th style={{ ...headc, width: GUT, minWidth: GUT, left: 0, zIndex: 6, background: "var(--raise)" }}></th>
                {visibleCols.map((c, ci) => (
                  <th key={c.key} style={{ ...headc, width: c.w, minWidth: c.w, ...(c.sticky ? { left: GUT, zIndex: 5 } : {}) }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, paddingRight: 6 }}>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</span>
                      <button title="Move left" onClick={() => moveCol(c.key, -1)} disabled={ci === 0} style={colBtn}>‹</button>
                      <button title="Move right" onClick={() => moveCol(c.key, 1)} disabled={ci === visibleCols.length - 1} style={colBtn}>›</button>
                      <button title="Delete column" onClick={() => delCol(c.key)} style={{ ...colBtn, color: "#c0392b", fontSize: 12 }}>×</button>
                    </div>
                    <div onMouseDown={e => startResize(e, c.key, c.w)} title="Drag to resize column" style={{ position: "absolute", top: 0, right: 0, width: 6, height: "100%", cursor: "col-resize", userSelect: "none" }} />
                  </th>
                ))}
                <th style={{ ...headc, width: 64, minWidth: 64 }}>Email</th>
                <th style={{ ...headc, width: 96, minWidth: 96 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => {
                const em = rowEmails(r);
                return (
                <tr key={r._id || ri}
                  onDragOver={e => { if (dragId) { e.preventDefault(); if (overId !== r._id) setOverId(r._id); } }}
                  onDrop={e => { e.preventDefault(); dropOnRow(r._id); }}
                  style={{ opacity: dragId === r._id ? 0.4 : 1, boxShadow: overId === r._id && dragId && dragId !== r._id ? "inset 0 2px 0 #2563c9" : "none" }}>
                  <td className="trk-gut" draggable onDragStart={() => setDragId(r._id)} onDragEnd={() => { setDragId(null); setOverId(null); }}
                    onClick={() => setSelRow(id => id === r._id ? null : r._id)} title="Click to highlight this row · drag to reorder"
                    style={{ ...cell, width: GUT, minWidth: GUT, position: "sticky", left: 0, zIndex: 1, background: selRow === r._id ? "rgba(79,168,232,0.18)" : "var(--panel2)", color: "var(--muted)", textAlign: "center", fontSize: 11.5, fontWeight: 600, userSelect: "none" }}>{ri + 1}</td>
                  {visibleCols.map(c => {
                    const isRole = ROLE_KEYS.includes(c.key);
                    return (
                    <td key={c.key} style={{ ...cell, width: c.w, minWidth: c.w, maxWidth: c.w, padding: 0, verticalAlign: isRole ? "top" : "middle", whiteSpace: isRole ? "normal" : "nowrap", fontWeight: c.key === "projectName" ? 600 : 400, ...(c.sticky ? { position: "sticky", left: GUT, zIndex: 1, background: "var(--panel)" } : {}), ...(selRow === r._id ? { background: "rgba(79,168,232,0.13)" } : {}) }}>
                      {isRole ? (
                        <RoleCell value={r[c.key]} onSave={v => update(r._id, c.key, v)} effLight={effLight} theme={theme} />
                      ) : c.key === "stage" ? (
                        <select className="trk-status" value={r.stage || ""} onChange={e => setStatus(r._id, e.target.value)}
                          style={{ color: r.stage ? statusColor(r.stage) : "#9aa6b6", background: r.stage ? statusColor(r.stage) + "1f" : "transparent" }}>
                          <option value="">—</option>
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="__new">➕ New status…</option>
                        </select>
                      ) : (
                        <input key={r._id + "-" + c.key} defaultValue={r[c.key]} title={r[c.key]} style={{ fontWeight: c.key === "projectName" ? 600 : 400 }}
                          onBlur={e => { if (e.target.value !== (r[c.key] ?? "")) update(r._id, c.key, e.target.value); }} />
                      )}
                    </td>
                    );
                  })}
                  <td style={{ ...cell, textAlign: "center", width: 64, minWidth: 64, ...(selRow === r._id ? { background: "rgba(79,168,232,0.13)" } : {}) }}>
                    <button title={em.length ? `Email team (${em.length})` : "No team emails"} disabled={!em.length}
                      onClick={() => emailTeam(r)}
                      style={{ border: "none", background: "transparent", cursor: em.length ? "pointer" : "not-allowed", color: em.length ? "#2563c9" : "#c2c8d0", display: "grid", placeItems: "center", width: "100%" }}>
                      <Mail size={15} />
                    </button>
                  </td>
                  <td style={{ ...cell, width: 96, minWidth: 96, textAlign: "center", padding: "2px 4px", ...(selRow === r._id ? { background: "rgba(79,168,232,0.13)" } : {}) }}>
                    <button title="Move up" onClick={() => moveRow(r._id, -1)} style={actBtn}><ChevronUp size={15} /></button>
                    <button title="Move down" onClick={() => moveRow(r._id, 1)} style={actBtn}><ChevronDown size={15} /></button>
                    <button title="Delete row" onClick={() => { if (window.confirm("Delete this row?")) delRow(r._id); }} style={{ ...actBtn, color: "#c0392b" }}><Trash2 size={14} /></button>
                  </td>
                </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={cols.length + 3} style={{ ...cell, textAlign: "center", padding: 24, color: "#777" }}>No projects match.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="foot-note" style={{ marginTop: 10, justifyContent: "flex-start" }}><Mail size={12} /> Names link to email (click to send); double-click a role cell to edit (one name per line) · drag the row number to reorder · "Row" adds to the top · Stage is a status dropdown.</div>
      </div>
    </>
  );
}
