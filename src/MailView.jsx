import { useState, useEffect, useCallback } from "react";
import { Mail, Inbox, Send, RefreshCw, LogOut, ChevronLeft, Search, Paperclip, Star, AlertCircle } from "lucide-react";

/* ================================================================
 *  Outlook Mail View — Microsoft Graph API + MSAL
 *  Requires: VITE_AZURE_CLIENT_ID in .env
 * ================================================================ */

const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || "";
const SCOPES = ["Mail.Read", "Mail.Send", "User.Read"];
const GRAPH = "https://graph.microsoft.com/v1.0";

/* ---- tiny MSAL-less OAuth via popup ---- */
function buildAuthUrl(clientId, redirectUri) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "token",
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    response_mode: "fragment",
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

function parseHashToken(hash) {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const token = p.get("access_token");
  const expiresIn = parseInt(p.get("expires_in") || "3600", 10);
  if (!token) return null;
  return { token, expiresAt: Date.now() + expiresIn * 1000 };
}

function useOutlookAuth() {
  const [auth, setAuth] = useState(() => {
    try {
      const v = sessionStorage.getItem("cad_outlook_auth");
      if (v) {
        const parsed = JSON.parse(v);
        if (parsed.expiresAt > Date.now()) return parsed;
      }
    } catch {}
    return null;
  });

  const signIn = useCallback(() => {
    if (!CLIENT_ID) { alert("Add VITE_AZURE_CLIENT_ID to your .env file first."); return; }
    const redirect = `${window.location.origin}/outlook-callback.html`;
    const url = buildAuthUrl(CLIENT_ID, redirect);
    const popup = window.open(url, "outlook_auth", "width=520,height=620,left=200,top=100");

    const timer = setInterval(() => {
      try {
        if (!popup || popup.closed) { clearInterval(timer); return; }
        const hash = popup.location.hash;
        if (hash && hash.includes("access_token")) {
          clearInterval(timer);
          popup.close();
          const result = parseHashToken(hash);
          if (result) {
            sessionStorage.setItem("cad_outlook_auth", JSON.stringify(result));
            setAuth(result);
          }
        }
      } catch {}
    }, 300);
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem("cad_outlook_auth");
    setAuth(null);
  }, []);

  const token = auth && auth.expiresAt > Date.now() ? auth.token : null;
  return { token, signIn, signOut };
}

async function graphFetch(token, path, opts = {}) {
  const res = await fetch(`${GRAPH}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`Graph ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ---- helpers ---- */
function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (now - d < 7 * 86400000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function initials(name) {
  return (name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const FOLDER_LABELS = { inbox: "Inbox", sentitems: "Sent", drafts: "Drafts", deleteditems: "Deleted" };

/* ================================================================
 *  Main export
 * ================================================================ */
export default function MailView() {
  const { token, signIn, signOut } = useOutlookAuth();
  const [profile, setProfile] = useState(null);
  const [folder, setFolder] = useState("inbox");
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [body, setBody] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [unread, setUnread] = useState({});

  /* load profile once */
  useEffect(() => {
    if (!token) return;
    graphFetch(token, "/me").then(setProfile).catch(() => {});
  }, [token]);

  /* load messages when folder changes */
  const loadMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null); setSelected(null); setBody(null);
    try {
      const path = folder === "inbox" || folder === "sentitems" || folder === "drafts" || folder === "deleteditems"
        ? `/me/mailFolders/${folder}/messages?$top=40&$select=id,subject,from,toRecipients,receivedDateTime,sentDateTime,isRead,hasAttachments,bodyPreview,importance`
        : `/me/messages?$top=40&$select=id,subject,from,toRecipients,receivedDateTime,sentDateTime,isRead,hasAttachments,bodyPreview,importance&$search="${q}"`;
      const data = await graphFetch(token, path);
      setMessages(data.value || []);
      /* unread counts */
      const counts = {};
      ["inbox", "drafts"].forEach(async (f) => {
        try {
          const r = await graphFetch(token, `/me/mailFolders/${f}?$select=unreadItemCount`);
          counts[f] = r.unreadItemCount;
          setUnread(prev => ({ ...prev, [f]: r.unreadItemCount }));
        } catch {}
      });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [token, folder, q]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  /* load message body */
  const openMessage = useCallback(async (msg) => {
    setSelected(msg);
    setBody(null);
    try {
      const full = await graphFetch(token, `/me/messages/${msg.id}?$select=body,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,isRead`);
      setBody(full.body?.content || "");
      /* mark read */
      if (!msg.isRead) {
        await graphFetch(token, `/me/messages/${msg.id}`, { method: "PATCH", body: JSON.stringify({ isRead: true }) });
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      }
    } catch {}
  }, [token]);

  /* search */
  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) { setFolder("search"); loadMessages(); }
  };

  if (!token) return <SignInScreen onSignIn={signIn} hasClientId={!!CLIENT_ID} />;

  const filtered = folder !== "search" && q
    ? messages.filter(m => (m.subject || "").toLowerCase().includes(q.toLowerCase()) || (m.from?.emailAddress?.name || "").toLowerCase().includes(q.toLowerCase()))
    : messages;

  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 70px)", overflow: "hidden", borderRadius: 18, border: "1px solid var(--line)", background: "var(--panel)" }}>

      {/* sidebar */}
      <div style={{ width: 200, borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--primary)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {initials(profile?.displayName)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.displayName || "..."}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.mail || profile?.userPrincipalName || ""}</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { id: "inbox", label: "Inbox", Icon: Inbox },
            { id: "sentitems", label: "Sent", Icon: Send },
            { id: "drafts", label: "Drafts", Icon: Mail },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { setFolder(id); setQ(""); }}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 10, border: "none", background: folder === id ? "var(--primary)" : "transparent", color: folder === id ? "#fff" : "var(--muted)", cursor: "pointer", fontFamily: "Outfit", fontSize: 13.5, fontWeight: 600, textAlign: "left" }}>
              <Icon size={15} />
              <span style={{ flex: 1 }}>{label}</span>
              {unread[id] > 0 && <span style={{ background: folder === id ? "rgba(255,255,255,.25)" : "var(--primary)", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "1px 6px" }}>{unread[id]}</span>}
            </button>
          ))}
        </nav>

        <button onClick={signOut} style={{ margin: "0 8px 12px", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, border: "none", background: "transparent", color: "var(--dim)", cursor: "pointer", fontFamily: "Outfit", fontSize: 13, fontWeight: 500 }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {/* message list */}
      <div style={{ width: 320, borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 12px 10px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
          <form onSubmit={handleSearch} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 9, padding: "5px 10px" }}>
            <Search size={13} style={{ color: "var(--dim)", flexShrink: 0 }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search mail…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--ink)", fontFamily: "Outfit", fontSize: 13 }} />
          </form>
          <button onClick={loadMessages} title="Refresh" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "grid", placeItems: "center", padding: 4 }}>
            <RefreshCw size={15} className={loading ? "spin" : ""} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && <div style={{ padding: 20, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>Loading…</div>}
          {error && <div style={{ padding: 16, color: "var(--primary)", fontSize: 13 }}><AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />{error}</div>}
          {!loading && filtered.length === 0 && <div style={{ padding: 20, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>No messages</div>}
          {filtered.map(msg => (
            <MessageRow key={msg.id} msg={msg} selected={selected?.id === msg.id} onClick={() => openMessage(msg)} />
          ))}
        </div>
      </div>

      {/* reading pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--dim)", flexDirection: "column", gap: 10 }}>
            <Mail size={40} strokeWidth={1} />
            <div style={{ fontSize: 14 }}>Select a message to read</div>
          </div>
        ) : (
          <ReadingPane msg={selected} body={body} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

function MessageRow({ msg, selected, onClick }) {
  const sender = msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || "Unknown";
  const date = fmtDate(msg.receivedDateTime || msg.sentDateTime);
  return (
    <button onClick={onClick} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", borderBottom: "1px solid var(--line)", border: "none", background: selected ? "var(--raise)" : "transparent", cursor: "pointer", borderLeft: selected ? "3px solid var(--primary)" : "3px solid transparent" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{ fontSize: 13, fontWeight: msg.isRead ? 500 : 700, color: msg.isRead ? "var(--muted)" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{sender}</span>
        <span style={{ fontSize: 11, color: "var(--dim)", flexShrink: 0, marginLeft: 8 }}>{date}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: msg.isRead ? 400 : 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{msg.subject || "(no subject)"}</div>
      <div style={{ fontSize: 12, color: "var(--dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
        {msg.hasAttachments && <Paperclip size={11} style={{ flexShrink: 0 }} />}
        {msg.bodyPreview}
      </div>
    </button>
  );
}

function ReadingPane({ msg, body, onClose }) {
  const sender = msg.from?.emailAddress;
  const to = (msg.toRecipients || []).map(r => r.emailAddress?.address).join(", ");
  const date = msg.receivedDateTime || msg.sentDateTime;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Fraunces", fontSize: 18, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>{msg.subject || "(no subject)"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--teal)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
              {initials(sender?.name)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{sender?.name || sender?.address}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{sender?.address} → {to}</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--dim)" }}>{date ? new Date(date).toLocaleString() : ""}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {body === null
          ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div>
          : body.startsWith("<")
            ? <iframe srcDoc={body} style={{ width: "100%", height: "100%", border: "none", minHeight: 400, background: "#fff", borderRadius: 10 }} sandbox="allow-same-origin" title="email body" />
            : <pre style={{ fontFamily: "Outfit", fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--ink)" }}>{body}</pre>
        }
      </div>
    </div>
  );
}

function SignInScreen({ onSignIn, hasClientId }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 18, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--primary)", display: "grid", placeItems: "center", color: "#fff" }}>
        <Mail size={30} />
      </div>
      <div>
        <div style={{ fontFamily: "Fraunces", fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Outlook Mail</div>
        <div style={{ color: "var(--muted)", fontSize: 14, maxWidth: 340 }}>Sign in with your Microsoft account to view and send emails directly in Cadence.</div>
      </div>
      {!hasClientId && (
        <div style={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 18px", maxWidth: 400, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--amber)" }}>Setup required:</strong> Add <code style={{ background: "var(--raise)", padding: "1px 5px", borderRadius: 4 }}>VITE_AZURE_CLIENT_ID=your_id</code> to a <code style={{ background: "var(--raise)", padding: "1px 5px", borderRadius: 4 }}>.env</code> file in your project root. See the README for Azure setup steps.
        </div>
      )}
      <button onClick={onSignIn} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 28px", borderRadius: 13, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "Outfit", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(224,58,62,.3)" }}>
        <Mail size={18} /> Sign in with Outlook
      </button>
    </div>
  );
}
