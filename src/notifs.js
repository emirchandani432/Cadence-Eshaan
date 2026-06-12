// Builds the notification list from gantt data (used by the Inbox view and the nav unread badge).
import { todayISO, dayDiff, fmtDue } from "./helpers.jsx";

export function buildNotifs(gd) {
  const today = todayISO();
  const gC = (g) => g.members.length > 0 && g.members.every(m => m.done);
  const out = [];
  gd.projects.filter(p => !p.deleted).forEach(p => {
    const role = p.myRole;
    if (p.invited) out.push({ id: p.id + "inv", kind: "alert", color: "var(--teal)", icon: "mail", title: `You're invited to ${p.name}`, sub: `As ${p.invitedAs || "editor"} · open it to join`, pid: p.id });
    if (role !== "viewer" && p.due && !p.done) {
      const dleft = dayDiff(today, p.due);
      if (dleft < 0) out.push({ id: p.id + "po", kind: "alert", color: "var(--primary)", icon: "flame", title: `${p.name} is overdue and not finished`, sub: `Was due ${fmtDue(p.due)}`, pid: p.id });
      else if (dleft <= 1) out.push({ id: p.id + "pd", kind: "alert", color: "var(--primary)", icon: "alert", title: `${p.name} is due ${dleft === 0 ? "today" : "tomorrow"} and isn't done`, sub: "Heads up — time to wrap it up.", pid: p.id });
      else if (dleft <= 3) out.push({ id: p.id + "ps", kind: "alert", color: "var(--amber)", icon: "clock", title: `${p.name} is due in ${dleft} days`, sub: `Due ${fmtDue(p.due)}`, pid: p.id });
    }
    p.groups.forEach(g => {
      const overdue = !gC(g) && g.end && g.end < today;
      if (overdue && role !== "viewer") {
        out.push({ id: g.id + "go", kind: "alert", color: "var(--primary)", icon: "alert", title: `${g.name} is overdue`, sub: `${p.name} · was due ${fmtDue(g.end)}`, pid: p.id });
        if (role === "owner") g.members.filter(m => !m.done).forEach(m => out.push({ id: g.id + m.id + "b", kind: "alert", color: "var(--primary)", icon: "flame", title: `${m.name} has fallen behind`, sub: `Hasn't signed off on ${g.name} · ${p.name}`, pid: p.id }));
      }
      if (role !== "viewer") (g.notes || []).forEach((n, i) => out.push({ id: g.id + "n" + i, kind: "activity", color: "var(--teal)", icon: "msg", title: `New comment on ${g.name}`, sub: `"${n.text}" — ${n.by} · ${p.name}`, pid: p.id }));
    });
  });
  const firstProj = gd.projects.find(p => !p.deleted);
  const someName = (() => { for (const p of gd.projects) for (const g of p.groups) if (g.members[0]) return g.members[0].name; return "A teammate"; })();
  if (firstProj) {
    out.push({ id: "dem-email", kind: "activity", color: "var(--teal)", icon: "mail", title: `New email from ${someName}`, sub: `"Quick question about ${firstProj.name}"`, pid: firstProj.id, demo: true });
    out.push({ id: "dem-task", kind: "activity", color: "var(--slate)", icon: "plus", title: `New task added to ${firstProj.name}`, sub: `${someName} created a group`, pid: firstProj.id, demo: true });
    out.push({ id: "dem-date", kind: "activity", color: "var(--amber)", icon: "cal", title: `A task date changed in ${firstProj.name}`, sub: "A group was extended by 3 days", pid: firstProj.id, demo: true });
  }
  return out;
}
