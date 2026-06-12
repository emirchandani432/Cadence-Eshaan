import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus, CalendarDays, Users, LayoutGrid, Mail, Check, Trash2, Pencil,
  Download, Upload, X, ChevronLeft, ChevronRight, Search, Sparkles,
  CheckCircle2, Circle, Clock, FolderOpen, AlertCircle, LogOut, Send, ShieldCheck,
  LayoutDashboard, GanttChartSquare, ChevronDown, ChevronUp, Settings, TrendingUp, Flame, Sun, Moon, Monitor, RefreshCw, Minus, RotateCcw, Bell, MessageSquare, Table
} from "lucide-react";
import { SEED_DATA } from "./seedData.js";
import { SEED_TRACKER, EMAIL_DIR } from "./trackerData.js";
import { apiLoad, apiSave } from "./trackerApi.js";
import { ganttLoad, ganttSave } from "./ganttApi.js";
import { LoginScreen } from "./components/LoginScreen.jsx";
import { EmailComposerModal, TaskModal, PersonModal, ProjectModal, ProfileModal, TeamEmailModal } from "./components/modals.jsx";
import { CalendarView } from "./views/CalendarView.jsx";
import { TrackerView } from "./views/TrackerView.jsx";
import { TeamView } from "./views/TeamView.jsx";
import { buildNotifs } from "./notifs.js";
import { NotificationsView } from "./views/InboxView.jsx";
import { GanttView } from "./views/GanttView.jsx";
import { css } from "./styles.js";
import { PALETTE, uid, todayISO, initials, addDays, dayDiff, fmtDue, isOverdue, COLUMNS, PRIO, download, csvCell, remaining, ROLE_C, genCode, genCodes, viewerCodeOf, editorCodeOf, publishableProject, codeRoleFor, UserAv, Confetti, MemberAv, BG_PRESETS, gSample } from "./helpers.jsx";
import { loadData, saveData, loadUser, saveUser, loadGantt, saveGantt, loadOpens, bumpOpen, loadContacts, saveContacts, loadNotif, saveNotif, loadCalNotes, saveCalNotes, SHEETS_KEY } from "./storage.js";

/* ================================================================ *
 *  Cadence — dark team dashboard
 *  Home · Gantt · Board · Calendar · Team
 * ================================================================ */


const NAV = [
  { id: "home", label: "Home", Icon: LayoutDashboard },
  { id: "tracker", label: "Tracker", Icon: Table },
  { id: "gantt", label: "Gantt", Icon: GanttChartSquare },
  { id: "alerts", label: "Inbox", Icon: Bell },
  { id: "calendar", label: "Calendar", Icon: CalendarDays },
  { id: "team", label: "Team", Icon: Users },
];

/* ---------- storage (browser localStorage) ---------- */


const SAMPLE = {
  people: [
    { id: "p1", name: "Maya Chen", role: "Designer", email: "maya@rtmec.com", color: PALETTE[1] },
    { id: "p2", name: "Devon Brooks", role: "Developer", email: "devon@rtmec.com", color: PALETTE[3] },
    { id: "p3", name: "Sara Lopez", role: "Project Lead", email: "sara@rtmec.com", color: PALETTE[4] },
  ],
  projects: [
    { id: "j1", name: "Website Refresh", color: PALETTE[0] },
    { id: "j2", name: "Q3 Launch", color: PALETTE[2] },
  ],
  tasks: [
    { id: uid(), title: "Draft new homepage layout", notes: "Hero + 3 sections", projectId: "j1", assigneeId: "p1", status: "doing", start: addDays(todayISO(), -2), due: addDays(todayISO(), 3), priority: "high", createdAt: Date.now() },
    { id: uid(), title: "Set up staging server", notes: "", projectId: "j1", assigneeId: "p2", status: "todo", start: addDays(todayISO(), 1), due: addDays(todayISO(), 6), priority: "med", createdAt: Date.now() },
    { id: uid(), title: "Approve final copy", notes: "Waiting on legal", projectId: "j2", assigneeId: "p3", status: "todo", start: addDays(todayISO(), 4), due: addDays(todayISO(), 9), priority: "low", createdAt: Date.now() },
    { id: uid(), title: "Kickoff meeting notes", notes: "", projectId: "j2", assigneeId: "p3", status: "done", start: addDays(todayISO(), -6), due: addDays(todayISO(), -4), priority: "med", createdAt: Date.now() },
  ],
};

export default function App() {
  const [data, setData] = useState({ people: [], projects: [], tasks: [] });
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("cadence:theme") || "dark"; } catch (e) { return "dark"; } });
  const effLight = theme === "light";
  const rootCls = "cad" + (theme !== "dark" ? " " + theme : "");
  const cycleTheme = () => setTheme(t => { const n = t === "dark" ? "twilight" : t === "twilight" ? "light" : "dark"; try { localStorage.setItem("cadence:theme", n); } catch (e) {} return n; });
  const ThemeIcon = theme === "light" ? Sun : theme === "twilight" ? Sparkles : Moon;
  const [profileOpen, setProfileOpen] = useState(false);
  const updateUser = (patch) => { setUser(u => { const n = { ...u, ...patch }; saveUser(n); return n; }); };
  const [gantt, setGantt] = useState(() => loadGantt() || gSample());
  useEffect(() => { saveGantt(gantt); }, [gantt]);
  const [ganttGoto, setGanttGoto] = useState(null);
  const gotoGantt = (pid) => { if (pid) bumpOpen(pid); setGanttGoto(pid || null); setView("gantt"); };
  const [notif, setNotif] = useState(loadNotif);
  useEffect(() => { saveNotif(notif); }, [notif]);
  const [contacts, setContacts] = useState(loadContacts);
  useEffect(() => { saveContacts(contacts); }, [contacts]);
  const [compose, setCompose] = useState(null);
  const openComposer = (ids, source) => { const subj = source ? `[${source.group ? `${source.project} — ${source.group}` : (source.project || "Cadence")}] ` : ""; setCompose({ ids: [...new Set(ids)], subject: subj, body: "", picking: false, groupName: "", source: source || null }); };
  const [view, setView] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const [fPerson, setFPerson] = useState("all");
  const [fProject, setFProject] = useState("all");
  const [taskModal, setTaskModal] = useState(null);
  const [personModal, setPersonModal] = useState(null);
  const [projectModal, setProjectModal] = useState(null);
  const [teamEmail, setTeamEmail] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const d = loadData();
    if (d && (d.people || d.tasks)) setData({ people: d.people || [], projects: d.projects || [], tasks: d.tasks || [] });
    else setData(SEED_DATA);
    const u = loadUser(); if (u) setUser(u);
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) saveData(data); }, [data, loaded]);

  const signIn = (u) => { setUser(u); saveUser(u); setView("home"); };
  const signOut = () => { setUser(null); saveUser(null); setMenuOpen(false); };

  const personById = (id) => data.people.find(p => p.id === id);
  const projectById = (id) => data.projects.find(p => p.id === id);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return data.tasks.filter(t => {
      if (fPerson !== "all" && t.assigneeId !== fPerson) return false;
      if (fProject !== "all" && t.projectId !== fProject) return false;
      if (ql && !(`${t.title} ${t.notes || ""}`.toLowerCase().includes(ql))) return false;
      return true;
    });
  }, [data.tasks, q, fPerson, fProject]);

  /* mutations */
  const upsertTask = (t) => setData(d => ({ ...d, tasks: d.tasks.some(x => x.id === t.id) ? d.tasks.map(x => x.id === t.id ? t : x) : [...d.tasks, t] }));
  const delTask = (id) => setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
  const cycleStatus = (t) => { const o = ["todo", "doing", "done"]; upsertTask({ ...t, status: o[(o.indexOf(t.status) + 1) % 3] }); };
  const upsertPerson = (p) => setData(d => ({ ...d, people: d.people.some(x => x.id === p.id) ? d.people.map(x => x.id === p.id ? p : x) : [...d.people, p] }));
  const delPerson = (id) => setData(d => ({ ...d, people: d.people.filter(p => p.id !== id) }));
  const upsertProject = (p) => setData(d => ({ ...d, projects: d.projects.some(x => x.id === p.id) ? d.projects.map(x => x.id === p.id ? p : x) : [...d.projects, p] }));
  const delProject = (id) => setData(d => ({ ...d, projects: d.projects.filter(p => p.id !== id) }));

  /* email */
  const emailTask = (t) => {
    const person = personById(t.assigneeId), proj = projectById(t.projectId);
    const subject = `${proj ? "[" + proj.name + "] " : ""}${t.title}`;
    const lines = [`Hi ${person ? person.name.split(" ")[0] : ""},`, "", `Quick note about: ${t.title}`, proj ? `Project: ${proj.name}` : "", t.due ? `Due: ${fmtDue(t.due)}` : "", t.notes ? `\n${t.notes}` : "", "", "Thanks!"].filter(Boolean);
    window.open(`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(person?.email || "")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };
  const projectMembers = (projectId) => {
    const ids = new Set(data.tasks.filter(t => t.projectId === projectId).map(t => t.assigneeId));
    return data.people.filter(p => ids.has(p.id));
  };
  const sendTeamEmail = ({ toEmails, ccEmails, subject, body }) => {
    const u = new URLSearchParams();
    if (toEmails?.length) u.set("to", toEmails.join(","));
    if (ccEmails?.length) u.set("cc", ccEmails.join(","));
    if (subject) u.set("subject", subject);
    if (body) u.set("body", body);
    window.open(`https://outlook.office.com/mail/deeplink/compose?${u.toString()}`, "_blank");
  };

  /* export / import */
  const exportJSON = () => download(`cadence-backup-${todayISO()}.json`, JSON.stringify(data, null, 2), "application/json");
  const exportCSV = () => {
    const head = ["Task", "Project", "Assignee", "Role", "Status", "Start", "Due", "Priority", "Notes"];
    const rows = data.tasks.map(t => { const p = personById(t.assigneeId), j = projectById(t.projectId); return [t.title, j?.name || "", p?.name || "", p?.role || "", t.status, t.start || "", t.due || "", t.priority, t.notes || ""]; });
    download(`cadence-tasks-${todayISO()}.csv`, [head, ...rows].map(r => r.map(csvCell).join(",")).join("\n"), "text/csv");
  };
  const importJSON = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); setData({ people: d.people || [], projects: d.projects || [], tasks: d.tasks || [] }); } catch { alert("Could not read that backup file."); } };
    r.readAsText(file); e.target.value = "";
  };

  const newTask = (preset = {}) => setTaskModal({ id: uid(), title: "", notes: "", projectId: data.projects[0]?.id || "", assigneeId: data.people[0]?.id || "", status: "todo", start: "", due: "", priority: "med", createdAt: Date.now(), _new: true, ...preset });

  if (!loaded) return <div className={rootCls}><style dangerouslySetInnerHTML={{ __html: css }} /></div>;
  if (!user) return <div className={rootCls}><style dangerouslySetInnerHTML={{ __html: css }} /><LoginScreen onSignIn={signIn} /></div>;

  const ctx = { data, filtered, personById, projectById, projectMembers,
    setTaskModal, newTask, cycleStatus, delTask, emailTask, setTeamEmail,
    setPersonModal, setProjectModal, delPerson, delProject,
    q, setQ, fPerson, setFPerson, fProject, setFProject, setView, user,
    openProfile: () => setProfileOpen(true), updateUser,
    gantt, setGantt, ganttGoto, gotoGantt, clearGanttGoto: () => setGanttGoto(null),
    notif, setNotif,
    contacts, setContacts, openComposer,
    effLight, theme,
    loadSample: () => setData(SAMPLE) };

  const unreadCount = buildNotifs(gantt).filter(n => !notif.read.includes(n.id) && !notif.removed.includes(n.id)).length;
  const presence = user.presence || "auto";
  const online = presence !== "offline";

  return (
    <div className={rootCls} style={user.bg ? { background: `radial-gradient(1200px 760px at 50% -6%, ${user.bg} 0%, transparent 62%), radial-gradient(1000px 700px at 100% 102%, ${user.bg} 0%, transparent 58%), var(--bg)` } : undefined}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* top bar */}
      <div className="bar" onClick={() => menuOpen && setMenuOpen(false)}>
        <div className="prof" onClick={e => e.stopPropagation()}>
          <button className="prof-btn" onClick={() => setMenuOpen(o => !o)}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              <UserAv u={user} size={32} />
              <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: 99, background: online ? "#33B36B" : "#E03A3E", border: "2px solid var(--panel)" }} />
            </span>
            <span>
              <span className="prof-name">{user.name}</span>
              <span className="prof-mail">{user.email}</span>
            </span>
            <ChevronDown size={16} color="var(--muted)" />
          </button>
          {menuOpen && (
            <div className="menu">
              <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 10 }}>
                <UserAv u={user} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="prof-name">{user.name}</div>
                  <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: online ? "var(--done)" : "var(--primary)", fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: online ? "#33B36B" : "#E03A3E" }} />{online ? "Online" : "Offline"}</div>
                </div>
              </div>
              <div className="menu-sep" />
              <div className="menu-lbl">Set status</div>
              <button className={`menu-i ${presence === "auto" ? "on" : ""}`} onClick={() => { updateUser({ presence: "auto" }); setMenuOpen(false); }}><Monitor size={17} />Auto — online while you're here</button>
              <button className={`menu-i ${presence === "online" ? "on" : ""}`} onClick={() => { updateUser({ presence: "online" }); setMenuOpen(false); }}><span style={{ width: 17, display: "grid", placeItems: "center" }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "#33B36B" }} /></span>Online</button>
              <button className={`menu-i ${presence === "offline" ? "on" : ""}`} onClick={() => { updateUser({ presence: "offline" }); setMenuOpen(false); }}><span style={{ width: 17, display: "grid", placeItems: "center" }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "#E03A3E" }} /></span>Offline</button>
              <div className="menu-sep" />
              <button className="menu-i" onClick={signOut}><LogOut size={17} />Sign out</button>
            </div>
          )}
        </div>

        <div className="tabs">
          {NAV.map(n => (
            <button key={n.id} className={`tab ${view === n.id ? "on" : ""}`} onClick={() => setView(n.id)} style={{ position: "relative" }}>
              <n.Icon size={15} />{n.label}
              {n.id === "alerts" && unreadCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99, background: "var(--primary)", color: "#fff", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center", border: "2px solid var(--panel)" }}>{unreadCount}</span>}
            </button>
          ))}
        </div>
        <div className="bar-sp" />
        <button className="btn icon-btn" onClick={cycleTheme} title={`Theme: ${theme}`}><ThemeIcon size={16} /></button>
        <div className="brand-min"><span className="bm"><LayoutGrid size={17} /></span><b>Cadence</b></div>
        <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} style={{ display: "none" }} />
      </div>

      <div className="main">
        {view === "home" && <HomeView ctx={ctx} />}
        {view === "tracker" && <TrackerView ctx={ctx} />}
        {view === "gantt" && <GanttView ctx={ctx} />}
        {view === "alerts" && <NotificationsView ctx={ctx} />}
        {view === "calendar" && <CalendarView ctx={ctx} />}
        {view === "team" && <TeamView ctx={ctx} />}
      </div>

      {taskModal && (
        <TaskModal task={taskModal} people={data.people} projects={data.projects}
          onClose={() => setTaskModal(null)} onSave={(t) => { upsertTask(t); setTaskModal(null); }}
          onDelete={taskModal._new ? null : () => { delTask(taskModal.id); setTaskModal(null); }} />
      )}
      {personModal && <PersonModal person={personModal} onClose={() => setPersonModal(null)} onSave={(p) => { upsertPerson(p); setPersonModal(null); }} />}
      {projectModal && <ProjectModal project={projectModal} onClose={() => setProjectModal(null)} onSave={(p) => { upsertProject(p); setProjectModal(null); }} />}
      {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} onSave={updateUser} />}
      {teamEmail && <TeamEmailModal project={teamEmail} members={projectMembers(teamEmail.id)} fromUser={user} onClose={() => setTeamEmail(null)} onSend={(p) => { sendTeamEmail(p); setTeamEmail(null); }} />}
      {compose && <EmailComposerModal ctx={ctx} compose={compose} setCompose={setCompose} />}
    </div>
  );
}

/* ---------------- Home dashboard ---------------- */
function HomeView({ ctx }) {
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

/*EOF-SENTINEL*/
