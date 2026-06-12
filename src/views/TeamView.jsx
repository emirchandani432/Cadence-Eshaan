// Team view — people directory, saved groups, and per-project rosters.
import { useState, useEffect, useRef } from "react";
import { Users, Mail, Trash2, Pencil, X, Search, FolderOpen } from "lucide-react";
import { initials, fmtDue, UserAv } from "../helpers.jsx";

const DISCIPLINES = ["Civil", "Electrical", "Mechanical", "Structural", "Plumbing", "Architecture", "Survey", "Project Management", "Safety", "Estimating", "Superintendent"];
const BIOS = ["Dependable on site, quick to sign off.", "Detail-driven; keeps the crew on schedule.", "Veteran hand — calm under deadline pressure.", "Strong communicator, rarely misses a hand-off.", "Problem-solver who keeps things moving.", "Steady worker, sharp on quality checks.", "Knows the plans cold, flags issues early.", "Reliable closer — finishes what they start."];
function previewBio(p) {
  let h = 0; const s = (p && (p.id || p.name)) || ""; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const base = BIOS[h % BIOS.length];
  return p && p.discipline ? `${p.discipline} specialist. ${base}` : base;
}

function DisciplineField({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const q = (value || "").toLowerCase();
  const opts = q ? DISCIPLINES.filter(d => d.toLowerCase().includes(q)) : DISCIPLINES;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input value={value || ""} onClick={() => setOpen(true)} onFocus={() => setOpen(true)} onChange={e => { onChange(e.target.value); setOpen(true); }} placeholder={placeholder || "Click to pick, or type your own"} />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "var(--panel2)", border: "1px solid var(--line2)", borderRadius: 11, boxShadow: "0 14px 36px rgba(0,0,0,.4)", zIndex: 40, maxHeight: 220, overflowY: "auto", padding: 5 }}>
          {opts.length === 0 ? <div style={{ padding: "8px 10px", fontSize: 12.5, color: "var(--dim)" }}>Press enter to use "{value}"</div> :
            opts.map(d => <div key={d} onClick={() => { onChange(d); setOpen(false); }} style={{ padding: "8px 10px", fontSize: 13.5, borderRadius: 8, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "var(--raise)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{d}</div>)}
        </div>
      )}
    </div>
  );
}

export function TeamView({ ctx }) {
  const { user, openProfile, updateUser, openComposer, gotoGantt } = ctx;
  const gd = ctx.gantt;
  const data = ctx.data;
  const contacts = ctx.contacts;
  const setContacts = ctx.setContacts;
  const [q, setQ] = useState("");
  const [gq, setGq] = useState("");
  const [pq, setPq] = useState("");
  const [openPerson, setOpenPerson] = useState(null);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(true);
  const gComplete = (g) => g.members.length > 0 && g.members.every(m => m.done);

  // build contact book from everyone who's been on a project with you
  const peopleMap = {};
  gd.projects.filter(p => !p.deleted).forEach(p => p.groups.forEach(g => g.members.forEach(m => {
    if (!peopleMap[m.id]) peopleMap[m.id] = { id: m.id, name: m.name, color: m.color, projects: new Set() };
    peopleMap[m.id].projects.add(p.name);
  })));
  data.people.forEach(pp => { if (peopleMap[pp.id]) { peopleMap[pp.id].email = pp.email; peopleMap[pp.id].role = pp.role; } });
  Object.values(peopleMap).forEach(p => { const info = contacts.info[p.id] || {}; p.nickname = info.nickname || ""; if (info.email) p.email = info.email; if (info.discipline) p.discipline = info.discipline; });
  const people = Object.values(peopleMap).sort((a, b) => a.name.localeCompare(b.name));
  const byId = (id) => people.find(p => p.id === id);
  const ql = q.trim().toLowerCase();
  const shown = ql ? people.filter(p => p.name.toLowerCase().includes(ql) || (p.nickname || "").toLowerCase().includes(ql)) : people;

  const saveInfo = (id, patch) => setContacts(c => ({ ...c, info: { ...c.info, [id]: { ...(c.info[id] || {}), ...patch } } }));
  const delGroup = (gid) => setContacts(c => ({ ...c, groups: c.groups.filter(g => g.id !== gid) }));

  return (
    <>
      <div className="head">
        <div><div className="h-title">Team</div><div className="h-sub">You, and everyone you've worked with.</div></div>
      </div>

      <div className="sec-h"><Users size={18} />You</div>
      <div className="panel" style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={openProfile}>
          <UserAv u={user} size={52} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: "Fraunces", fontSize: 19, fontWeight: 600 }}>{user.name}{user.discipline ? <span style={{ fontFamily: "Outfit", fontSize: 12.5, fontWeight: 700, color: "var(--teal)", background: "rgba(79,168,232,.16)", borderRadius: 99, padding: "2px 10px", marginLeft: 9 }}>{user.discipline}</span> : null}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{user.email}</div>
            {user.about ? <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 5, lineHeight: 1.4 }}>{user.about}</div> : <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5 }}>Add an "about" so your team knows who you are.</div>}
          </div>
          <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openProfile(); }}><Pencil size={13} />Edit profile</button>
        </div>
        <div className="fld" style={{ marginTop: 12, marginBottom: 0, maxWidth: 320 }}>
          <label>What you do (click to pick, or type your own)</label>
          <DisciplineField value={user.discipline} onChange={v => updateUser({ discipline: v })} placeholder="e.g. Civil, Electrical…" />
        </div>
      </div>

      {contacts.groups.length > 0 && (
        <>
          <div className="sec-h"><Mail size={18} />Saved groups</div>
          <div style={{ position: "relative", maxWidth: 280, marginBottom: 10 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--dim)" }} />
            <input value={gq} onChange={e => setGq(e.target.value)} placeholder="Search saved groups…" style={{ width: "100%", paddingLeft: 30, fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 9, padding: "7px 10px 7px 30px", background: "var(--panel)", outline: "none" }} />
          </div>
          <div className="team-grid" style={{ marginBottom: 8 }}>
            {contacts.groups.filter(g => !gq.trim() || g.name.toLowerCase().includes(gq.trim().toLowerCase())).map(g => {
              const src = g.source ? (g.source.group ? `${g.source.project} · ${g.source.group}` : g.source.project ? `${g.source.project} · team` : "") : "";
              return (
                <div className="person" key={g.id}>
                  <div className="pa" style={{ background: "var(--teal)" }}><Users size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pn">{g.name}</div>
                    {src ? <div className="pr" style={{ color: "var(--teal)" }}>{src}</div> : <div className="pr">{g.memberIds.length} people</div>}
                    <div className="pe" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{g.memberIds.map(id => byId(id)?.name.split(" ")[0]).filter(Boolean).join(", ")}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button className="btn btn-ghost icon-btn" title="Email this group" onClick={() => openComposer(g.memberIds, g.source)}><Mail size={15} /></button>
                    <button className="btn btn-ghost icon-btn" onClick={() => delGroup(g.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="sec-h" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => { setPeopleOpen(v => !v); setQ(""); }}>
        <Users size={18} />All People<span style={{ marginLeft: "auto", fontSize: 12, color: "var(--dim)", fontWeight: 500 }}>{peopleOpen ? "▲" : "▼"}</span>
      </div>
      {peopleOpen && (
        <div style={{ position: "relative", maxWidth: 280, marginBottom: 10 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--dim)" }} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search people…" style={{ width: "100%", fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 9, padding: "7px 10px 7px 30px", background: "var(--panel)", outline: "none" }} />
        </div>
      )}
      {peopleOpen && (people.length === 0 ? <div className="empty-sm">No one yet — once people are added to your projects' groups, they'll show up here.</div> :
        shown.length === 0 ? <div className="empty-sm">No one matches "{q}".</div> :
        <div className="team-grid">
          {shown.map(p => (
            <div className="person" key={p.id} style={{ cursor: "pointer" }} onClick={() => setOpenPerson(p.id)}>
              <div className="pa" style={{ background: p.color }}>{initials(p.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pn">{p.name}{p.nickname ? <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", marginLeft: 6 }}>({p.nickname})</span> : null}</div>
                <div className="pr">{p.discipline || p.role || "—"}</div>
                <div className="pe">{p.email || "no email yet"}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{[...p.projects].slice(0, 2).join(", ")}{p.projects.size > 2 ? "…" : ""}</div>
              </div>
              <button className="btn btn-ghost icon-btn" title="Email" onClick={(e) => { e.stopPropagation(); openComposer([p.id]); }}><Mail size={15} /></button>
            </div>
          ))}
        </div>)}

      <div className="sec-h" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => { setProjOpen(v => !v); setPq(""); }}>
        <FolderOpen size={18} />Projects<span style={{ marginLeft: "auto", fontSize: 12, color: "var(--dim)", fontWeight: 500 }}>{projOpen ? "▲" : "▼"}</span>
      </div>
      {projOpen && (
      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--dim)" }} />
            <input value={pq} onChange={e => setPq(e.target.value)} placeholder="Search projects or groups…" style={{ width: "100%", paddingLeft: 30, fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 9, padding: "7px 10px 7px 30px", background: "var(--bg)", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--primary)" }} />project</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--teal)" }} />task</span>
          </div>
        </div>
        {(() => {
          const pql = pq.trim().toLowerCase();
          const rows = gd.projects.filter(p => !p.deleted && !p.done).map(p => {
            const incomplete = p.groups.filter(g => !gComplete(g));
            const nameMatch = !pql || p.name.toLowerCase().includes(pql);
            const groups = pql ? incomplete.filter(g => nameMatch || g.name.toLowerCase().includes(pql)) : incomplete;
            return { p, groups, nameMatch };
          }).filter(r => !pql || r.nameMatch || r.groups.length > 0);
          if (rows.length === 0) return <div className="empty-sm">{pql ? `Nothing matches "${pq}".` : "No open projects — everything's done. 🎉"}</div>;
          const projMembers = (p) => { const seen = {}; const out = []; p.groups.forEach(g => g.members.forEach(m => { if (!seen[m.id]) { seen[m.id] = 1; out.push(m.id); } })); return out; };
          return (
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {rows.map(({ p, groups }) => (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 4px" }}>
                    <span style={{ width: 11, height: 11, borderRadius: 99, background: "var(--primary)", flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 14.5, cursor: "pointer" }} onClick={() => gotoGantt(p.id)}>{p.name}</span>
                    {p.due && <span className="chip chip-due">{fmtDue(p.due)}</span>}
                    <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={() => openComposer(projMembers(p), { project: p.name })}><Mail size={13} />Email team</button>
                  </div>
                  {groups.length === 0 ? <div style={{ fontSize: 12, color: "var(--dim)", padding: "2px 0 4px 24px" }}>All groups signed off.</div> :
                    groups.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 4px 5px 24px" }}>
                        <span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--teal)", flexShrink: 0 }} />
                        <span style={{ fontSize: 13.5, cursor: "pointer" }} onClick={() => gotoGantt(p.id)}>{g.name}</span>
                        {g.end && <span className="chip chip-due">{fmtDue(g.end)}</span>}
                        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{g.members.filter(m => m.done).length}/{g.members.length} signed off</span>
                        <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => openComposer(g.members.map(m => m.id), { project: p.name, group: g.name })} disabled={g.members.length === 0}><Mail size={12} />Email group</button>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
      )}

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--muted)", padding: "4px 2px" }}>Need a group you're not on? Email any group</summary>
        <div className="panel" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>Every group across all projects — reach out even if you're not part of it.</div>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {(() => {
              const pql = pq.trim().toLowerCase();
              const all = [];
              gd.projects.filter(p => !p.deleted).forEach(p => p.groups.forEach(g => {
                if (!pql || p.name.toLowerCase().includes(pql) || g.name.toLowerCase().includes(pql)) all.push({ p, g });
              }));
              if (all.length === 0) return <div className="empty-sm">No groups found.</div>;
              return all.map(({ p, g }) => (
                <div key={p.id + g.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 4px" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: g.color || p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5 }}><span style={{ color: "var(--muted)" }}>{p.name}</span> · {g.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{g.members.length} {g.members.length === 1 ? "person" : "people"}</span>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => openComposer(g.members.map(m => m.id), { project: p.name, group: g.name })} disabled={g.members.length === 0}><Mail size={12} />Email</button>
                </div>
              ));
            })()}
          </div>
        </div>
      </details>

      {openPerson && (() => { const p = byId(openPerson); if (!p) return null; return (
        <div className="ov" onClick={() => setOpenPerson(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-h"><h2>Profile</h2><button className="btn btn-ghost icon-btn" onClick={() => setOpenPerson(null)}><X size={18} /></button></div>
            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
              <span className="av" style={{ width: 52, height: 52, fontSize: 19, background: p.color }}>{initials(p.name)}</span>
              <div><div style={{ fontFamily: "Fraunces", fontSize: 20, fontWeight: 600 }}>{p.name}{p.nickname ? <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginLeft: 7 }}>({p.nickname})</span> : null}</div><div style={{ fontSize: 12.5, color: "var(--muted)" }}>{[...p.projects].join(", ")}</div></div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--dim)", fontStyle: "italic", marginBottom: 12, lineHeight: 1.4 }}>{previewBio(p)} <span style={{ fontSize: 10.5, fontStyle: "normal" }}>(preview)</span></div>
            <div className="fld"><label>Nickname</label><input value={p.nickname || ""} onChange={e => saveInfo(p.id, { nickname: e.target.value })} placeholder="What you call them" /></div>
            <div className="fld"><label>Email</label><input value={p.email || ""} onChange={e => saveInfo(p.id, { email: e.target.value })} placeholder="name@company.com" /></div>
            <div className="fld"><label>Discipline</label><DisciplineField value={p.discipline} onChange={v => saveInfo(p.id, { discipline: v })} placeholder="e.g. Electrical" /></div>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={() => { openComposer([p.id]); setOpenPerson(null); }}><Mail size={16} />Email {p.name.split(" ")[0]}</button>
          </div>
        </div>
      ); })()}
    </>
  );
}

/* ---------------- Shared email composer ---------------- */
