import { useState, useEffect, useMemo, useRef } from "react";

import {
  Plus, CalendarDays, Users, LayoutGrid, Mail, Check, Trash2, Pencil,
  Download, Upload, X, ChevronLeft, ChevronRight, Search, Sparkles,
  CheckCircle2, Circle, Clock, FolderOpen, AlertCircle, LogOut, Send, ShieldCheck,
  LayoutDashboard, GanttChartSquare, ChevronDown, ChevronUp, Settings, TrendingUp, Flame, Sun, Moon, Monitor, RefreshCw, Minus, RotateCcw, Bell, MessageSquare, Table
} from "lucide-react";
import { SEED_DATA } from "./seedData.js";

import { LoginScreen } from "./components/LoginScreen.jsx";
import { EmailComposerModal, TaskModal, PersonModal, ProjectModal, ProfileModal, TeamEmailModal } from "./components/modals.jsx";
import { CalendarView } from "./views/CalendarView.jsx";
import { TrackerView } from "./views/TrackerView.jsx";
import { TeamView } from "./views/TeamView.jsx";
import { buildNotifs } from "./notifs.js";
import { NotificationsView } from "./views/InboxView.jsx";
import { GanttView } from "./views/GanttView.jsx";
import { HomeView } from "./views/HomeView.jsx";
import { css } from "./styles.js";
import { PALETTE, uid, todayISO, addDays, fmtDue, download, csvCell, UserAv, gSample } from "./helpers.jsx";
import { loadData, saveData, loadUser, saveUser, loadGantt, saveGantt, bumpOpen, loadContacts, saveContacts, loadNotif, saveNotif } from "./storage.js";

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

/*EOF-SENTINEL*/
