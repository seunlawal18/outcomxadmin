"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";

const ADMIN_EMAIL = "admin@outcomx.com";

export default function AdminLoginForm() {
  const { adminLogin } = useStore();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const res = await adminLogin(ADMIN_EMAIL, password);
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 20, padding: "40px 36px", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Logo size={44} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <ShieldCheck size={13} color="var(--emerald)" />
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Admin Dashboard</p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Admin Password
          </label>
          <div style={{ position: "relative" }}>
            <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="input-dark"
              type={showPw ? "text" : "password"}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ paddingLeft: 40, paddingRight: 44, fontSize: 15 }}
            />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: "9px 12px", borderRadius: 8, marginBottom: 14, background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button className="btn-emerald" onClick={handleLogin} disabled={loading || !password} style={{ width: "100%", fontSize: 15, padding: "13px", borderRadius: 10 }}>
          {loading ? "Authenticating…" : "Login to Admin"}
        </button>
      </div>
    </div>
  );
}
