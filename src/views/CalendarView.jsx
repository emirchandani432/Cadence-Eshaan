// Calendar view — month grid of project/group due dates + per-day notes.
import { useState, useEffect } from "react";
import { Check, Trash2, X, ChevronLeft, ChevronRight, Sun } from "lucide-react";
import { todayISO } from "../helpers.jsx";
import { loadCalNotes, saveCalNotes } from "../storage.js";

export function CalendarView({ ctx }) {
  const gd = ctx.gantt;
  const gotoGantt = ctx.gotoGantt;
  const gComplete = (g) => g.members.length > 0 && g.members.every(m => m.done);
  const [cur, setCur] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [notes, setNotes] = useState(loadCalNotes);
  useEffect(() => { saveCalNotes(notes); }, [notes]);
  const [dayOpen, setDayOpen] = useState(null);

  const first = new Date(cur.y, cur.m, 1);
  const startDow = first.getDay();
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const today = todayISO();
  const monthName = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const byDay = {};
  const add = (iso, ev) => { if (!iso) return; (byDay[iso] = byDay[iso] || []).push(ev); };
  gd.projects.filter(p => !p.deleted).forEach(p => {
    add(p.due, { type: "project", label: p.name, color: "var(--primary)", pid: p.id, done: !!p.done });
    p.groups.forEach(g => add(g.end, { type: "task", label: g.name, color: "var(--teal)", pid: p.id, done: gComplete(g) }));
  });

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const SIZE = { S: 10.5, M: 12.5, L: 15 };
  const setNote = (iso, patch) => setNotes(n => ({ ...n, [iso]: { text: "", size: "M", ...(n[iso] || {}), ...patch } }));
  const delNote = (iso) => setNotes(n => { const c = { ...n }; delete c[iso]; return c; });

  return (
    <>
      <div className="head"><div><div className="h-title">Calendar</div><div className="h-sub">Project & task due dates, by day. Click a day to leave a note.</div></div>
        <div style={{ display: "flex", gap: 12, fontSize: 11.5, color: "var(--muted)", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--primary)" }} />project due</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--teal)" }} />task due</span>
        </div>
      </div>
      <div className="panel">
        <div className="cal-head">
          <div className="cal-m">{monthName}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn icon-btn" onClick={() => setCur(c => { const m = c.m - 1; return m < 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m }; })}><ChevronLeft size={17} /></button>
            <button className="btn btn-sm" onClick={() => { const d = new Date(); setCur({ y: d.getFullYear(), m: d.getMonth() }); }}>Today</button>
            <button className="btn icon-btn" onClick={() => setCur(c => { const m = c.m + 1; return m > 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m }; })}><ChevronRight size={17} /></button>
          </div>
        </div>
        <div className="cal-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div className="cal-dow" key={d}>{d}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div className="cal-cell blank" key={"b" + i} />;
            const iso = `${cur.y}-${String(cur.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const evs = byDay[iso] || [];
            const note = notes[iso];
            return (
              <div className={`cal-cell ${iso === today ? "today" : ""}`} key={iso} onClick={() => setDayOpen(iso)} style={{ cursor: "pointer" }}>
                <div className="cal-num">{d}</div>
                {evs.slice(0, 3).map((ev, j) => (
                  <div className={`cal-ev ${ev.done ? "done" : ""}`} key={j} style={{ background: ev.color }} title={`Open ${ev.label} in Gantt`}
                    onClick={(e) => { e.stopPropagation(); gotoGantt(ev.pid); }}>{ev.label}</div>
                ))}
                {evs.length > 3 && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>+{evs.length - 3} more</div>}
                {note && note.text && <div style={{ marginTop: 3, background: "rgba(232,165,60,.16)", border: "1px solid rgba(232,165,60,.3)", borderRadius: 6, padding: "3px 5px", fontSize: SIZE[note.size] || 12.5, color: "var(--ink)", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{note.text}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {dayOpen && (() => {
        const note = notes[dayOpen] || { text: "", size: "M" };
        const dateLabel = new Date(dayOpen + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
        const evs = byDay[dayOpen] || [];
        return (
          <div className="ov" onClick={() => setDayOpen(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-h"><h2>{dateLabel}</h2><button className="btn btn-ghost icon-btn" onClick={() => setDayOpen(null)}><X size={18} /></button></div>
              {evs.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Due this day</div>
                  {evs.map((ev, j) => (
                    <div key={j} className="row-i" style={{ padding: "6px 4px" }} onClick={() => { gotoGantt(ev.pid); setDayOpen(null); }}>
                      <span style={{ width: 9, height: 9, borderRadius: 99, background: ev.color }} />
                      <span style={{ flex: 1, fontSize: 13.5, textDecoration: ev.done ? "line-through" : "none", color: ev.done ? "var(--muted)" : "var(--ink)" }}>{ev.label} <span style={{ fontSize: 11, color: "var(--dim)" }}>· {ev.type}</span></span>
                      <ChevronRight size={15} color="var(--dim)" />
                    </div>
                  ))}
                </div>
              )}
              <div className="fld">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ marginBottom: 0 }}>Note</label>
                  <div className="mode-pick" style={{ gap: 2 }}>
                    {["S", "M", "L"].map(s => <button key={s} className={(note.size || "M") === s ? "on" : ""} onClick={() => setNote(dayOpen, { size: s })}>{s}</button>)}
                  </div>
                </div>
                <textarea value={note.text} onChange={e => setNote(dayOpen, { text: e.target.value })} placeholder="Write a quick note for this day…" style={{ fontSize: SIZE[note.size] || 12.5, minHeight: 90, resize: "vertical" }} autoFocus />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-pri" style={{ flex: 1, justifyContent: "center" }} onClick={() => setDayOpen(null)}><Check size={15} />Done</button>
                {notes[dayOpen] && <button className="btn" onClick={() => { delNote(dayOpen); setDayOpen(null); }}><Trash2 size={15} />Delete note</button>}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

/* ---------------- Task modal ---------------- */
