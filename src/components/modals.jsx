// Shared modals and cards rendered from App or multiple views.
import { useState, useRef } from "react";
import { Plus, CalendarDays, Users, Mail, Check, Trash2, Pencil, Download, Upload, X, Search, CheckCircle2, Circle, Clock, AlertCircle, Send } from "lucide-react";
import { PALETTE, uid, initials, fmtDue, isOverdue, PRIO, download, UserAv, BG_PRESETS } from "../helpers.jsx";

export function EmailComposerModal({ ctx, compose, setCompose }) {
  const { user, gantt: gd, data, contacts, setContacts } = ctx;
  const [pickQ, setPickQ] = useState("");
  const [img, setImg] = useState(null);
  const [imgName, setImgName] = useState("");
  const [hint, setHint] = useState("");
  const imgRef = useRef(null);
  const peopleMap = {};
  gd.projects.filter(p => !p.deleted).forEach(p => p.groups.forEach(g => g.members.forEach(m => { if (!peopleMap[m.id]) peopleMap[m.id] = { id: m.id, name: m.name, color: m.color }; })));
  data.people.forEach(pp => { if (peopleMap[pp.id]) peopleMap[pp.id].email = peopleMap[pp.id].email || pp.email; });
  Object.values(peopleMap).forEach(p => { const info = contacts.info[p.id] || {}; p.nickname = info.nickname || ""; if (info.email) p.email = info.email; });
  const people = Object.values(peopleMap).sort((a, b) => a.name.localeCompare(b.name));
  const byId = (id) => people.find(p => p.id === id);
  const close = () => setCompose(null);
  const addRecipient = (id) => setCompose(c => ({ ...c, ids: c.ids.includes(id) ? c.ids : [...c.ids, id], picking: false }));
  const removeRecipient = (id) => setCompose(c => ({ ...c, ids: c.ids.filter(x => x !== id) }));
  const pickImg = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; if (f.size > 4 * 1024 * 1024) { alert("Please choose an image under ~4 MB."); return; } const r = new FileReader(); r.onload = () => { setImg(r.result); setImgName(f.name); }; r.readAsDataURL(f); };
  const downloadImg = () => { if (!img) return; const a = document.createElement("a"); a.href = img; a.download = imgName || "image.png"; document.body.appendChild(a); a.click(); a.remove(); };
  const copyImg = async () => { try { const blob = await (await fetch(img)).blob(); await navigator.clipboard.write([new window.ClipboardItem({ [blob.type]: blob })]); return true; } catch (e) { return false; } };
  const openOutlook = async (web) => {
    const emails = compose.ids.map(byId).filter(p => p && p.email).map(p => p.email);
    if (!emails.length) { alert("None of these people have an email saved. Add one from their profile in Team."); return; }
    let body = compose.body || "";
    if (img) {
      const copied = await copyImg();
      body += (body ? "\n\n" : "") + (copied ? "[Image copied to your clipboard — press Ctrl+V (⌘V on Mac) in the email to paste it in.]" : "[Attach the image from Cadence — use Download, then attach it in the email.]");
      setHint(copied ? "Image copied — paste it into the email with Ctrl+V (⌘V)." : "Couldn't auto-copy — tap Download and attach it in the email.");
    }
    if (web) {
      const u = new URLSearchParams(); u.set("to", emails.join(",")); if (compose.subject) u.set("subject", compose.subject); if (body) u.set("body", body);
      window.open(`https://outlook.office.com/mail/deeplink/compose?${u.toString()}`, "_blank");
    } else {
      window.location.href = `mailto:${emails.join(",")}?subject=${encodeURIComponent(compose.subject || "")}&body=${encodeURIComponent(body)}`;
    }
  };
  const saveGroup = () => { const name = (compose.groupName || "").trim(); if (!name || compose.ids.length === 0) return; setContacts(c => ({ ...c, groups: [...c.groups, { id: uid(), name, memberIds: compose.ids, source: compose.source || null }] })); setCompose(c => ({ ...c, groupName: "", saved: true })); };
  const srcLabel = compose.source ? (compose.source.group ? `${compose.source.project} · ${compose.source.group}` : compose.source.project ? `${compose.source.project} · team` : "") : "";

  return (
    <div className="ov" onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>New email{srcLabel ? <span style={{ fontFamily: "Outfit", fontSize: 12.5, fontWeight: 600, color: "var(--teal)", marginLeft: 8 }}>{srcLabel}</span> : null}</h2><button className="btn btn-ghost icon-btn" onClick={close}><X size={18} /></button></div>
        <div className="from-line"><Mail size={14} /> Sending from <b>{user.email}</b> — always from you.</div>
        <div className="fld">
          <label>To</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {compose.ids.map(id => { const p = byId(id); if (!p) return null; return (
              <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--raise)", border: "1px solid var(--line2)", borderRadius: 99, padding: "4px 8px 4px 5px", fontSize: 12.5 }}>
                <span className="av" style={{ width: 18, height: 18, fontSize: 8, background: p.color }}>{initials(p.name)}</span>{p.nickname || p.name.split(" ")[0]}
                <X size={12} style={{ cursor: "pointer" }} onClick={() => removeRecipient(id)} />
              </span>
            ); })}
            <button className="btn btn-sm" onClick={() => setCompose(c => ({ ...c, picking: !c.picking }))}><Plus size={13} />Add another</button>
          </div>
        </div>
        {compose.picking && (
          <div style={{ marginBottom: 13 }}>
            <div style={{ position: "relative", marginBottom: 6 }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: 8, color: "var(--dim)" }} />
              <input autoFocus value={pickQ} onChange={e => setPickQ(e.target.value)} placeholder="Search people…" style={{ width: "100%", paddingLeft: 28, fontFamily: "Outfit", fontSize: 12.5, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 8, padding: "6px 9px 6px 28px", background: "var(--bg)", outline: "none" }} />
            </div>
            <div className="rcp" style={{ maxHeight: 170, overflowY: "auto" }}>
              {people.filter(p => !compose.ids.includes(p.id) && (!pickQ.trim() || p.name.toLowerCase().includes(pickQ.trim().toLowerCase()) || (p.nickname || "").toLowerCase().includes(pickQ.trim().toLowerCase()))).map(p => (
                <div className="rcp-row" key={p.id} onClick={() => addRecipient(p.id)}>
                  <span className="rcp-av" style={{ background: p.color }}>{initials(p.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}><div className="rcp-name">{p.name}{p.nickname ? ` (${p.nickname})` : ""}</div><div className="rcp-role">{p.email || "no email"}</div></div>
                  <Plus size={15} color="var(--muted)" />
                </div>
              ))}
              {people.filter(p => !compose.ids.includes(p.id)).length === 0 && <div className="empty-sm" style={{ padding: 8 }}>Everyone's added.</div>}
            </div>
          </div>
        )}
        <div className="fld"><label>Subject</label><input value={compose.subject} onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))} placeholder="Subject" /></div>
        <div className="fld"><label>Message</label><textarea value={compose.body} onChange={e => setCompose(c => ({ ...c, body: e.target.value }))} placeholder="Write your message…" /></div>
        <div className="fld" style={{ marginBottom: 8 }}>
          <label>Image (optional)</label>
          {img ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={img} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line2)" }} />
              <span style={{ fontSize: 12.5, color: "var(--muted)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imgName}</span>
              <button className="btn btn-sm" onClick={downloadImg}><Download size={13} />Download</button>
              <button className="btn btn-ghost icon-btn" onClick={() => { setImg(null); setImgName(""); setHint(""); }}><X size={15} /></button>
            </div>
          ) : (
            <button className="btn btn-sm" onClick={() => imgRef.current && imgRef.current.click()}><Plus size={13} />Attach image</button>
          )}
          <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pickImg} />
        </div>
        {hint && <div style={{ fontSize: 11.5, color: "var(--teal)", marginBottom: 8 }}>{hint}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-pri" style={{ flex: 1, justifyContent: "center" }} onClick={() => openOutlook(true)}><Send size={16} />Open in Outlook (web)</button>
          <button className="btn" onClick={() => openOutlook(false)} title="Open your desktop mail app (Outlook, etc.)"><Mail size={15} />Mail app</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <input value={compose.groupName} onChange={e => setCompose(c => ({ ...c, groupName: e.target.value, saved: false }))} placeholder="Name this group to save it" style={{ flex: 1, fontFamily: "Outfit", fontSize: 13, color: "var(--ink)", border: "1px solid var(--line2)", borderRadius: 9, padding: "8px 10px", background: "var(--bg)", outline: "none" }} />
          <button className="btn" onClick={saveGroup}>{compose.saved ? <><Check size={14} />Saved</> : <><Users size={14} />Save group</>}</button>
        </div>
        <div className="login-foot" style={{ marginTop: 10 }}>Outlook opens with everyone, the subject, and your message filled in. Images can't auto-attach through the link yet, so they're copied to your clipboard to paste in (or download &amp; attach) — true attachments send automatically with the backend.</div>
      </div>
    </div>
  );
}

/* ---------------- Task card ---------------- */


/* ---------------- Calendar ---------------- */
/* ---------------- Tracker (Excel-style sheet) ---------------- */

export function TaskModal({ task, people, projects, onClose, onSave, onDelete }) {
  const [f, setF] = useState(task);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { if (!f.title.trim()) return; const { _new, ...rest } = f; onSave(rest); };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>{task._new ? "New task" : "Edit task"}</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="fld"><label>Task</label><input autoFocus value={f.title} onChange={e => set("title", e.target.value)} placeholder="What needs doing?" /></div>
        <div className="fld"><label>Notes</label><textarea value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional details…" /></div>
        <div className="row2">
          <div className="fld"><label>Assignee</label><select value={f.assigneeId} onChange={e => set("assigneeId", e.target.value)}><option value="">Unassigned</option>{people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="fld"><label>Project</label><select value={f.projectId} onChange={e => set("projectId", e.target.value)}><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        </div>
        <div className="row2">
          <div className="fld"><label>Start date</label><input type="date" value={f.start || ""} onChange={e => set("start", e.target.value)} /></div>
          <div className="fld"><label>Due date</label><input type="date" value={f.due || ""} onChange={e => set("due", e.target.value)} /></div>
        </div>
        <div className="row2">
          <div className="fld"><label>Status</label><select value={f.status} onChange={e => set("status", e.target.value)}><option value="todo">To do</option><option value="doing">In progress</option><option value="done">Done</option></select></div>
          <div className="fld"><label>Priority</label>
            <div className="pri-pick">
              {["low", "med", "high"].map(p => <button key={p} className={f.priority === p ? "on" : ""} onClick={() => set("priority", p)}><span style={{ width: 8, height: 8, borderRadius: 99, background: PRIO[p], display: "inline-block" }} />{p}</button>)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-pri" style={{ flex: 1, justifyContent: "center" }} onClick={save}><Check size={16} />Save</button>
          {onDelete && <button className="btn" onClick={onDelete}><Trash2 size={15} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Person modal ---------------- */

export function PersonModal({ person, onClose, onSave }) {
  const [f, setF] = useState(person);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { if (!f.name.trim()) return; const { _new, ...rest } = f; onSave(rest); };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>{person._new ? "Add person" : "Edit person"}</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="fld"><label>Name</label><input autoFocus value={f.name} onChange={e => set("name", e.target.value)} placeholder="Full name" /></div>
        <div className="fld"><label>Role</label><input value={f.role} onChange={e => set("role", e.target.value)} placeholder="e.g. Designer, Lead, Developer" /></div>
        <div className="fld"><label>Email (for Outlook)</label><input value={f.email} onChange={e => set("email", e.target.value)} placeholder="name@rtmec.com" /></div>
        <div className="fld"><label>Color</label><div className="swatches">{PALETTE.map(c => <span key={c} className={`swatch ${f.color === c ? "on" : ""}`} style={{ background: c }} onClick={() => set("color", c)} />)}</div></div>
        <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={save}><Check size={16} />Save</button>
      </div>
    </div>
  );
}

/* ---------------- Project modal ---------------- */

export function ProjectModal({ project, onClose, onSave }) {
  const [f, setF] = useState(project);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => { if (!f.name.trim()) return; const { _new, ...rest } = f; onSave(rest); };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>{project._new ? "Add project" : "Edit project"}</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="fld"><label>Project name</label><input autoFocus value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Website Refresh" /></div>
        <div className="fld"><label>Color</label><div className="swatches">{PALETTE.map(c => <span key={c} className={`swatch ${f.color === c ? "on" : ""}`} style={{ background: c }} onClick={() => set("color", c)} />)}</div></div>
        <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={save}><Check size={16} />Save</button>
      </div>
    </div>
  );
}


export function ProfileModal({ user, onClose, onSave }) {
  const [about, setAbout] = useState(user.about || "");
  const [color, setColor] = useState(user.color || "#6E83A2");
  const [avatar, setAvatar] = useState(user.avatar || null);
  const [bg, setBg] = useState(user.bg || "");
  const [email, setEmail] = useState(user.email || "");
  const fileRef = useRef(null);
  const pickPhoto = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { alert("Please choose an image under ~1.5 MB."); return; }
    const r = new FileReader(); r.onload = () => { setAvatar(r.result); onSave({ avatar: r.result }); }; r.readAsDataURL(file);
  };
  const preview = { name: user.name, color, avatar };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>Your profile</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <UserAv u={preview} size={64} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button className="btn btn-sm" onClick={() => fileRef.current && fileRef.current.click()}><Plus size={13} />Upload photo</button>
            {avatar && <button className="btn btn-ghost btn-sm" style={{ color: "#ff8a8c" }} onClick={() => { setAvatar(null); onSave({ avatar: null }); }}><X size={13} />Remove photo</button>}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pickPhoto} />
          </div>
        </div>
        {!avatar && <div className="fld"><label>Avatar color</label><div className="swatches">{["#6E83A2", ...PALETTE].map(c => <span key={c} className={`swatch ${color === c ? "on" : ""}`} style={{ background: c }} onClick={() => { setColor(c); onSave({ color: c }); }} />)}</div></div>}
        <div className="fld"><label>Email (set from your login — change it if you like)</label><input value={email} onChange={e => { setEmail(e.target.value); onSave({ email: e.target.value.trim() }); }} placeholder="you@company.com" /></div>
        <div className="fld"><label>About you</label><textarea value={about} onChange={e => { setAbout(e.target.value); onSave({ about: e.target.value }); }} placeholder="Role, what you handle, anything your team should know…" /></div>
        <div className="fld"><label>App background color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {BG_PRESETS.map(p => (
              <button key={p.name} className="btn btn-sm" onClick={() => { setBg(p.css); onSave({ bg: p.css }); }} style={{ borderColor: bg === p.css ? "var(--teal)" : "var(--line2)", color: bg === p.css ? "var(--teal)" : "var(--muted)" }}>
                <span style={{ width: 13, height: 13, borderRadius: 4, background: p.css || "var(--line2)", border: "1px solid var(--line2)" }} />{p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="login-foot" style={{ marginBottom: 8 }}>Changes save automatically.</div>
        <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}><Check size={16} />Done</button>
      </div>
    </div>
  );
}

/* ---------------- Sign in ---------------- */

export function TeamEmailModal({ project, members, fromUser, onClose, onSend }) {
  const withEmail = members.filter(m => m.email);
  const [selected, setSelected] = useState(() => new Set(withEmail.map(m => m.id)));
  const [mode, setMode] = useState("to");
  const [subject, setSubject] = useState(`[${project.name}] `);
  const [body, setBody] = useState("");
  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = selected.size === withEmail.length && withEmail.length > 0;
  const send = () => {
    const emails = withEmail.filter(m => selected.has(m.id)).map(m => m.email);
    if (!emails.length) return;
    onSend({ toEmails: mode === "to" ? emails : [], ccEmails: mode === "cc" ? emails : [], subject, body });
  };
  return (
    <div className="ov" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h"><h2>Email team — {project.name}</h2><button className="btn btn-ghost icon-btn" onClick={onClose}><X size={18} /></button></div>
        <div className="from-line"><Mail size={14} /> Sending from <b>{fromUser?.email}</b> — always from you, never anyone else.</div>
        {withEmail.length === 0 ? (
          <div className="empty-sm" style={{ paddingBottom: 16 }}>Nobody on this project has an email saved yet. Add emails in the Team tab first.</div>
        ) : (
          <>
            <div className="fld" style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ marginBottom: 0 }}>Recipients</label>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(allOn ? new Set() : new Set(withEmail.map(m => m.id)))}>{allOn ? "Clear all" : "Select all"}</button>
              </div>
            </div>
            <div className="rcp" style={{ marginBottom: 13 }}>
              {withEmail.map(m => {
                const on = selected.has(m.id);
                return (
                  <div className="rcp-row" key={m.id} onClick={() => toggle(m.id)}>
                    <span className={`rcp-box ${on ? "on" : ""}`}>{on && <Check size={12} />}</span>
                    <span className="rcp-av" style={{ background: m.color }}>{initials(m.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}><div className="rcp-name">{m.name}</div><div className="rcp-role">{m.role || "—"} · {m.email}</div></div>
                  </div>
                );
              })}
            </div>
            <div className="fld"><label>Add everyone selected to</label>
              <div className="mode-pick">
                <button className={mode === "to" ? "on" : ""} onClick={() => setMode("to")}>To</button>
                <button className={mode === "cc" ? "on" : ""} onClick={() => setMode("cc")}>CC</button>
              </div>
            </div>
            <div className="fld"><label>Subject</label><input value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div className="fld"><label>Message</label><textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your update…" /></div>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={send}><Send size={16} /> Open in Outlook — {selected.size} {selected.size === 1 ? "person" : "people"}</button>
            <div className="login-foot" style={{ marginTop: 12 }}>Opens an Outlook email with everyone filled in. The live version sends it silently.</div>
          </>
        )}
      </div>
    </div>
  );
}
