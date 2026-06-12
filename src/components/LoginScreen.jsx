// Sign-in gate (Microsoft-styled preview sign-in).
import { useState } from "react";
import { LayoutGrid, Check, ShieldCheck } from "lucide-react";

function MicrosoftLogo() {
  return (<span className="ms-logo"><span style={{ background: "#F25022" }} /><span style={{ background: "#7FBA00" }} /><span style={{ background: "#00A4EF" }} /><span style={{ background: "#FFB900" }} /></span>);
}

export function LoginScreen({ onSignIn }) {
  const [step, setStep] = useState("start");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const finish = () => {
    const display = name.trim() || (email.split("@")[0] || "You").replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    onSignIn({ name: display, email: email.trim() || "you@rtmec.com" });
  };
  return (
    <div className="login">
      <div className="login-card">
        <span className="demo-tag"><ShieldCheck size={13} />Preview sign-in</span>
        <div className="login-mark"><LayoutGrid size={26} /></div>
        <h1>Cadence</h1>
        <p>Sign in with your rtmec Microsoft account to continue.</p>
        {step === "start" ? (
          <>
            <button className="ms-btn" onClick={() => setStep("account")}><MicrosoftLogo /> Sign in with Microsoft</button>
            <div className="login-foot"><ShieldCheck size={13} /> Only @rtmec.com accounts — no separate password.</div>
          </>
        ) : (
          <div style={{ textAlign: "left" }}>
            <div className="fld"><label>Work email</label><input autoFocus type="email" placeholder="you@rtmec.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && finish()} /></div>
            <div className="fld"><label>Your name</label><input placeholder="First Last" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && finish()} /></div>
            <div className="rem" onClick={() => setRemember(r => !r)}><span className={`rb ${remember ? "on" : ""}`}>{remember && <Check size={12} />}</span>Remember me on this device</div>
            <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={finish}><Check size={16} /> Continue</button>
            <div className="login-foot" style={{ marginTop: 14 }}>In the live version this is the real Microsoft login — it fills in automatically.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Email the whole team ---------------- */
