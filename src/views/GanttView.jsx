// Gantt view — project picker, timeline, join-by-code sharing, and project editing.
import { useState, useEffect, useRef } from "react";
import { Plus, CalendarDays, Mail, Check, Trash2, Pencil, Download, X, ChevronLeft, ChevronRight, Search, Sparkles, CheckCircle2, Clock, AlertCircle, Send, GanttChartSquare, ChevronDown, Flame, RefreshCw, Minus, RotateCcw } from "lucide-react";
import { PALETTE, uid, todayISO, addDays, dayDiff, fmtDue, download, remaining, ROLE_C, genCode, genCodes, viewerCodeOf, editorCodeOf, publishableProject, codeRoleFor, UserAv, Confetti, MemberAv } from "../helpers.jsx";
import { bumpOpen } from "../storage.js";
import { ganttLoad, ganttSave } from "../ganttApi.js";
import { TeamEmailModal } from "../components/modals.jsx";

const ZOOM = { week: { colw: 26 }, month: { colw: 11 }, year: { colw: 4.6 } };
function monthBands(rangeStart, totalDays) {
  const bands = []; let i = 0;
  while (i < totalDays) {
    const d = new Date(addDays(rangeStart, i) + "T00:00:00"); const y = d.getFullYear(), m = d.getMonth();
    let j = i; while (j < totalDays) { const dj = new Date(addDays(rangeStart, j) + "T00:00:00"); if (dj.getFullYear() !== y || dj.getMonth() !== m) break; j++; }
    bands.push({ start: i, end: j, long: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }), short: d.toLocaleDateString(undefined, { month: "short" }) });
    i = j;
  }
  return bands;
}
function dayTicks(rangeStart, totalDays, zoom) {
  const out = [];
  if (zoom === "week") { for (let i = 0; i < totalDays; i++) { const d = new Date(addDays(rangeStart, i) + "T00:00:00"); out.push({ i, label: d.getDate() }); } }
  else if (zoom === "month") { for (let i = 0; i < totalDays; i++) { const d = new Date(addDays(rangeStart, i) + "T00:00:00"); const dn = d.getDate(); if (dn === 1 || dn % 5 === 0) out.push({ i, label: dn }); } }
  return out;
}
function GanttAxis({ rangeStart, totalDays, ppd, zoom, today, LBL }) {
  const bands = monthBands(rangeStart, totalDays);
  const ticks = dayTicks(rangeStart, totalDays, zoom);
  const tIdx = dayDiff(rangeStart, today);
  return (
    <div style={{ display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: LBL, flexShrink: 0, position: "sticky", left: 0, zIndex: 2, background: "var(--panel)", alignSelf: "stretch", borderRight: "1px solid var(--line)" }} />
      <div style={{ position: "relative", width: totalDays * ppd, minWidth: totalDays * ppd, height: 42 }}>
        {bands.map(b => { const w = (b.end - b.start) * ppd; const small = w < 86; return (
          <div key={b.start} style={{ position: "absolute", left: b.start * ppd, width: w, top: 2, height: 17, borderBottom: "1px solid var(--line2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Fraunces", fontWeight: 600, fontSize: small ? 11 : 13, color: "var(--muted)", whiteSpace: "nowrap", padding: "0 6px", background: "var(--bg)" }}>{small ? b.short : b.long}</span>
          </div>
        ); })}
        {ticks.map(t => <span key={t.i} style={{ position: "absolute", left: t.i * ppd, top: 24, fontSize: 10, color: "var(--dim)", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>{t.label}</span>)}
        {tIdx >= 0 && tIdx < totalDays && <span style={{ position: "absolute", left: tIdx * ppd, top: 21, height: 21, width: 2, background: "var(--teal)", opacity: .4, transform: "translateX(-50%)", borderRadius: 2 }} title="Today" />}
      </div>
    </div>
  );
}
function reschedule(groups, opts) {
  const cascade = !!(opts && opts.cascade);
  const today = todayISO();
  const sorted = [...groups].filter(g => g.start || g.end).sort((a, b) => (a.start || a.end).localeCompare(b.start || b.end));
  const push = {};
  const isComplete = (g) => g.members.length > 0 && g.members.every(m => m.done);
  if (cascade) {
    for (let i = 0; i < sorted.length; i++) {
      const g = sorted[i];
      if (isComplete(g)) continue; // finished groups don't push
      const adjEnd = g.end ? addDays(g.end, push[g.id] || 0) : null;
      const behindBy = (adjEnd && adjEnd < today) ? dayDiff(adjEnd, today) : 0;
      if (behindBy <= 0) continue;
      for (let j = i + 1; j < sorted.length; j++) {
        const t = sorted[j];
        if (isComplete(t)) continue; // don't move finished groups
        const aff = g.affects; // undefined = affect all later, array = only those
        if (aff === undefined || aff.includes(t.id)) push[t.id] = (push[t.id] || 0) + behindBy;
      }
    }
  }
  return sorted.map(g => {
    const complete = isComplete(g);
    const sh = push[g.id] || 0;
    const adjStart = g.start ? addDays(g.start, sh) : null;
    const adjEnd = g.end ? addDays(g.end, sh) : null;
    const behind = !complete && !!adjEnd && adjEnd < today;
    return { ...g, adjStart, adjEnd, complete, behind, slipped: sh > 0 };
  });
}

export function GanttView({ ctx }) {
  const { data, user } = ctx;
  const team = data.people;
  const gd = ctx.gantt;
  const setGd = ctx.setGantt;
  const gdRef = useRef(gd);
  useEffect(() => { gdRef.current = gd; }, [gd]);
  const [history, setHistory] = useState([]);
  const canUndo = history.length > 0;
  const undo = () => { if (!history.length) return; const prev = history[history.length - 1]; setHistory(h => h.slice(0, -1)); setGd(g => ({ ...g, projects: prev })); };
  const [openId, setOpenId] = useState(null);
  const [edit, setEdit] = useState(null);
  useEffect(() => { if (ctx.ganttGoto) { setOpenId(ctx.ganttGoto); setWhoFilter("all"); setEdit(null); ctx.clearGanttGoto(); } }, [ctx.ganttGoto]);
  const [zoom, setZoom] = useState("week");
  const [invite, setInvite] = useState(null);
  const [pickSearch, setPickSearch] = useState("");
  const [colorFor, setColorFor] = useState(null);
  const [whoFilter, setWhoFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [joined, setJoined] = useState(null);
  const [codeRole, setCodeRole] = useState("viewer"); // which invite code the panel shows; viewer by default
  const [sortBy, setSortBy] = useState("created"); // project sort: created (oldest first) | name | modified
  const [presOpen, setPresOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [purgeArm, setPurgeArm] = useState(null);
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjDelta, setAdjDelta] = useState(0);
  const [adjMode, setAdjMode] = useState("none");
  const [adjSel, setAdjSel] = useState([]);
  const [mvStart, setMvStart] = useState(false);
  const [mvEnd, setMvEnd] = useState(true);
  const [cascOpen, setCascOpen] = useState(false);
  const [cascPick, setCascPick] = useState(null);
  const [cascSel, setCascSel] = useState([]);
  useEffect(() => { setAdjOpen(false); setAdjDelta(0); setAdjMode("none"); setAdjSel([]); setMvStart(false); setMvEnd(true); }, [edit && edit.gid]);
  const regenCode = (pid, role) => setProjects(ps => ps.map(p => {
    if (p.id !== pid) return p;
    const other = role === "editor" ? viewerCodeOf(p) : editorCodeOf(p);
    let c = genCode(); while (c === other) c = genCode();
    return { ...p, [role === "editor" ? "editorCode" : "viewerCode"]: c };
  }));
  // Backfill both invite codes on older projects that only have a single legacy code.
  useEffect(() => {
    if (!edit || !edit.pid) return;
    const p = gd.projects.find(x => x.id === edit.pid);
    if (p && (!p.viewerCode || !p.editorCode)) {
      const viewerCode = p.viewerCode || p.code || genCode();
      let editorCode = p.editorCode || genCode();
      while (editorCode === viewerCode) editorCode = genCode();
      patchProject(p.id, { viewerCode, editorCode });
    }
  }, [edit && edit.pid]);
  const completeProject = (pid, val) => patchProject(pid, { done: val });
  const softDelete = (pid) => patchProject(pid, { deleted: true, deletedAt: Date.now() });
  const restoreProject = (pid) => patchProject(pid, { deleted: false, deletedAt: null });
  const purgeProject = (pid) => setProjects(ps => ps.filter(p => p.id !== pid));
  const openJoined = (pid) => { bumpOpen(pid); setOpenId(pid); setWhoFilter("all"); };
  const tryJoin = async () => {
    const c = joinCode.trim().toUpperCase(); if (!c) return;
    // Already in this browser? Open it (and switch role if a different code was used).
    let role = null;
    const hit = gd.projects.find(p => { role = codeRoleFor(p, c); return !!role; });
    if (hit) {
      if (hit.myRole === "owner") { setJoinErr(""); setJoinCode(""); openJoined(hit.id); return; } // your own project — just open it
      if (hit.myRole !== role) setProjects(ps => ps.map(p => p.id === hit.id ? { ...p, myRole: role } : p));
      setJoinErr(""); setJoinCode(""); setJoined({ name: hit.name, role });
      setTimeout(() => setJoined(null), 2600); openJoined(hit.id);
      return;
    }
    // Look it up in the shared store (projects published by their owners).
    setJoinErr("Checking code…");
    try {
      const doc = await ganttLoad();
      let r2 = null;
      const remote = Object.values((doc && doc.projects) || {}).find(p => { r2 = codeRoleFor(p, c); return !!r2; });
      if (!remote) { setJoinErr("No project with that code."); return; }
      setProjects(ps => [...ps.filter(p => p.id !== remote.id), { ...remote, myRole: r2 }]);
      setJoinErr(""); setJoinCode(""); setJoined({ name: remote.name, role: r2 });
      setTimeout(() => setJoined(null), 2600); openJoined(remote.id);
    } catch (e) {
      const m = String((e && e.message) || "");
      if (m.includes("DATABASE_URL")) setJoinErr("Sharing isn't live yet — the site's database hasn't been connected (admin setup needed).");
      else if (m.includes("APP_KEY") || (e && e.status === 401)) setJoinErr("Sharing isn't live yet — the site's access key isn't configured (admin setup needed).");
      else setJoinErr("Can't reach the sharing server right now.");
    }
  };
  // Publish shareable projects (owner always; editors when their copy is newer) so codes work across devices.
  const applyingShared = useRef(false);
  useEffect(() => {
    if (applyingShared.current) { applyingShared.current = false; return; }
    const t = setTimeout(async () => {
      const ps = gdRef.current.projects;
      if (!ps.some(p => p.myRole !== "viewer" && (viewerCodeOf(p) || editorCodeOf(p)))) return;
      try {
        const doc = (await ganttLoad()) || {};
        const shared = doc.projects || {};
        let changed = false;
        for (const p of ps) {
          if (p.myRole === "viewer" || !(viewerCodeOf(p) || editorCodeOf(p))) continue;
          if (p.deleted) { if (p.myRole === "owner" && shared[p.id]) { delete shared[p.id]; changed = true; } continue; }
          const cur = shared[p.id];
          const shouldWrite = p.myRole === "owner" ? (!cur || (p.updatedAt || 0) >= (cur.updatedAt || 0)) : (!cur ? false : (p.updatedAt || 0) > (cur.updatedAt || 0));
          if (shouldWrite) { shared[p.id] = publishableProject(p); changed = true; }
        }
        if (changed) await ganttSave({ projects: shared });
      } catch (e) {}
    }, 1200);
    return () => clearTimeout(t);
  }, [gd.projects]);
  // Poll the shared store so joined projects receive the owner's updates.
  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const doc = await ganttLoad();
        if (stop || !doc || !doc.projects) return;
        const cur = gdRef.current.projects;
        let changed = false;
        const next = cur.map(p => {
          if (p.myRole === "owner" || p.deleted) return p;
          const sh = doc.projects[p.id];
          if (!sh || (sh.updatedAt || 0) <= (p.updatedAt || 0)) return p;
          changed = true;
          return { ...sh, myRole: p.myRole };
        });
        if (changed) { applyingShared.current = true; setGd(g => ({ ...g, projects: next })); }
      } catch (e) {}
    };
    tick();
    const iv = setInterval(tick, 8000);
    return () => { stop = true; clearInterval(iv); };
  }, []);
  const [hoverGid, setHoverGid] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [dragTip, setDragTip] = useState(null);
  const [barTip, setBarTip] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const hoverTimer = useRef(null);
  const justDragged = useRef(false);
  const dragging = useRef(false);
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const [sx, setSx] = useState({ l: 0, w: 1, c: 1 });
  const syncScroll = () => { const el = scrollRef.current; if (el) setSx(s => (s.l === el.scrollLeft && s.w === el.scrollWidth && s.c === el.clientWidth) ? s : { l: el.scrollLeft, w: el.scrollWidth, c: el.clientWidth }); };
  useEffect(() => { syncScroll(); });
  const dragBar = (clientX) => { const t = trackRef.current, el = scrollRef.current; if (!t || !el) return; const r = t.getBoundingClientRect(); const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width)); el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth); };
  const startBarDrag = (e) => { e.preventDefault(); dragBar(e.clientX); const move = (ev) => dragBar(ev.clientX); const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); }; window.addEventListener("mousemove", move); window.addEventListener("mouseup", up); };
  const openHover = (gid, pos) => { if (dragging.current) return; clearTimeout(hoverTimer.current); if (pos) setHoverPos(pos); setHoverGid(gid); };
  const closeHover = () => { hoverTimer.current = setTimeout(() => setHoverGid(null), 180); };
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const onWheel = (e) => {
      const canX = el.scrollWidth > el.clientWidth + 1, canY = el.scrollHeight > el.clientHeight + 1;
      if (e.deltaX) { if (canX) { e.preventDefault(); el.scrollLeft += e.deltaX; } return; }
      if (e.shiftKey && canX) { e.preventDefault(); el.scrollLeft += e.deltaY; return; }
      const overChart = (e.clientX - el.getBoundingClientRect().left) > LBL; // right of the labels = chart
      if (overChart && canX) {
        const atStart = el.scrollLeft <= 0, atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        if (!((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd))) { e.preventDefault(); el.scrollLeft += e.deltaY; return; }
      }
      if (canY) { e.preventDefault(); el.scrollTop += e.deltaY; } // labels area, or chart at its edge → vertical
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { const cutoff = Date.now() - 30 * 86400000; setGd(g => { const keep = g.projects.filter(p => !(p.deleted && p.deletedAt && p.deletedAt < cutoff)); return keep.length === g.projects.length ? g : { ...g, projects: keep }; }); }, []);
  useEffect(() => { if (!openId) return; const p = gdRef.current.projects.find(x => x.id === openId); if (p && p.invited) setGd(g => ({ ...g, projects: g.projects.map(x => x.id === openId ? { ...x, invited: false } : x) })); }, [openId]);

  const setProjects = (fn) => { setHistory(h => [...h.slice(-29), gdRef.current.projects]); setGd(g => ({ ...g, projects: fn(g.projects) })); };
  // Viewers are read-only: they can only remove the project from their own list (deleted/deletedAt).
  const patchProject = (pid, patch) => setProjects(ps => ps.map(p => {
    if (p.id !== pid) return p;
    if (p.myRole === "viewer") {
      const allowed = {};
      ["deleted", "deletedAt"].forEach(k => { if (k in patch) allowed[k] = patch[k]; });
      return Object.keys(allowed).length ? { ...p, ...allowed } : p;
    }
    return { ...p, ...patch, updatedAt: Date.now() };
  }));
  const patchGroup = (pid, gid, fn) => setProjects(ps => ps.map(p => (p.id !== pid || p.myRole === "viewer") ? p : { ...p, updatedAt: Date.now(), groups: p.groups.map(gr => gr.id === gid ? fn(gr) : gr) }));
  // New projects go through a draft modal — nothing is created until "Create project" is clicked.
  const [draft, setDraft] = useState(null);
  const startDraft = () => setDraft({ name: "", start: todayISO(), due: addDays(todayISO(), 30), color: PALETTE[gdRef.current.projects.length % PALETTE.length] });
  const createProject = () => {
    if (!draft || !draft.name.trim()) return;
    const id = uid(); const ts = Date.now();
    setProjects(ps => [...ps, { id, name: draft.name.trim(), color: draft.color, due: draft.due, start: draft.start, myRole: "owner", ...genCodes(), codeCadence: "month", cascade: false, createdAt: ts, updatedAt: ts, groups: [] }]);
    setDraft(null); setOpenId(id); setEdit({ pid: id });
  };
  const delProject = (pid) => { setProjects(ps => ps.filter(p => p.id !== pid)); setEdit(null); setOpenId(null); };
  const addGroup = (pid) => { const id = uid(); const p = gdRef.current.projects.find(x => x.id === pid); if (p && p.myRole === "viewer") return; const used = new Set((p ? p.groups : []).map(g => g.color)); const color = PALETTE.find(c => !used.has(c)) || PALETTE[(p ? p.groups.length : 0) % PALETTE.length]; setProjects(ps => ps.map(x => x.id !== pid ? x : { ...x, groups: [...x.groups, { id, name: "New group", color, desc: "", start: todayISO(), end: addDays(todayISO(), 5), members: [] }] })); setEdit({ pid, gid: id }); };
  const delGroup = (pid, gid) => { const p = gdRef.current.projects.find(x => x.id === pid); if (p && p.myRole === "viewer") return; let next = { pid }; if (p) { const idx = p.groups.findIndex(g => g.id === gid); const remaining = p.groups.filter(g => g.id !== gid); if (remaining.length) next = { pid, gid: remaining[Math.max(0, idx - 1)].id }; } setProjects(ps => ps.map(x => x.id !== pid ? x : { ...x, groups: x.groups.filter(g => g.id !== gid) })); setEdit(next); };
  const toggleMember = (pid, gid, mid) => patchGroup(pid, gid, gr => ({ ...gr, members: gr.members.map(m => m.id === mid ? { ...m, done: !m.done } : m) }));
  const addMember = (pid, gid, person) => patchGroup(pid, gid, gr => gr.members.some(m => m.id === person.id) ? gr : ({ ...gr, members: [...gr.members, { id: person.id, name: person.name, color: person.color, done: false }] }));
  const removeMember = (pid, gid, mid) => patchGroup(pid, gid, gr => ({ ...gr, members: gr.members.filter(m => m.id !== mid) }));
  const setMemberColor = (pid, gid, mid, color) => patchGroup(pid, gid, gr => ({ ...gr, members: gr.members.map(m => m.id === mid ? { ...m, color } : m) }));
  const addNote = (pid, gid, text) => { if (!text.trim()) return; patchGroup(pid, gid, gr => ({ ...gr, notes: [...(gr.notes || []), { id: uid(), by: user.name, text: text.trim() }] })); setNoteDraft(""); };
  const delNote = (pid, gid, nid) => patchGroup(pid, gid, gr => ({ ...gr, notes: (gr.notes || []).filter(n => n.id !== nid) }));
  const saveNote = (pid, gid, nid, text) => { patchGroup(pid, gid, gr => ({ ...gr, notes: (gr.notes || []).map(n => n.id === nid ? { ...n, text } : n) })); setEditId(null); };
  const applyAdjust = (pid, gid) => {
    const delta = adjDelta;
    if (delta === 0 || (!mvStart && !mvEnd)) { setAdjOpen(false); return; }
    const p = gdRef.current.projects.find(x => x.id === pid);
    const pStart = (p && p.start) || todayISO();
    const affected = adjMode === "all" ? (p ? p.groups.filter(g => g.id !== gid).map(g => g.id) : []) : adjMode === "choose" ? adjSel : [];
    setProjects(ps => ps.map(pp => pp.id !== pid ? pp : ({ ...pp, groups: pp.groups.map(g => {
      if (g.id === gid) {
        let ns = g.start, ne = g.end;
        if (mvStart && ns) { ns = addDays(ns, delta); if (ns < pStart) ns = pStart; }
        if (mvEnd && ne) ne = addDays(ne, delta);
        if (ns && ne && ne < ns) ne = ns;
        return { ...g, start: ns, end: ne };
      }
      if (affected.includes(g.id)) return { ...g, start: g.start ? addDays(g.start, delta) : g.start, end: g.end ? addDays(g.end, delta) : g.end };
      return g;
    }) })));
    setAdjOpen(false); setAdjDelta(0); setAdjMode("none"); setAdjSel([]); setMvStart(false); setMvEnd(true);
  };

  /* ---------- picker ---------- */
  if (openId !== "__all__" && openId !== "__trash__" && (!openId || !gd.projects.find(p => p.id === openId))) {
    return (
      <>
        <div className="head">
          <div><div className="h-title">Which project today?</div><div className="h-sub">Pick a project to open its timeline.</div></div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={joinCode} onChange={e => { setJoinCode(e.target.value); setJoinErr(""); }} onKeyDown={e => e.key === "Enter" && tryJoin()} placeholder="Join with a code" style={{ width: 130, fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 10, padding: "8px 11px", background: "var(--panel)", outline: "none", textTransform: "uppercase" }} />
                <button className="btn" onClick={tryJoin}>Join</button>
              </div>
              <div style={{ fontSize: 10.5, color: joinErr ? "var(--primary)" : "var(--dim)", marginTop: 3, textAlign: "center" }}>{joinErr || "Enter a project's viewer or editor code"}</div>
            </div>
            {gd.projects.some(p => p.deleted) && <button className="btn" onClick={() => setOpenId("__trash__")}><Trash2 size={15} />Trash ({gd.projects.filter(p => p.deleted).length})</button>}
            <button className="btn btn-pri" onClick={startDraft}><Plus size={16} />New project</button>
          </div>
        </div>
        {joined && <Confetti />}
        {joined && <div className="toast">🎉 Successfully joined "{joined.name}" as {joined.role}</div>}
        {gd.projects.filter(p => !p.deleted).length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
              <Search size={15} style={{ position: "absolute", left: 11, top: 10, color: "var(--dim)" }} />
              <input value={pickSearch} onChange={e => setPickSearch(e.target.value)} placeholder="Search projects…" style={{ width: "100%", paddingLeft: 34, fontFamily: "Outfit", fontSize: 13.5, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 11, padding: "9px 12px 9px 34px", background: "var(--panel)", outline: "none" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)" }}>Sort
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 10, padding: "8px 10px", background: "var(--panel)", outline: "none", cursor: "pointer" }}>
                <option value="created">Date created</option>
                <option value="name">Name (A–Z)</option>
                <option value="modified">Last modified</option>
              </select>
            </label>
          </div>
        )}
        {gd.projects.filter(p => !p.deleted).length >= 2 && !pickSearch.trim() && (
          <div className="panel" style={{ cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, borderLeft: "3px solid var(--teal)" }} onClick={() => setOpenId("__all__")}>
            <GanttChartSquare size={22} color="var(--teal)" />
            <div><div style={{ fontFamily: "Fraunces", fontSize: 18, fontWeight: 600 }}>All projects overview</div><div style={{ fontSize: 12.5, color: "var(--muted)" }}>Every project on one big timeline, by due date.</div></div>
            <ChevronRight size={18} style={{ marginLeft: "auto", color: "var(--muted)" }} />
          </div>
        )}
        {(() => {
          const base = gd.projects.filter(p => !p.deleted && (!pickSearch.trim() || p.name.toLowerCase().includes(pickSearch.trim().toLowerCase())));
          const order = new Map(gd.projects.map((p, i) => [p.id, i]));
          const createdVal = (p) => p.createdAt || order.get(p.id) || 0;
          const updatedVal = (p) => p.updatedAt || p.createdAt || order.get(p.id) || 0;
          const sortFn = sortBy === "name" ? (a, b) => (a.name || "").localeCompare(b.name || "")
            : sortBy === "modified" ? (a, b) => updatedVal(b) - updatedVal(a)
            : (a, b) => createdVal(a) - createdVal(b);
          const active = base.filter(p => !p.done).sort(sortFn);
          const completed = base.filter(p => p.done).sort(sortFn);
          const renderCard = (p) => {
            const rem = remaining(p.due, now);
            const total = p.groups.length, done = p.groups.filter(g => g.members.length > 0 && g.members.every(m => m.done)).length;
            return (
                <div key={p.id} className="panel" style={{ position: "relative", borderTop: `3px solid ${p.color}`, paddingBottom: 12, ...(p.invited ? { boxShadow: "0 0 0 2px var(--teal)" } : {}) }}>
                  {p.invited && <div style={{ position: "absolute", top: -10, left: 12, zIndex: 4, background: "var(--teal)", color: "#06121e", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, boxShadow: "0 3px 10px rgba(0,0,0,.3)" }}>Invited! · {p.invitedAs || "editor"}</div>}
                  {p.done && <div style={{ position: "absolute", inset: 0, background: "rgba(51,179,107,.16)", border: "2px solid var(--done)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, pointerEvents: "none" }}><span style={{ fontFamily: "Fraunces", fontSize: 21, fontWeight: 700, color: "var(--done)", display: "flex", gap: 8, alignItems: "center" }}><CheckCircle2 size={23} />Completed</span></div>}
                  <div style={{ cursor: "pointer" }} onClick={() => { bumpOpen(p.id); setOpenId(p.id); setEdit(null); setWhoFilter("all"); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 4, background: p.color }} />
                      <span style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: ROLE_C[p.myRole], background: ROLE_C[p.myRole] + "22", border: `1px solid ${ROLE_C[p.myRole]}55`, borderRadius: 99, padding: "2px 9px", textTransform: "capitalize" }}>{p.myRole}</span>
                    </div>
                    <div style={{ fontSize: 13, color: (p.due && (rem.past || rem.soon)) ? "var(--primary)" : "var(--muted)", fontWeight: 600 }}>{p.due ? (rem.past ? `Overdue by ${rem.txt}` : `${rem.txt} left`) : "No due date"}</div>
                    <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{done}/{total} groups complete</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end", position: "relative", zIndex: 3 }}>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); completeProject(p.id, !p.done); }} style={{ padding: "9px 14px", fontSize: 13.5, ...(p.done ? { color: "var(--done)", borderColor: "var(--done)" } : {}) }} title={p.done ? "Mark not complete" : "Mark complete"}><Check size={16} />{p.done ? "Completed" : "Complete"}</button>
                    <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); setConfirmDel(p); }} style={{ padding: "9px 13px", color: "#ff8a8c" }} title="Delete project"><X size={19} /></button>
                  </div>
                </div>
            );
          };
          const grid = (list) => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 14 }}>{list.map(renderCard)}</div>;
          return (
            gd.projects.filter(p => !p.deleted).length === 0 ? <div className="empty-sm" style={{ padding: 40 }}>No projects yet — create your first one.</div> :
            base.length === 0 ? <div className="empty-sm" style={{ padding: 30 }}>No projects match "{pickSearch}".</div> :
            <>
              {active.length > 0 ? grid(active) : <div className="empty-sm" style={{ padding: 24 }}>No active projects — everything's complete. 🎉</div>}
              {completed.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "26px 0 12px" }}>
                    <CheckCircle2 size={17} color="var(--done)" />
                    <span style={{ fontFamily: "Fraunces", fontSize: 16.5, fontWeight: 600, color: "var(--ink)" }}>Completed</span>
                    <span style={{ fontSize: 12.5, color: "var(--dim)", fontWeight: 600 }}>{completed.length}</span>
                  </div>
                  {grid(completed)}
                </>
              )}
            </>
          );
        })()}
        {draft && (
          <div className="ov" onClick={() => setDraft(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="modal-h"><h2>New project</h2><button className="btn btn-ghost icon-btn" onClick={() => setDraft(null)}><X size={18} /></button></div>
              <div className="fld"><label>Project name</label><input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && createProject()} placeholder="e.g. Walmart Remodel" autoFocus /></div>
              <div className="row2">
                <div className="fld"><label>Start date</label><input type="date" value={draft.start} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => setDraft(d => ({ ...d, start: e.target.value }))} /></div>
                <div className="fld"><label>Due date</label><input type="date" value={draft.due} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => setDraft(d => ({ ...d, due: e.target.value }))} /></div>
              </div>
              <div className="fld"><label>Color</label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {PALETTE.map(c => <span key={c} className={`swatch ${draft.color === c ? "on" : ""}`} style={{ background: c }} onClick={() => setDraft(d => ({ ...d, color: c }))} />)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button className="btn" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={() => setDraft(null)}>Cancel</button>
                <button className="btn btn-pri" style={{ flex: 1, justifyContent: "center", padding: "12px" }} disabled={!draft.name.trim()} onClick={createProject}><Check size={15} />Create project</button>
              </div>
              <div className="login-foot" style={{ marginTop: 10 }}>Nothing is made until you hit Create — closing this discards the draft.</div>
            </div>
          </div>
        )}
        {confirmDel && (
          <div className="ov" onClick={() => setConfirmDel(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 390 }}>
              <div className="modal-h"><h2>Delete project?</h2><button className="btn btn-ghost icon-btn" onClick={() => setConfirmDel(null)}><X size={18} /></button></div>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 18px" }}>"{confirmDel.name}" will move to Trash. You can restore it within <b style={{ color: "var(--ink)" }}>30 days</b> — after that it's removed for everyone, for good.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" style={{ flex: 1, justifyContent: "center", padding: "13px" }} onClick={() => setConfirmDel(null)}>Cancel</button>
                <button className="btn" style={{ flex: 1, justifyContent: "center", padding: "13px", background: "var(--primary)", borderColor: "var(--primary)", color: "#fff" }} onClick={() => { softDelete(confirmDel.id); setConfirmDel(null); }}><Trash2 size={16} />Move to trash</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ---------- trash ---------- */
  if (openId === "__trash__") {
    const del = gd.projects.filter(p => p.deleted);
    return (
      <>
        <div className="head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-sm" onClick={() => setOpenId(null)}><ChevronLeft size={15} />Projects</button>
            <div><div className="h-title">Trash</div><div className="h-sub">Deleted projects are kept for 30 days, then removed for good.</div></div>
          </div>
        </div>
        {del.length === 0 ? <div className="empty-sm" style={{ padding: 40 }}>Trash is empty.</div> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {del.map(p => {
              const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - (p.deletedAt || Date.now())) / 86400000));
              const armed = purgeArm === p.id;
              return (
                <div key={p.id} className="panel" style={{ borderTop: `3px solid ${p.color}`, opacity: .92 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: p.color }} />
                    <span style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: daysLeft <= 5 ? "var(--primary)" : "var(--muted)", fontWeight: 600 }}>Deleted · {daysLeft} {daysLeft === 1 ? "day" : "days"} left to restore</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button className="btn" style={{ flex: 1, justifyContent: "center", padding: "10px" }} onClick={() => { restoreProject(p.id); setPurgeArm(null); }}><RefreshCw size={15} />Restore</button>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "10px", color: "#ff8a8c", borderColor: armed ? "#ff8a8c" : undefined }} onClick={() => { if (armed) { purgeProject(p.id); setPurgeArm(null); } else setPurgeArm(p.id); }}><Trash2 size={15} />{armed ? "Tap to confirm" : "Delete forever"}</button>
                  </div>
                </div>
              );
            })}
          </div>}
      </>
    );
  }

  /* ---------- all-projects overview (read-only) ---------- */
  if (openId === "__all__") {
    const Z2 = ZOOM[zoom];
    const list = gd.projects.filter(p => !p.deleted && (roleFilter === "all" || p.myRole === roleFilter));
    const spanOf = (p) => {
      const dd = []; const sc = reschedule(p.groups, { cascade: p.cascade === true });
      if (p.start) dd.push(p.start);
      p.groups.forEach(g => { if (g.start) dd.push(g.start); });
      sc.forEach(g => { if (g.adjEnd) dd.push(g.adjEnd); });
      if (p.due) dd.push(p.due);
      dd.push(todayISO()); dd.sort();
      return { s: dd[0], e: p.due || dd[dd.length - 1], behind: sc.some(g => g.slipped) };
    };
    const rowsData = list.map(p => ({ p, ...spanOf(p) })).sort((a, b) => (a.e || "").localeCompare(b.e || ""));
    const all = []; rowsData.forEach(r => { all.push(r.s); all.push(r.e); }); all.push(todayISO()); all.sort();
    const rs = addDays(all[0] || todayISO(), -2), re = addDays(all[all.length - 1] || todayISO(), 3);
    const td = Math.max(7, dayDiff(rs, re) + 1);
    const ds2 = Array.from({ length: td }, (_, i) => addDays(rs, i));
    const tIdx = dayDiff(rs, todayISO());
    const LBL2 = 180;
    const mLabel = (() => { const a = new Date(rs + "T00:00:00"), b = new Date(re + "T00:00:00"); return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear() ? a.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : `${a.toLocaleDateString(undefined, { month: "short" })} – ${b.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`; })();
    return (
      <>
        <div className="head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn-sm" onClick={() => setOpenId(null)}><ChevronLeft size={15} />Projects</button>
            <div><div className="h-title">All projects</div><div className="h-sub">Each project by its due date. Read-only.</div></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="btn" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} title="Filter by your role">
              <option value="all">All roles</option><option value="owner">Owner</option><option value="editor">Editor</option><option value="viewer">Viewer</option>
            </select>
            <select className="btn" value={zoom} onChange={e => setZoom(e.target.value)}>
              <option value="week">Range: Week</option><option value="month">Range: Month</option><option value="year">Range: Year</option>
            </select>
            {zoom === "year" && (() => { const ys = new Date(rs + "T00:00:00").getFullYear(), ye = new Date(re + "T00:00:00").getFullYear(); if (ye <= ys) return null; const yrs = []; for (let y = ys; y <= ye; y++) yrs.push(y); return (
              <select className="btn btn-sm" defaultValue="all" onChange={e => { const el = scrollRef.current; if (!el) return; if (e.target.value === "all") el.scrollTo({ left: 0, behavior: "smooth" }); else el.scrollTo({ left: Math.max(0, dayDiff(rs, `${e.target.value}-01-01`) * Z2.colw), behavior: "smooth" }); }} title="Jump to a year">
                <option value="all">Show all</option>{yrs.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            ); })()}
          </div>
        </div>
        <div className="gantt-wrap" style={{ position: "relative" }}>
          <button className="navarrow" onClick={() => { const el = scrollRef.current; if (el) el.scrollBy({ left: -el.clientWidth * 0.7, behavior: "smooth" }); }} style={{ left: 6 }} title="Back"><ChevronLeft size={18} /></button>
          <button className="navarrow" onClick={() => { const el = scrollRef.current; if (el) el.scrollBy({ left: el.clientWidth * 0.7, behavior: "smooth" }); }} style={{ right: 6 }} title="Forward"><ChevronRight size={18} /></button>
          <div className="gantt-scroll" ref={scrollRef}>
            <div className="gantt-grid" style={{ minWidth: LBL2 + td * Z2.colw }}>
              <GanttAxis rangeStart={rs} totalDays={td} ppd={Z2.colw} zoom={zoom} today={todayISO()} LBL={LBL2} />
              <div style={{ position: "relative", minHeight: Math.max(5, rowsData.length) * 64 }}>
                {tIdx >= 0 && tIdx < td && <div style={{ position: "absolute", top: 0, bottom: 0, left: LBL2 + tIdx * Z2.colw + Z2.colw / 2, width: 2, background: "var(--teal)", zIndex: 4 }} />}
                {rowsData.map(r => {
                  const sIdx = dayDiff(rs, r.s), w = (dayDiff(r.s, r.e) + 1) * Z2.colw;
                  return (
                    <div className="gantt-row" key={r.p.id} style={{ height: 64 }}>
                      <div className="gantt-lbl" style={{ width: LBL2, flexBasis: LBL2, display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 99, background: ROLE_C[r.p.myRole], flexShrink: 0 }} title={r.p.myRole} />{r.p.name}
                      </div>
                      <div className="gantt-track">
                        <div className="gantt-bar" style={{ left: Math.max(0, sIdx) * Z2.colw, width: Math.max(10, w - 2), background: r.p.color, top: 16, height: 32, fontSize: 13.5, cursor: "default" }} title={`${r.p.name} · due ${fmtDue(r.p.due)}`}>
                          {w > 80 && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.p.name}{r.p.done ? " ✓" : ""}</span>}
                          {r.behind && <span style={{ marginLeft: "auto", flexShrink: 0 }}><Flame size={13} /></span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {rowsData.length === 0 && <div className="empty-sm" style={{ padding: 30 }}>No projects match that role.</div>}
              </div>
            </div>
          </div>
          <div className="foot-note" style={{ marginTop: 12, justifyContent: "flex-start" }}><Sparkles size={12} /> Your projects by due date · sort with the role filter. Light-blue line = today.</div>
        </div>
      </>
    );
  }

  /* ---------- timeline ---------- */
  const proj = gd.projects.find(p => p.id === openId);
  const role = proj.myRole;
  const isOwner = role === "owner";
  const canOpen = role !== "viewer";          // open editor, sign off, add people, edit desc/member color
  const rem = remaining(proj.due, now);
  const Z = ZOOM[zoom];
  const projMembers = (() => { const seen = {}; const out = []; proj.groups.forEach(g => g.members.forEach(m => { if (!seen[m.id]) { seen[m.id] = 1; out.push(m); } })); return out; })();

  const schedFull = reschedule(proj.groups, { cascade: proj.cascade === true });
  const behind = schedFull.some(g => g.behind);
  const sched = (whoFilter !== "all") ? schedFull.filter(g => g.members.some(m => m.id === whoFilter)) : schedFull;

  const today = todayISO();
  const projStart = proj.start || (proj.groups.reduce((m, g) => (g.start && (!m || g.start < m)) ? g.start : m, null)) || today;
  const ds = [projStart, today];
  sched.forEach(g => { if (g.adjEnd) ds.push(g.adjEnd); if (g.end) ds.push(g.end); });
  if (proj.due) ds.push(proj.due);
  ds.sort();
  const rangeStart = addDays(projStart < ds[0] ? projStart : ds[0], -2);
  const rangeEnd = addDays(ds[ds.length - 1], 3);
  const totalDays = Math.min(4000, Math.max(7, dayDiff(rangeStart, rangeEnd) + 1 || 7));
  const days = Array.from({ length: totalDays }, (_, i) => addDays(rangeStart, i));
  const todayIdx = dayDiff(rangeStart, today);
  const dueIdx = proj.due ? dayDiff(rangeStart, proj.due) : -1;
  const LBL = 180, ROWH = 46;
  const rows = (whoFilter !== "all") ? Math.max(1, sched.length) : Math.max(6, sched.length);
  const emptyRows = Math.max(0, rows - sched.length);
  const trackH = rows * ROWH;

  const editTarget = edit ? (() => { const p = gd.projects.find(x => x.id === edit.pid); if (!p) return null; return { p, g: edit.gid ? p.groups.find(x => x.id === edit.gid) : null }; })() : null;
  const setRole = (r) => patchProject(proj.id, { myRole: r });
  const startDrag = (e, g) => {
    if (!isOwner) return;
    e.preventDefault();
    dragging.current = true; clearTimeout(hoverTimer.current); setHoverGid(null);
    setHistory(h => [...h.slice(-29), gdRef.current.projects]);
    const colw = ZOOM[zoom].colw, startX = e.clientX, oS = g.start, oE = g.end, gid = g.id, pid = proj.id;
    const floorDelta = oS ? dayDiff(oS, projStart) : -99999; // start can't go before project start
    let last = 0, moved = false;
    setDragTip({ x: e.clientX, y: e.clientY, s: oS, e: oE });
    const move = (ev) => {
      let delta = Math.round((ev.clientX - startX) / colw);
      if (delta < floorDelta) delta = floorDelta;
      const ns = oS ? addDays(oS, delta) : oS, ne = oE ? addDays(oE, delta) : oE;
      setDragTip({ x: ev.clientX, y: ev.clientY, s: ns, e: ne });
      if (delta === last) return;
      last = delta; if (delta !== 0) moved = true;
      setGd(gg => ({ ...gg, projects: gg.projects.map(p => p.id !== pid ? p : { ...p, groups: p.groups.map(gr => gr.id !== gid ? gr : { ...gr, start: ns, end: ne }) }) }));
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); dragging.current = false; setDragTip(null); if (moved) { justDragged.current = true; setTimeout(() => { justDragged.current = false; }, 60); } };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };
  const scrollChart = (dir) => { const el = scrollRef.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" }); };
  const yearsInRange = (() => { const out = []; const ys = new Date(rangeStart + "T00:00:00").getFullYear(), ye = new Date(rangeEnd + "T00:00:00").getFullYear(); for (let y = ys; y <= ye; y++) out.push(y); return out; })();
  const jumpYear = (y) => { const el = scrollRef.current; if (!el) return; if (y === "all") { el.scrollTo({ left: 0, behavior: "smooth" }); return; } el.scrollTo({ left: Math.max(0, dayDiff(rangeStart, `${y}-01-01`) * Z.colw), behavior: "smooth" }); };
  const scrollToToday = () => { const el = scrollRef.current; if (!el) return; const x = LBL + todayIdx * Z.colw + Z.colw / 2 - el.clientWidth / 2; el.scrollTo({ left: Math.max(0, x), behavior: "smooth" }); };
  const exportGantt = () => {
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const ppd = 24;
    const starts = sched.map(g => g.adjStart).filter(Boolean);
    const ends = sched.map(g => g.adjEnd).filter(Boolean);
    let exStart = proj.start || today; starts.forEach(s => { if (s < exStart) exStart = s; });
    let exEnd = proj.due || today; ends.forEach(e => { if (e > exEnd) exEnd = e; });
    exStart = addDays(exStart, -2); exEnd = addDays(exEnd, 2);
    const tot = Math.max(1, dayDiff(exStart, exEnd) + 1), W = tot * ppd;
    const tIdx = dayDiff(exStart, today), dIdx = proj.due ? dayDiff(exStart, proj.due) : -1;
    const allM = sched.reduce((a, g) => a + g.members.length, 0);
    const doneM = sched.reduce((a, g) => a + g.members.filter(m => m.done).length, 0);
    const grpDone = sched.filter(g => g.complete).length;
    const pct = allM ? Math.round(doneM / allM * 100) : (sched.length ? Math.round(grpDone / sched.length * 100) : 0);
    const months = monthBands(exStart, tot).map(b => `<div class="mb" style="left:${b.start * ppd}px;width:${(b.end - b.start) * ppd}px">${esc(b.long)}</div>`).join("");
    const rows = sched.map(g => {
      const s = g.adjStart, e = g.adjEnd; const left = s ? dayDiff(exStart, s) * ppd : 0; const w = (s && e) ? (dayDiff(s, e) + 1) * ppd : ppd;
      const done = g.members.filter(m => m.done).length; const color = g.complete ? "#33B36B" : (g.color || proj.color);
      const who = g.members.map(m => esc(m.name) + (m.done ? " \u2713" : "")).join(", ") || "\u2014";
      return `<div class="row"><div class="lbl"><b>${esc(g.name)}</b><span class="sub">${fmtDue(s)}\u2013${fmtDue(e)} \u00b7 ${done}/${g.members.length} signed off \u00b7 ${who}</span></div><div class="track"><div class="bar" style="left:${left}px;width:${Math.max(8, w - 2)}px;background:${color}">${esc(g.name)}</div></div></div>`;
    }).join("");
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(proj.name)} \u2014 Gantt</title>
<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:0;background:#0E131B;color:#E8EDF4;padding:28px}
h1{font-size:23px;margin:0 0 4px}.meta{color:#9AA7B8;font-size:13px;margin-bottom:8px}
.prog{height:9px;background:#243042;border-radius:99px;max-width:420px;margin-bottom:20px;overflow:hidden}.prog>i{display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,#33B36B,#57d18c)}
.scroll{overflow-x:auto;border:1px solid #243042;border-radius:14px;padding:14px;background:#141B26}
.axis{position:relative;height:22px;margin-left:240px;width:${W}px;border-bottom:1px solid #2A3647}.mb{position:absolute;top:0;font-size:12px;color:#9AA7B8;border-left:1px solid #2A3647;padding-left:6px;font-weight:600;white-space:nowrap}
.body{position:relative;margin-top:6px}
.row{display:flex;align-items:center;height:44px}
.lbl{width:240px;flex:0 0 240px;padding-right:12px;font-size:13px;display:flex;flex-direction:column;gap:2px}
.lbl .sub{color:#9AA7B8;font-size:10.5px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.track{position:relative;flex:1;height:100%}
.bar{position:absolute;top:10px;height:23px;border-radius:6px;color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;padding:0 8px;overflow:hidden;white-space:nowrap;box-shadow:0 2px 5px rgba(0,0,0,.3)}
.foot{color:#6B7888;font-size:11px;margin-top:14px}@media print{body{background:#fff;color:#000}.scroll{border-color:#ccc;background:#fff}}</style></head>
<body><h1>${esc(proj.name)}</h1><div class="meta">${proj.due ? "Due " + fmtDue(proj.due) + " \u00b7 " : ""}${sched.length} groups \u00b7 ${pct}% complete \u00b7 exported ${fmtDue(today)} from Cadence</div>
<div class="prog"><i></i></div>
<div class="scroll"><div class="axis">${months}</div><div class="body" style="width:${240 + W}px">
${tIdx >= 0 && tIdx < tot ? `<div style="position:absolute;left:${240 + tIdx * ppd + ppd / 2}px;top:0;bottom:0;width:2px;background:#4FA8E8;z-index:2"></div>` : ""}
${dIdx >= 0 ? `<div style="position:absolute;left:${240 + dIdx * ppd + ppd / 2}px;top:0;bottom:0;border-left:2px dashed #E03A3E;z-index:2"></div>` : ""}
${rows}</div></div>
<div class="foot">Blue line = today, red dashed = project due. Use your browser's Print \u2192 Save as PDF to keep a copy.</div></body></html>`;
    const w = window.open("", "_blank");
    if (w && w.document) { w.document.open(); w.document.write(html); w.document.close(); }
    else { const b = new Blob([html], { type: "text/html" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `${proj.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-gantt.html`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1500); }
  };

  return (
    <>
      {dragTip && <div style={{ position: "fixed", left: dragTip.x + 14, top: dragTip.y - 14, zIndex: 90, pointerEvents: "none", background: "var(--ink)", color: "var(--bg)", fontSize: 11.5, fontWeight: 700, padding: "4px 8px", borderRadius: 7, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,.3)" }}>{fmtDue(dragTip.s)}{dragTip.e ? ` → ${fmtDue(dragTip.e)}` : ""}</div>}
      {barTip && <div style={{ position: "fixed", left: barTip.x, top: barTip.y - 10, transform: "translate(-50%,-100%)", zIndex: 95, pointerEvents: "none", background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 11, padding: "9px 12px", boxShadow: "0 12px 32px rgba(0,0,0,.45)", maxWidth: 280 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: barTip.color, marginBottom: barTip.items.length ? 5 : 0 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: barTip.color }} />{barTip.title}</div>
        {barTip.items.length > 0 ? <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5 }}>{barTip.items.join(", ")}</div> : <div style={{ fontSize: 11.5, color: "var(--dim)" }}>Nothing here.</div>}
      </div>}
      {invite && (
        <div className="ov" onClick={() => setInvite(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-h"><h2>Invite to {proj.name}</h2><button className="btn btn-ghost icon-btn" onClick={() => setInvite(null)}><X size={18} /></button></div>
            <div className="fld"><label>Their email</label><input type="email" value={invite.email} onChange={e => setInvite(v => ({ ...v, email: e.target.value }))} placeholder="name@company.com" autoFocus /></div>
            <div className="fld"><label>Role</label>
              <div className="mode-pick">
                <button className={invite.role === "editor" ? "on" : ""} onClick={() => setInvite(v => ({ ...v, role: "editor" }))}>Editor</button>
                <button className={invite.role === "viewer" ? "on" : ""} onClick={() => setInvite(v => ({ ...v, role: "viewer" }))}>Viewer</button>
                <button className={invite.role === "owner" ? "on" : ""} onClick={() => setInvite(v => ({ ...v, role: "owner" }))}>Owner</button>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 6 }}>Editors can add people, sign off, and edit descriptions. Viewers can only look. Owners can do everything.</div>
            </div>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} disabled={!invite.email.trim()} onClick={() => { patchProject(proj.id, { invited: true, invitedAs: invite.role, invitedEmail: invite.email.trim() }); setInvite(null); }}><Send size={15} />Send invite</button>
            <div className="login-foot" style={{ marginTop: 10 }}>They'll get an invite in their Inbox and a highlighted "Invited!" tag on the project until they open it. Real invites send by email once accounts are on — for now this previews how it looks.</div>
          </div>
        </div>
      )}
      <div className="head">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-sm" onClick={() => { setOpenId(null); setEdit(null); }}><ChevronLeft size={15} />Projects</button>
          <div>
            <div className="h-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>{proj.name}
              {behind && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "rgba(224,58,62,.16)", border: "1px solid #E03A3E55", borderRadius: 99, padding: "3px 9px" }}><Flame size={11} style={{ verticalAlign: "-1px" }} /> behind</span>}
            </div>
            <div className="h-sub">{proj.due ? <span style={{ color: (rem.past || rem.soon) ? "var(--primary)" : "var(--muted)", fontWeight: 600 }}>{rem.past ? `Overdue by ${rem.txt}` : `${rem.txt} left`} · due {fmtDue(proj.due)}</span> : "No due date set"}</div>
            {(() => {
              const N = sched.length;
              const done = sched.filter(g => g.complete);
              const late = sched.filter(g => !g.complete && g.behind);
              const remain = sched.filter(g => !g.complete && !g.behind);
              const pct = N ? Math.round(done.length / N * 100) : 0;
              const ends = sched.map(g => g.adjEnd).filter(Boolean);
              const newEnd = ends.length ? ends.reduce((a, b) => b > a ? b : a) : proj.due;
              const isLate = proj.due && newEnd && newEnd > proj.due;
              const w = (arr) => N ? (arr.length / N * 100) : 0;
              const names = (arr) => arr.map(g => g.name);
              const daysLate = isLate ? dayDiff(proj.due, newEnd) : 0;
              const seg = (title, color, arr) => ({
                onMouseEnter: (e) => setBarTip({ x: e.clientX, y: e.currentTarget.getBoundingClientRect().top, title: `${title} (${arr.length})`, color, items: names(arr) }),
                onMouseMove: (e) => setBarTip(t => t ? { ...t, x: e.clientX } : t),
                onMouseLeave: () => setBarTip(null),
              });
              return (
                <div style={{ marginTop: 8, maxWidth: 380 }}>
                  <div style={{ display: "flex", height: 9, background: "var(--raise)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)" }}>
                    {done.length > 0 && <div {...seg("Completed", "var(--done)", done)} style={{ width: w(done) + "%", background: "var(--done)", cursor: "default" }} />}
                    {remain.length > 0 && <div {...seg("Still to do", "var(--muted)", remain)} style={{ width: w(remain) + "%", background: "var(--line2)", cursor: "default" }} />}
                    {late.length > 0 && <div {...seg("Behind — holding things up", "var(--primary)", late)} style={{ width: w(late) + "%", background: "var(--primary)", cursor: "default" }} />}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
                    <span style={{ fontWeight: 700 }}>{done.length}/{N} groups · {pct}%</span>
                    {N === 0 ? null : isLate
                      ? <span style={{ color: "var(--primary)", fontWeight: 700 }}>expected {fmtDue(newEnd)} · {daysLate}d late</span>
                      : <span>expected {fmtDue(newEnd)}</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {canOpen && proj.codeCadence !== "off" && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--teal)", background: "rgba(79,168,232,.14)", border: "1px solid #4FA8E855", borderRadius: 8, padding: "4px 9px", letterSpacing: "1px" }} title="Viewer invite code — teammates can join with this">#{viewerCodeOf(proj)}</span>}
              <span style={{ fontSize: 12, fontWeight: 700, color: ROLE_C[role], background: ROLE_C[role] + "22", border: `1px solid ${ROLE_C[role]}55`, borderRadius: 99, padding: "5px 12px", textTransform: "capitalize" }}>You're {role}</span>
              {/* demo presence: your avatar, hover for everyone */}
              <div className="pres dotwrap" style={{ position: "relative" }} onMouseEnter={() => setPresOpen(true)} onMouseLeave={() => setPresOpen(false)}>
                <div style={{ position: "relative", cursor: "default" }}>
                  <UserAv u={user} size={32} />
                  <span className="sdot" style={{ background: (user.presence === "offline") ? "#E03A3E" : "#33B36B" }} />
                </div>
                {presOpen && (
                  <div className="pres-menu">
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: ".5px", padding: "4px 9px 6px" }}>On this project · demo</div>
                    <div className="pres-row"><div className="dotwrap" style={{ position: "relative" }}><UserAv u={user} size={26} /><span className="sdot" style={{ background: (user.presence === "offline") ? "#E03A3E" : "#33B36B" }} /></div><span style={{ flex: 1 }}>{user.name} (you)</span></div>
                    {projMembers.map((m, i) => { const st = ["#33B36B", "#E8A53C", "#E03A3E"][i % 3]; return (
                      <div className="pres-row" key={m.id}><div className="dotwrap" style={{ position: "relative" }}><MemberAv m={{ ...m, done: false }} size={26} /><span className="sdot" style={{ background: st }} /></div><span style={{ flex: 1 }}>{m.name}</span></div>
                    ); })}
                    <div style={{ fontSize: 10, color: "var(--dim)", padding: "6px 9px 2px", display: "flex", gap: 10 }}><span>🟢 online</span><span>🟡 idle</span><span>🔴 off</span></div>
                  </div>
                )}
              </div>
            </div>
            <select className="btn btn-sm" value={role} onChange={e => setRole(e.target.value)} title="Demo: view as a different role">
              <option value="owner">view as Owner</option><option value="editor">view as Editor</option><option value="viewer">view as Viewer</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <select className="btn" value={zoom} onChange={e => setZoom(e.target.value)} title="Time range">
          <option value="week">Range: Week</option><option value="month">Range: Month</option><option value="year">Range: Year</option>
        </select>
        {zoom === "year" && yearsInRange.length > 1 && (
          <select className="btn btn-sm" defaultValue="all" onChange={e => jumpYear(e.target.value)} title="Jump to a year">
            <option value="all">Show all</option>
            {yearsInRange.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        <select className="btn" value={whoFilter} onChange={e => setWhoFilter(e.target.value)} title="Who's on this project">
          <option value="all">Everyone on this project</option>
          {projMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button className="btn" onClick={scrollToToday} title="Jump to today"><CalendarDays size={14} />Today</button>
        <button className="btn" onClick={exportGantt} title="Save this Gantt chart as a file"><Download size={14} />Export</button>
        {canOpen && (
          <div style={{ position: "relative" }}>
            <button className="btn" onClick={() => { setCascPick(null); setCascOpen(o => !o); }} title="What happens when a group runs late">
              <Flame size={14} color={proj.cascade === true ? "var(--primary)" : "var(--dim)"} />Late-push: {proj.cascade === true ? "On" : "Off"}<ChevronDown size={13} />
            </button>
            {cascOpen && (() => {
              const ruled = proj.groups.filter(g => g.affects !== undefined);
              const pickG = cascPick ? proj.groups.find(g => g.id === cascPick) : null;
              const nm = (id) => proj.groups.find(g => g.id === id)?.name || "?";
              return (
                <div style={{ position: "absolute", top: 42, left: 0, zIndex: 40, width: 290, background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 14, padding: 12, boxShadow: "0 20px 50px rgba(0,0,0,.5)" }}>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4, marginBottom: 10 }}>When a group runs late, later groups get pushed back the same number of days (shown as a dotted "original plan").</div>
                  <label className="btn" style={{ width: "100%", justifyContent: "space-between", cursor: isOwner ? "pointer" : "default" }} onClick={() => isOwner && patchProject(proj.id, { cascade: !(proj.cascade === true) })}>
                    <span>Auto-push late groups</span>
                    <span className="rcp-box" style={{ width: 18, height: 18, ...(proj.cascade === true ? { background: "var(--primary)", borderColor: "var(--primary)" } : {}) }}>{proj.cascade === true && <Check size={12} />}</span>
                  </label>

                  {proj.cascade === true && isOwner && !pickG && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", margin: "13px 0 6px" }}>Set what each group pushes</div>
                      <div style={{ fontSize: 10.5, color: "var(--dim)", marginBottom: 6 }}>Click a group to choose which others it pushes when it's late. Default = pushes all later groups.</div>
                      <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 6 }}>
                        {proj.groups.length === 0 && <div className="empty-sm" style={{ padding: "6px 0" }}>No groups yet.</div>}
                        {proj.groups.map(g => { const custom = g.affects !== undefined; return (
                          <div key={g.id} onClick={() => { setCascPick(g.id); setCascSel(g.affects || []); }} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 6px", cursor: "pointer", borderRadius: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color || proj.color }} />
                            <span style={{ flex: 1, fontSize: 13 }}>{g.name}</span>
                            <span style={{ fontSize: 10.5, color: custom ? "var(--teal)" : "var(--dim)", fontWeight: custom ? 700 : 500 }}>{custom ? (g.affects.length ? `pushes ${g.affects.length}` : "pushes none") : "pushes all"}</span>
                            <ChevronRight size={13} color="var(--dim)" />
                          </div>
                        ); })}
                      </div>
                      {ruled.length > 0 && (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", margin: "13px 0 6px" }}>Saved rules</div>
                          {ruled.map(g => (
                            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 12 }}>
                              <span onClick={() => { setCascPick(g.id); setCascSel(g.affects || []); }} style={{ flex: 1, cursor: "pointer", fontWeight: 600, color: "var(--teal)" }}>{g.name}</span>
                              <span style={{ color: "var(--dim)", fontSize: 11 }}>{g.affects.length ? `→ ${g.affects.map(nm).join(", ")}` : "→ pushes none"}</span>
                              <button className="btn btn-ghost icon-btn" style={{ width: 22, height: 22 }} title="Remove rule" onClick={() => patchGroup(proj.id, g.id, gr => { const { affects, ...rest } = gr; return rest; })}><X size={12} /></button>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}

                  {proj.cascade === true && isOwner && pickG && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "13px 0 6px" }}>
                        <button className="btn btn-ghost icon-btn" style={{ width: 24, height: 24 }} onClick={() => setCascPick(null)}><ChevronLeft size={14} /></button>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>When <span style={{ color: "var(--teal)" }}>{pickG.name}</span> is late, push:</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--dim)", marginBottom: 6 }}>Pick groups, or save with none = it won't move anyone.</div>
                      <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 6 }}>
                        {proj.groups.filter(g => g.id !== pickG.id).map(g => { const on = cascSel.includes(g.id); return (
                          <div key={g.id} onClick={() => setCascSel(s => on ? s.filter(x => x !== g.id) : [...s, g.id])} style={{ display: "flex", alignItems: "center", gap: 9, padding: 6, cursor: "pointer", borderRadius: 8, background: on ? "var(--raise)" : "transparent" }}>
                            <span className="rcp-box" style={{ width: 16, height: 16, ...(on ? { background: "var(--teal)", borderColor: "var(--teal)" } : {}) }}>{on && <Check size={11} />}</span>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color || proj.color }} />
                            <span style={{ fontSize: 13 }}>{g.name}</span>
                          </div>
                        ); })}
                        {proj.groups.length <= 1 && <div className="empty-sm" style={{ padding: "6px 0" }}>No other groups.</div>}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button className="btn btn-pri btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => { patchGroup(proj.id, pickG.id, gr => ({ ...gr, affects: cascSel })); setCascPick(null); }}><Check size={14} />Save</button>
                        <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => { patchGroup(proj.id, pickG.id, gr => { const { affects, ...rest } = gr; return rest; }); setCascPick(null); }}>Use default (all)</button>
                      </div>
                    </>
                  )}
                  {!isOwner && <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 8 }}>Only the owner can change this.</div>}
                </div>
              );
            })()}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={undo} disabled={!canUndo} style={{ opacity: canUndo ? 1 : .4, cursor: canUndo ? "pointer" : "default" }}><RotateCcw size={14} />Undo</button>
        {isOwner && <button className="btn" onClick={() => setInvite({ email: "", role: "editor" })}><Plus size={14} />Invite</button>}
      </div>
      {whoFilter !== "all" && (
        <div className="foot-note" style={{ justifyContent: "flex-start", marginBottom: 10 }}>
          Showing only {projMembers.find(m => m.id === whoFilter)?.name || ""}'s groups.
          <button className="btn btn-ghost btn-sm" onClick={() => setWhoFilter("all")} style={{ marginLeft: 8 }}>show all</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div className="gantt-wrap" style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <button className="navarrow" onClick={() => scrollChart(-1)} style={{ left: LBL + 22 }} title="Back"><ChevronLeft size={18} /></button>
          <button className="navarrow" onClick={() => scrollChart(1)} style={{ right: 6 }} title="Forward"><ChevronRight size={18} /></button>
          <div className="gantt-scroll nobar" ref={scrollRef} onScroll={syncScroll} style={{ maxHeight: "62vh", overflow: "auto" }}>
            <div className="gantt-grid" style={{ minWidth: LBL + totalDays * Z.colw }}>
              <div style={{ position: "sticky", top: 0, zIndex: 7, background: "var(--panel)" }}>
                <GanttAxis rangeStart={rangeStart} totalDays={totalDays} ppd={Z.colw} zoom={zoom} today={today} LBL={LBL} />
              </div>
              <div style={{ position: "relative", minHeight: trackH }}>
                {/* horizontal row grid (behind) */}
                <div style={{ position: "absolute", left: LBL, top: 0, bottom: 0, width: totalDays * Z.colw, zIndex: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px ${ROWH}px)`, opacity: .35 }} />
                {/* vertical day grid (above bars so it's continuous) */}
                <div style={{ position: "absolute", left: LBL, top: 0, bottom: 0, width: totalDays * Z.colw, zIndex: 3, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(to right, var(--line) 0 1px, transparent 1px ${(zoom === "week" ? 1 : zoom === "month" ? 7 : 30) * Z.colw}px)`, opacity: .28 }} />
                {todayIdx >= 0 && todayIdx < totalDays && (
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: LBL + todayIdx * Z.colw + Z.colw / 2, width: 2, background: "var(--teal)", zIndex: 4 }}>
                    <span style={{ position: "absolute", top: -1, left: 4, fontSize: 9, fontWeight: 800, color: "var(--teal)", background: "var(--panel)", padding: "0 4px", borderRadius: 4, whiteSpace: "nowrap" }}>today</span>
                  </div>
                )}
                {/* project due line (red) */}
                {dueIdx >= 0 && dueIdx < totalDays && (
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: LBL + dueIdx * Z.colw + Z.colw / 2, width: 0, borderLeft: "2px dashed var(--primary)", zIndex: 4 }}>
                    <span style={{ position: "absolute", top: -16, left: 4, fontSize: 9.5, fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap" }}>due</span>
                  </div>
                )}
                {sched.map(g => {
                  const gColor = g.color || proj.color;
                  const r = g.adjStart && g.adjEnd ? { s: g.adjStart < g.adjEnd ? g.adjStart : g.adjEnd, e: g.adjEnd > g.adjStart ? g.adjEnd : g.adjStart } : null;
                  const startIdx = r ? dayDiff(rangeStart, r.s) : 0;
                  const span = r ? dayDiff(r.s, r.e) + 1 : 0;
                  const vis = r && startIdx + span > 0 && startIdx < totalDays;
                  let ghost = null;
                  if (g.slipped && g.start && g.end) { const gs = dayDiff(rangeStart, g.start); ghost = { l: gs, w: dayDiff(g.start, g.end) + 1 }; }
                  const doneCount = g.members.filter(m => m.done).length;
                  const wide = span * Z.colw;
                  const tip = `${g.name}${g.desc ? " — " + g.desc : ""}\n${fmtDue(r ? r.s : g.start)}–${fmtDue(r ? r.e : g.end)} · ${doneCount}/${g.members.length} signed off`;
                  return (
                    <div className="gantt-row" key={g.id}>
                      <div className="gantt-lbl" style={{ width: LBL, flexBasis: LBL }} title={tip}>{g.name}</div>
                      <div className="gantt-track">
                        {ghost && <div style={{ position: "absolute", top: 13, left: ghost.l * Z.colw, width: Math.max(2, ghost.w * Z.colw - 2), height: 20, borderRadius: 5, border: `1px dashed ${gColor}`, opacity: .5 }} />}
                        {vis && (
                          <div className={`gantt-bar ${g.complete ? "done" : ""}`} style={{ left: startIdx * Z.colw, width: Math.max(6, wide - 2), background: g.complete ? "var(--done)" : gColor, opacity: 1, gap: 4, cursor: isOwner ? "grab" : (canOpen ? "pointer" : "default") }}
                            onMouseDown={(e) => startDrag(e, g)}
                            onClick={() => { if (justDragged.current) return; if (canOpen) setEdit({ pid: proj.id, gid: g.id }); }}
                            onMouseEnter={(e) => { const rr = e.currentTarget.getBoundingClientRect(); openHover(g.id, { x: rr.left, y: rr.bottom }); }}
                            onMouseLeave={closeHover}>
                            {wide > 60 && g.members.slice(0, 3).map(m => <MemberAv key={m.id} m={m} size={16} />)}
                            {wide > 90 && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}{g.complete ? " ✓" : ""}</span>}
                            {(g.notes && g.notes.length > 0) && <span style={{ marginLeft: "auto", width: 9, height: 9, borderRadius: 99, background: "#fff", boxShadow: "0 0 0 2px rgba(0,0,0,.22)", flexShrink: 0 }} />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {Array.from({ length: emptyRows }).map((_, i) => (
                  <div className="gantt-row" key={"e" + i}>
                    <div className="gantt-lbl" style={{ width: LBL, flexBasis: LBL, color: "var(--dim)", fontWeight: 400 }}>{sched.length === 0 && i === 0 ? "— no groups yet —" : ""}</div>
                    <div className="gantt-track" style={{ borderTop: "1px dashed var(--line)", opacity: .35 }} />
                  </div>
                ))}
                {hoverGid && (() => {
                  const hg = proj.groups.find(x => x.id === hoverGid);
                  if (!hg) return null;
                  const notes = hg.notes || [];
                  const px = Math.max(8, Math.min(hoverPos.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 262));
                  return (
                    <div className="note-pop" style={{ position: "fixed", left: px, top: hoverPos.y + 6 }} onMouseEnter={() => openHover(hg.id)} onMouseLeave={closeHover}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h5 style={{ flex: 1, margin: 0 }}>{hg.name}</h5>
                        <button className="btn btn-ghost btn-sm" title="Email this group" style={{ flexShrink: 0 }} onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); ctx.openComposer(hg.members.map(m => m.id), { project: proj.name, group: hg.name }); }} disabled={hg.members.length === 0}><Mail size={13} />Email</button>
                      </div>
                      {hg.desc && <div className="desc">{hg.desc}</div>}
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: ".6px" }}>People</div>
                      {hg.members.length === 0 ? <div className="note-row" style={{ color: "var(--dim)", borderTop: "none" }}>No one assigned.</div> : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "6px 0 9px" }}>
                          {hg.members.map(m => (
                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5 }}>
                              <MemberAv m={m} size={20} />
                              <span style={{ color: m.done ? "var(--muted)" : "var(--ink)", textDecoration: m.done ? "line-through" : "none" }}>{m.name}</span>
                              <button className="btn btn-ghost icon-btn" title={`Email ${m.name}`} style={{ width: 22, height: 22, padding: 0, flexShrink: 0 }} onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); ctx.openComposer([m.id], { project: proj.name, group: hg.name }); }}><Mail size={12} /></button>
                              <span style={{ flex: 1 }} />
                              {m.done && <span style={{ fontSize: 10.5, color: "var(--done)", fontWeight: 700 }}>signed off</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: ".6px" }}>Notes</div>
                      {notes.length === 0 && <div className="note-row" style={{ color: "var(--dim)", borderTop: "none" }}>No notes yet.</div>}
                      {notes.map(n => editId === n.id ? (
                        <div className="note-row" key={n.id}>
                          <input style={{ flex: 1, fontFamily: "Outfit", fontSize: 12.5, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 8, padding: "5px 7px", background: "var(--bg)" }} value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === "Enter" && saveNote(proj.id, hg.id, n.id, editText)} autoFocus />
                          <button className="btn btn-sm" onClick={() => saveNote(proj.id, hg.id, n.id, editText)}><Check size={13} /></button>
                        </div>
                      ) : (
                        <div className="note-row" key={n.id}>
                          <div style={{ flex: 1 }}>{n.text}<div className="by">— {n.by}</div></div>
                          {canOpen && <button className="btn btn-ghost icon-btn" style={{ width: 24, height: 24 }} onClick={() => { setEditId(n.id); setEditText(n.text); }}><Pencil size={12} /></button>}
                          {canOpen && <button className="btn btn-ghost icon-btn" style={{ width: 24, height: 24 }} onClick={() => delNote(proj.id, hg.id, n.id)}><X size={12} /></button>}
                        </div>
                      ))}
                      {canOpen ? (
                        <>
                          <div className="note-add">
                            <input placeholder="Add a note…" value={noteDraft} onChange={e => setNoteDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote(proj.id, hg.id, noteDraft)} />
                            <button className="btn btn-pri btn-sm" onClick={() => addNote(proj.id, hg.id, noteDraft)}><Plus size={14} /></button>
                          </div>
                          <div className="by" style={{ marginTop: 6, color: "var(--muted)", fontSize: 10.5 }}>Posting as {user.name}</div>
                        </>
                      ) : <div className="by" style={{ marginTop: 6, color: "var(--muted)", fontSize: 10.5 }}>View only</div>}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          {sx.w > sx.c + 2 && (
            <div ref={trackRef} onMouseDown={startBarDrag} style={{ marginLeft: LBL, marginTop: 8, height: 9, background: "var(--raise)", borderRadius: 99, position: "relative", cursor: "pointer" }}>
              <div style={{ position: "absolute", top: 0, height: 9, borderRadius: 99, background: "var(--line2)", width: Math.max(8, sx.c / sx.w * 100) + "%", left: (sx.l / sx.w * 100) + "%", cursor: "grab" }} />
            </div>
          )}
          <div className="foot-note" style={{ marginTop: 12, justifyContent: "flex-start" }}><Sparkles size={12} /> Hover a bar for its description. Light-blue line = today, red dashed = project due. Bars turn green when everyone's signed off.</div>
          {isOwner && (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
              <button className="btn" onClick={() => setEdit({ pid: proj.id })}><Pencil size={14} />Project</button>
              <button className="btn btn-pri" onClick={() => addGroup(proj.id)}><Plus size={16} />Group</button>
            </div>
          )}
        </div>

        {editTarget && canOpen && (
          <div style={{ width: 310, flexShrink: 0, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 18, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Pencil size={15} color="var(--muted)" />{editTarget.g ? "Edit group" : "Edit project"}</div>
              <button className="btn btn-ghost icon-btn" onClick={() => setEdit(null)}><X size={16} /></button>
            </div>
            {!isOwner && <div className="foot-note" style={{ justifyContent: "flex-start", textAlign: "left", marginBottom: 12, color: "var(--amber)" }}><AlertCircle size={12} />As editor you can add people & edit descriptions. The rest is owner-only.</div>}
            {!editTarget.g ? (
              <>
                <div className="fld"><label>Project name</label><input disabled={!isOwner} value={editTarget.p.name} onChange={e => patchProject(editTarget.p.id, { name: e.target.value })} /></div>
                <div className="row2">
                  <div className="fld"><label>Start date</label><input type="date" disabled={!isOwner} value={editTarget.p.start || ""} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => patchProject(editTarget.p.id, { start: e.target.value })} /></div>
                  <div className="fld"><label>Due date</label><input type="date" disabled={!isOwner} value={editTarget.p.due || ""} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => patchProject(editTarget.p.id, { due: e.target.value })} /></div>
                </div>
                <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: -4, marginBottom: 10 }}>Start date is the earliest point on the chart — groups can't be dragged before it.</div>
                <div className="fld"><label>Color</label><div className="swatches" style={{ opacity: isOwner ? 1 : .4 }}>
                  {PALETTE.map(c => <span key={c} className={`swatch ${editTarget.p.color === c ? "on" : ""}`} style={{ background: c }} onClick={() => isOwner && patchProject(editTarget.p.id, { color: c })} />)}
                  {isOwner && <label className="swatch" title="Pick any color" style={{ display: "grid", placeItems: "center", background: "var(--raise)", border: "1px dashed var(--line2)", cursor: "pointer", position: "relative" }}>
                    <Plus size={13} color="var(--muted)" />
                    <input type="color" value={editTarget.p.color || "#4FA8E8"} onChange={e => patchProject(editTarget.p.id, { color: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                  </label>}
                </div></div>
                <div style={{ marginTop: 8, padding: 11, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 7 }}>Invite code</div>
                  {editTarget.p.codeCadence === "off" ? (
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Joining is off — no one can join with a code.</div>
                  ) : (
                    <>
                      <select className="btn btn-sm" style={{ width: "100%", marginBottom: 8 }} value={codeRole} onChange={e => setCodeRole(e.target.value)}>
                        <option value="viewer">Viewer code — join read-only</option>
                        <option value="editor">Editor code — can edit</option>
                      </select>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "Fraunces", fontSize: 22, fontWeight: 600, letterSpacing: "2px", color: "var(--teal)" }}>{(codeRole === "editor" ? editorCodeOf(editTarget.p) : viewerCodeOf(editTarget.p)) || "—"}</span>
                        {isOwner && <button className="btn btn-ghost icon-btn" title={`Regenerate ${codeRole} code`} onClick={() => regenCode(editTarget.p.id, codeRole)}><RefreshCw size={14} /></button>}
                      </div>
                    </>
                  )}
                  {isOwner && (
                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontSize: 11, color: "var(--dim)" }}>Auto-refresh code</label>
                      <select className="btn btn-sm" style={{ width: "100%", marginTop: 4 }} value={editTarget.p.codeCadence || "never"} onChange={e => patchProject(editTarget.p.id, { codeCadence: e.target.value })}>
                        <option value="week">Every week</option><option value="month">Every month</option><option value="year">Every year</option><option value="never">Never</option><option value="off">Off — no joining</option>
                      </select>
                    </div>
                  )}
                  <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 7 }}>Share a code with a teammate — they enter it in "Join with a code" on their device. Viewer code = read-only; editor code = can edit.</div>
                </div>
                <div className="foot-note" style={{ justifyContent: "flex-start", marginTop: 12 }}>Add or delete groups from the timeline (the <b style={{ color: "var(--ink)", margin: "0 3px" }}>+ Group</b> button). Delete the whole project from the project card.</div>
              </>
            ) : (
              <>
                <div className="fld"><label>Group name {!isOwner && "(owner only)"}</label><input disabled={!isOwner} value={editTarget.g.name} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, name: e.target.value }))} /></div>
                <div className="fld"><label>Description (shows on hover)</label><textarea value={editTarget.g.desc || ""} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, desc: e.target.value }))} placeholder="What this group is doing…" /></div>
                <div className="row2">
                  <div className="fld"><label>Start</label><input type="date" disabled={!isOwner} value={editTarget.g.start || ""} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, start: e.target.value }))} /></div>
                  <div className="fld"><label>End</label><input type="date" disabled={!isOwner} value={editTarget.g.end || ""} onKeyDown={e => e.preventDefault()} onMouseDown={e => { e.preventDefault(); try { e.currentTarget.showPicker && e.currentTarget.showPicker(); } catch (_) {} }} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, end: e.target.value }))} /></div>
                </div>
                {isOwner && <div className="fld"><label>Group color</label><div className="swatches">
                  {PALETTE.map(c => <span key={c} className={`swatch ${(editTarget.g.color || editTarget.p.color) === c ? "on" : ""}`} style={{ background: c }} onClick={() => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, color: c }))} />)}
                  <label className="swatch" title="Pick any color" style={{ display: "grid", placeItems: "center", background: "var(--raise)", border: "1px dashed var(--line2)", cursor: "pointer", position: "relative" }}>
                    <Plus size={13} color="var(--muted)" />
                    <input type="color" value={editTarget.g.color || editTarget.p.color || "#4FA8E8"} onChange={e => patchGroup(editTarget.p.id, editTarget.g.id, gr => ({ ...gr, color: e.target.value }))} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                  </label>
                </div></div>}
                {isOwner && (
                  <div style={{ marginTop: 4 }}>
                    <button className="btn" style={{ width: "100%", justifyContent: "space-between" }} onClick={() => { setAdjOpen(o => !o); setAdjDelta(0); setAdjMode("none"); setAdjSel([]); setMvStart(false); setMvEnd(true); }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Clock size={14} />Add / remove days</span>
                      <ChevronDown size={14} style={{ transform: adjOpen ? "rotate(180deg)" : "none", transition: ".15s" }} />
                    </button>
                    {adjOpen && (
                      <div style={{ marginTop: 8, padding: 11, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <button className="btn btn-ghost icon-btn" onClick={() => setAdjDelta(d => d - 1)}><Minus size={16} /></button>
                          <span style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600, minWidth: 92, textAlign: "center" }}>{adjDelta > 0 ? `+${adjDelta}` : adjDelta} {Math.abs(adjDelta) === 1 ? "day" : "days"}</span>
                          <button className="btn btn-ghost icon-btn" onClick={() => setAdjDelta(d => d + 1)}><Plus size={16} /></button>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <label className="btn btn-sm" style={{ flex: 1, justifyContent: "center", cursor: "pointer", gap: 7, ...(mvStart ? { borderColor: "var(--teal)", color: "var(--teal)" } : {}) }} onClick={() => setMvStart(v => !v)}>
                            <span className="rcp-box" style={{ width: 15, height: 15, ...(mvStart ? { background: "var(--teal)", borderColor: "var(--teal)" } : {}) }}>{mvStart && <Check size={10} />}</span>Move start
                          </label>
                          <label className="btn btn-sm" style={{ flex: 1, justifyContent: "center", cursor: "pointer", gap: 7, ...(mvEnd ? { borderColor: "var(--teal)", color: "var(--teal)" } : {}) }} onClick={() => setMvEnd(v => !v)}>
                            <span className="rcp-box" style={{ width: 15, height: 15, ...(mvEnd ? { background: "var(--teal)", borderColor: "var(--teal)" } : {}) }}>{mvEnd && <Check size={10} />}</span>Move end
                          </label>
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--dim)", marginTop: 6 }}>{mvStart && !mvEnd ? "Starts earlier/later, end stays — changes length." : !mvStart && mvEnd ? "End moves, start stays — changes length." : mvStart && mvEnd ? "Whole group slides, same length." : "Pick what the days move."}</div>
                        <div className="fld" style={{ marginTop: 10, marginBottom: 0 }}>
                          <label>Also shift other groups</label>
                          <select className="btn btn-sm" style={{ width: "100%" }} value={adjMode} onChange={e => setAdjMode(e.target.value)}>
                            <option value="none">Don't move others</option>
                            <option value="all">All other groups</option>
                            <option value="choose">Choose specific groups…</option>
                          </select>
                        </div>
                        {adjMode === "choose" && (
                          <div style={{ maxHeight: 138, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 6, marginTop: 8 }}>
                            {editTarget.p.groups.filter(g => g.id !== editTarget.g.id).map(g => { const on = adjSel.includes(g.id); return (
                              <div key={g.id} onClick={() => setAdjSel(s => on ? s.filter(x => x !== g.id) : [...s, g.id])} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px", cursor: "pointer", borderRadius: 8, background: on ? "var(--raise)" : "transparent" }}>
                                <span className="rcp-box" style={{ width: 16, height: 16, ...(on ? { background: "var(--teal)", borderColor: "var(--teal)" } : {}) }}>{on && <Check size={11} />}</span>
                                <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color || editTarget.p.color }} />
                                <span style={{ fontSize: 13 }}>{g.name}</span>
                              </div>
                            ); })}
                            {editTarget.p.groups.length <= 1 && <div className="empty-sm" style={{ padding: "6px 0" }}>No other groups.</div>}
                          </div>
                        )}
                        <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => applyAdjust(editTarget.p.id, editTarget.g.id)}><Check size={15} />Save</button>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", margin: "10px 0 8px" }}>Members & sign-off</div>
                {editTarget.g.members.length === 0 && <div className="empty-sm" style={{ padding: "6px 0" }}>No one assigned yet.</div>}
                {editTarget.g.members.map(m => (
                  <div key={m.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0" }}>
                      <span className="rcp-box" style={{ cursor: "pointer", ...(m.done ? { background: "var(--done)", borderColor: "var(--done)" } : {}) }} onClick={() => toggleMember(editTarget.p.id, editTarget.g.id, m.id)}>{m.done && <Check size={12} />}</span>
                      <span style={{ cursor: "pointer" }} onClick={() => setColorFor(colorFor === m.id ? null : m.id)} title="Change color"><MemberAv m={m} size={26} /></span>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, textDecoration: m.done ? "line-through" : "none", color: m.done ? "var(--muted)" : "var(--ink)" }}>{m.name}</span>
                      <button className="btn btn-ghost icon-btn" onClick={() => removeMember(editTarget.p.id, editTarget.g.id, m.id)}><X size={14} /></button>
                    </div>
                    {colorFor === m.id && (
                      <div className="swatches" style={{ padding: "4px 0 8px 35px" }}>{PALETTE.map(c => <span key={c} className={`swatch ${m.color === c ? "on" : ""}`} style={{ width: 22, height: 22, background: c }} onClick={() => { setMemberColor(editTarget.p.id, editTarget.g.id, m.id, c); setColorFor(null); }} />)}</div>
                    )}
                  </div>
                ))}
                <select className="btn" style={{ width: "100%", marginTop: 8 }} value="" onChange={e => { const person = team.find(t => t.id === e.target.value); if (person) addMember(editTarget.p.id, editTarget.g.id, person); }}>
                  <option value="">{team.length ? "+ Assign someone…" : "Add people in the Team tab first"}</option>
                  {team.filter(t => !editTarget.g.members.some(m => m.id === t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {isOwner && <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10, color: "#ff8a8c" }} onClick={() => delGroup(editTarget.p.id, editTarget.g.id)}><Trash2 size={14} />Delete group</button>}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- Board ---------------- */
/* ---------------- Notifications / Inbox ---------------- */
