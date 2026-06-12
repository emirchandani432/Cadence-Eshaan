// Inbox view — role-tuned alerts and activity built from gantt data.
import { useState } from "react";
import { AlertCircle, Bell, CalendarDays, Check, ChevronRight, Clock, Flame, Mail, MessageSquare, Plus, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { buildNotifs } from "../notifs.js";

const NICON = { flame: Flame, alert: AlertCircle, clock: Clock, msg: MessageSquare, mail: Mail, plus: Plus, cal: CalendarDays };

export function NotificationsView({ ctx }) {
  const { gantt: gd, gotoGantt, notif, setNotif } = ctx;
  const all = buildNotifs(gd);
  const isRead = (id) => notif.read.includes(id);
  const isRemoved = (id) => notif.removed.includes(id);
  const live = all.filter(n => !isRemoved(n.id));
  const unread = live.filter(n => !isRead(n.id));
  const readList = live.filter(n => isRead(n.id));
  const alerts = unread.filter(n => n.kind === "alert");
  const activity = unread.filter(n => n.kind === "activity");

  const markRead = (id) => setNotif(s => ({ ...s, read: [...new Set([...s.read, id])] }));
  const unreadAgain = (id) => setNotif(s => ({ ...s, read: s.read.filter(x => x !== id) }));
  const remove = (id) => setNotif(s => ({ read: s.read.filter(x => x !== id), removed: [...new Set([...s.removed, id])] }));
  const markAll = () => setNotif(s => ({ ...s, read: [...new Set([...s.read, ...unread.map(n => n.id)])] }));
  const [iq, setIq] = useState("");
  const ql = iq.trim().toLowerCase();
  const hits = ql ? live.filter(n => (n.title + " " + n.sub).toLowerCase().includes(ql)) : [];
  const snippet = (text) => {
    const i = text.toLowerCase().indexOf(ql); if (i < 0) return text;
    const from = Math.max(0, i - 22), to = Math.min(text.length, i + ql.length + 26);
    return [from > 0 ? "…" : "", text.slice(from, i), <mark key="m" style={{ background: "rgba(232,165,60,.4)", color: "var(--ink)", borderRadius: 3, padding: "0 2px" }}>{text.slice(i, i + ql.length)}</mark>, text.slice(i + ql.length, to), to < text.length ? "…" : ""];
  };

  const Row = ({ n, read }) => { const Icon = NICON[n.icon] || Bell; return (
    <div className="row-i" style={{ alignItems: "flex-start" }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: n.color + "22", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1, opacity: read ? .6 : 1 }}><Icon size={16} color={n.color} /></span>
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer", opacity: read ? .7 : 1 }} onClick={() => gotoGantt(n.pid)}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{n.title}{n.demo && <span style={{ fontSize: 10, color: "var(--dim)", fontWeight: 500, marginLeft: 6 }}>demo</span>}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{n.sub}</div>
      </div>
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        {read
          ? <button className="btn btn-ghost icon-btn" title="Bring back to unread" onClick={() => unreadAgain(n.id)}><RotateCcw size={14} /></button>
          : <button className="btn btn-ghost icon-btn" title="Mark read" onClick={() => markRead(n.id)}><Check size={15} /></button>}
        <button className="btn btn-ghost icon-btn" title="Remove" onClick={() => remove(n.id)}><X size={14} /></button>
      </div>
    </div>
  ); };

  return (
    <>
      <div className="head">
        <div><div className="h-title">Inbox</div><div className="h-sub">Alerts and activity from your projects — tuned to your role.</div></div>
        {unread.length > 0 && !ql && <button className="btn btn-sm" onClick={markAll}><Check size={14} />Mark all read</button>}
      </div>

      <div style={{ position: "relative", maxWidth: 340, marginBottom: 14 }}>
        <Search size={15} style={{ position: "absolute", left: 11, top: 10, color: "var(--dim)" }} />
        <input value={iq} onChange={e => setIq(e.target.value)} placeholder="Search notifications by keyword…" style={{ width: "100%", paddingLeft: 34, fontFamily: "Outfit", fontSize: 13.5, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 11, padding: "9px 12px 9px 34px", background: "var(--panel)", outline: "none" }} />
      </div>

      {ql ? (
        <div className="panel">
          <div className="panel-h"><span className="pic" style={{ background: "rgba(232,165,60,.16)" }}><Search size={15} color="var(--amber)" /></span>Results for "{iq}"{hits.length > 0 && <span className="more">{hits.length}</span>}</div>
          {hits.length === 0 ? <div className="empty-sm">No notifications mention "{iq}".</div> : hits.map(n => { const Icon = NICON[n.icon] || Bell; return (
            <div className="row-i" key={n.id} style={{ alignItems: "flex-start", cursor: "pointer" }} onClick={() => gotoGantt(n.pid)}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: n.color + "22", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}><Icon size={16} color={n.color} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{snippet(n.title)}{isRead(n.id) && <span style={{ fontSize: 10, color: "var(--dim)", fontWeight: 500, marginLeft: 6 }}>read</span>}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{snippet(n.sub)}</div>
              </div>
              <ChevronRight size={15} color="var(--dim)" style={{ marginTop: 6 }} />
            </div>
          ); })}
        </div>
      ) : (<>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-h"><span className="pic" style={{ background: "rgba(224,58,62,.16)" }}><AlertCircle size={16} color="var(--primary)" /></span>Needs attention{alerts.length > 0 && <span className="more">{alerts.length}</span>}</div>
        {alerts.length === 0 ? <div className="empty-sm">All clear — nothing behind or due right now. 🎉</div> : alerts.map(n => <Row key={n.id} n={n} />)}
      </div>

      <div className="panel">
        <div className="panel-h"><span className="pic" style={{ background: "rgba(79,168,232,.16)" }}><Bell size={16} color="var(--teal)" /></span>Activity{activity.length > 0 && <span className="more">{activity.length}</span>}</div>
        {activity.length === 0 ? <div className="empty-sm">Nothing new.</div> : activity.map(n => <Row key={n.id} n={n} />)}
      </div>
      </>)}

      {readList.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--muted)", padding: "4px 2px" }}>Read notifications ({readList.length})</summary>
          <div className="panel" style={{ marginTop: 8 }}>
            {readList.map(n => <Row key={n.id} n={n} read />)}
          </div>
        </details>
      )}

      <div className="foot-note" style={{ justifyContent: "flex-start", marginTop: 12 }}><Sparkles size={12} />You only see what affects you — owners get "fell behind" alerts, editors get their own deadline warnings, viewers stay quiet. Live alerts (new messages, emails) turn on with the backend.</div>
    </>
  );
}
