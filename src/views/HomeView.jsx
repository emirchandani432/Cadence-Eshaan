// Home view — greeting, project summaries, deadlines, and quick stats.
import { useState } from "react";
import { CalendarDays, Users, LayoutGrid, Sparkles, CheckCircle2, Clock, GanttChartSquare, TrendingUp, Flame } from "lucide-react";
import { todayISO, addDays, fmtDue, remaining, ROLE_C, MemberAv } from "../helpers.jsx";
import { loadOpens } from "../storage.js";
import { buildNotifs } from "../notifs.js";

export function HomeView({ ctx }) {
  const { user, setView, gotoGantt } = ctx;
  const gd = ctx.gantt;
  const today = todayISO();
  const projects = gd.projects.filter(p => !p.deleted);
  const gComplete = (g) => g.members.length > 0 && g.members.every(m => m.done);
  const allTasks = [];
  projects.forEach(p => p.groups.forEach(g => allTasks.push({ g, p })));
  const projDone = (p) => !!p.done;
  const projOverdue = (p) => p.due && p.due < today && !p.done;
  const taskOverdue = ({ g }) => !gComplete(g) && g.end && g.end < today;

  const opens = loadOpens();
  const ranked = [...projects].sort((a, b) => (opens[b.id] || 0) - (opens[a.id] || 0));

  const [drill, setDrill] = useState(null);
  const [winMode, setWinMode] = useState("days");
  const [ppA, setPpA] = useState(() => ranked[0]?.id || "");
  const [ppB, setPpB] = useState(() => ranked[1]?.id || ranked[0]?.id || "");
  const [wlProj, setWlProj] = useState(() => ranked[0]?.id || "");

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const cards = [
    { key: "total", label: "Total", color: "var(--slate)", I: LayoutGrid, projList: projects, taskList: allTasks },
    { key: "inprogress", label: "In progress", color: "var(--amber)", I: Clock, projList: projects.filter(p => !projDone(p)), taskList: allTasks.filter(t => !gComplete(t.g)) },
    { key: "completed", label: "Completed", color: "var(--done)", I: CheckCircle2, projList: projects.filter(projDone), taskList: allTasks.filter(t => gComplete(t.g)) },
    { key: "overdue", label: "Overdue", color: "var(--primary)", I: Flame, projList: projects.filter(projOverdue), taskList: allTasks.filter(taskOverdue) },
  ];
  const activeCard = drill ? cards.find(c => c.key === drill.card) : null;

  if (projects.length === 0) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "54px 24px" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--panel2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Sparkles size={28} color="var(--primary)" /></div>
        <div className="h-title" style={{ fontSize: 23 }}>{greet}, {user.name.split(" ")[0]}.</div>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0 18px" }}>No projects yet — head to the Gantt chart to create your first one.</p>
        <button className="btn btn-pri" onClick={() => setView("gantt")}><GanttChartSquare size={16} />Open the Gantt</button>
      </div>
    );
  }

  const cut = winMode === "days" ? addDays(today, 7) : winMode === "month" ? addDays(today, 31) : addDays(today, 365);
  const upcoming = [];
  allTasks.forEach(({ g, p }) => { if (g.end && g.end >= today && g.end <= cut && !gComplete(g)) upcoming.push({ type: "task", date: g.end, name: g.name, sub: p.name, pid: p.id }); });
  projects.forEach(p => { if (p.due && p.due >= today && p.due <= cut && !p.done) upcoming.push({ type: "project", date: p.due, name: p.name, sub: "Project due", pid: p.id }); });
  upcoming.sort((a, b) => a.date.localeCompare(b.date));

  const progressOf = (p) => {
    if (!p) return { pct: 0, gd: 0, gt: 0 };
    let tot = 0, done = 0; p.groups.forEach(g => { tot += g.members.length; done += g.members.filter(m => m.done).length; });
    const gt = p.groups.length, gdone = p.groups.filter(gComplete).length;
    return { pct: tot ? Math.round(done / tot * 100) : 0, gd: gdone, gt };
  };

  const topProj = projects.find(p => p.id === wlProj) || ranked[0];
  const workMembers = (() => {
    if (!topProj) return [];
    const map = {};
    topProj.groups.forEach(g => g.members.forEach(m => { if (!map[m.id]) map[m.id] = { ...m, todo: 0 }; if (!m.done) map[m.id].todo += 1; }));
    return Object.values(map).sort((a, b) => b.todo - a.todo);
  })();

  const ProjRow = ({ p }) => { const r = remaining(p.due, Date.now()); return (
    <div className="row-i" onClick={() => gotoGantt(p.id)}>
      <span className="row-dot" style={{ background: p.color }} />
      <span className="row-t">{p.name}{p.done ? " ✓" : ""}</span>
      <span className="row-meta">
        <span className="chip" style={{ background: ROLE_C[p.myRole] + "22", color: ROLE_C[p.myRole], textTransform: "capitalize" }}>{p.myRole}</span>
        {p.due && <span className={`chip chip-due ${(r && (r.past || r.soon) && !p.done) ? "over" : ""}`}>{fmtDue(p.due)}</span>}
      </span>
    </div>
  ); };
  const TaskRow = ({ t }) => { const c = gComplete(t.g); const over = !c && t.g.end && t.g.end < today; return (
    <div className="row-i" onClick={() => gotoGantt(t.p.id)}>
      <span className="row-dot" style={{ background: t.g.color || t.p.color }} />
      <span className="row-t">{t.g.name}{c ? " ✓" : ""}</span>
      <span className="row-meta">
        <span className="chip chip-proj">{t.p.name}</span>
        {t.g.end && <span className={`chip chip-due ${over ? "over" : ""}`}>{fmtDue(t.g.end)}</span>}
      </span>
    </div>
  ); };

  return (
    <>
      <div className="head">
        <div>
          <div className="h-title">{greet}, {user.name.split(" ")[0]}.</div>
          <div className="h-sub">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · here's where things stand.</div>
        </div>
      </div>

      <div className="stats">
        {cards.map(c => (
          <div className="stat" key={c.key} style={{ padding: 0, overflow: "hidden", display: "block" }}>
            <div onClick={() => setDrill(drill && drill.card === c.key && drill.kind === "project" ? null : { card: c.key, kind: "project" })}
              style={{ padding: "13px 14px 10px", cursor: "pointer", background: drill && drill.card === c.key && drill.kind === "project" ? "var(--raise)" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="si" style={{ background: c.color + "22", width: 30, height: 30 }}><c.I size={16} color={c.color} /></span><span className="sl" style={{ margin: 0 }}>{c.label}</span></div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 6 }}><span className="sv" style={{ color: c.color, fontSize: 26 }}>{c.projList.length}</span><span className="sl" style={{ margin: 0 }}>projects</span></div>
            </div>
            <div onClick={() => setDrill(drill && drill.card === c.key && drill.kind === "task" ? null : { card: c.key, kind: "task" })}
              style={{ padding: "9px 14px 12px", cursor: "pointer", borderTop: "1px solid var(--line)", background: drill && drill.card === c.key && drill.kind === "task" ? "var(--raise)" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}><span className="sv" style={{ color: "var(--ink)", fontSize: 21 }}>{c.taskList.length}</span><span className="sl" style={{ margin: 0 }}>tasks</span></div>
            </div>
          </div>
        ))}
      </div>

      {drill && activeCard && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-h">
            <span className="pic" style={{ background: activeCard.color + "22" }}><activeCard.I size={16} color={activeCard.color} /></span>
            {activeCard.label} · {drill.kind === "project" ? "projects" : "tasks"}
            <span className="more" style={{ cursor: "pointer" }} onClick={() => setDrill(null)}>close ✕</span>
          </div>
          {drill.kind === "project"
            ? (activeCard.projList.length === 0 ? <div className="empty-sm">Nothing here.</div> : activeCard.projList.map(p => <ProjRow key={p.id} p={p} />))
            : (activeCard.taskList.length === 0 ? <div className="empty-sm">Nothing here.</div> : activeCard.taskList.map(t => <TaskRow key={t.g.id} t={t} />))}
          <div className="foot-note" style={{ justifyContent: "flex-start", marginTop: 8 }}><Sparkles size={12} />Click any row to open it in the Gantt.</div>
        </div>
      )}

      <div className="grid-2">
        <div className="panel">
          <div className="panel-h">
            <span className="pic" style={{ background: "rgba(255,107,69,.16)" }}><CalendarDays size={16} color="var(--primary)" /></span>Coming up
            <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {[["days", "7 days"], ["month", "Month"], ["year", "Year"]].map(([m, lbl]) => (
                <button key={m} className="btn btn-sm" onClick={() => setWinMode(m)} style={{ padding: "4px 9px", ...(winMode === m ? { background: "var(--teal)", borderColor: "var(--teal)", color: "#fff" } : {}) }}>{lbl}</button>
              ))}
            </span>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--muted)", margin: "0 0 8px 2px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--teal)" }} />task</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--primary)" }} />project</span>
          </div>
          {upcoming.length === 0 ? <div className="empty-sm">Nothing due in this window. 🎉</div> :
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {upcoming.map((u, i) => (
                <div className="row-i" key={i} onClick={() => gotoGantt(u.pid)}>
                  <span className="row-dot" style={{ background: u.type === "task" ? "var(--teal)" : "var(--primary)" }} />
                  <span className="row-t">{u.name}</span>
                  <span className="row-meta"><span className="chip chip-proj">{u.sub}</span><span className="chip chip-due">{fmtDue(u.date)}</span></span>
                </div>
              ))}
            </div>}
        </div>

        <div className="panel">
          <div className="panel-h"><span className="pic" style={{ background: "rgba(52,203,166,.16)" }}><TrendingUp size={16} color="var(--teal)" /></span>Project progress</div>
          {[[ppA, setPpA], [ppB, setPpB]].map(([val, setVal], idx) => {
            const p = projects.find(x => x.id === val); const pr = progressOf(p);
            return (
              <div key={idx} style={{ marginBottom: 14 }}>
                <select className="btn btn-sm" style={{ width: "100%", marginBottom: 7 }} value={val} onChange={e => setVal(e.target.value)}>
                  <option value="">Pick a project…</option>
                  {projects.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                {p && (
                  <div className="prog-row">
                    <div className="prog-top"><span className="row-dot" style={{ background: p.color }} />{p.name}<span className="pct">{pr.pct}% · {pr.gd}/{pr.gt} groups</span></div>
                    <div className="bar-mini"><i style={{ width: pr.pct + "%", background: p.color }} /></div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="foot-note" style={{ justifyContent: "flex-start" }}><Sparkles size={12} />Auto-set to your most-opened projects. Pick any two.</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-h"><span className="pic" style={{ background: "rgba(91,141,239,.16)" }}><Users size={16} color="#5B8DEF" /></span>Team workload
          <select className="btn btn-sm" style={{ marginLeft: "auto" }} value={topProj ? topProj.id : ""} onChange={e => setWlProj(e.target.value)}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {!topProj || workMembers.length === 0 ? <div className="empty-sm">No one assigned in your top project yet.</div> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
            {workMembers.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 12 }}>
                <MemberAv m={{ ...m, done: false }} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{m.todo} to finish</div>
                </div>
                <span style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600, color: m.todo ? "var(--ink)" : "var(--dim)" }}>{m.todo}</span>
              </div>
            ))}
          </div>}
      </div>
    </>
  );
}

/* ---------------- Gantt (project picker -> timeline -> sign-off) ---------------- */
