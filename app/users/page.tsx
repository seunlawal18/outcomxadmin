"use client";
import { useEffect, useState } from "react";
import { apiAdminGetUsers, apiAdminGetStats, ApiUser } from "@/lib/api";
import { parseApiDate } from "@/lib/types";
import { useCurrency } from "@/lib/useCurrency";
import { Users, TrendingUp, DollarSign, Activity, UserCheck } from "lucide-react";

const avatarColors = [
  "#6366f1","#10b981","#f59e0b","#ec4899","#3b82f6","#8b5cf6","#059669",
];

export default function UsersPage() {
  const { fmt, symbol } = useCurrency();
  const [users, setUsers]     = useState<ApiUser[]>([]);
  const [totalTrades, setTotalTrades] = useState(0);
  const [activeTraders, setActiveTraders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    Promise.all([apiAdminGetUsers(), apiAdminGetStats()]).then(([usersRes, statsRes]) => {
      if (usersRes.ok && usersRes.data) setUsers(usersRes.data);
      else setError(usersRes.error ?? "Failed to load users");
      if (statsRes.ok && statsRes.data) {
        setTotalTrades(statsRes.data.totalTrades);
        setActiveTraders(statsRes.data.activeTraders);
      }
      setLoading(false);
    });
  }, []);

  const avgBalance = users.length
    ? Math.round(users.reduce((s, u) => s + u.balance, 0) / users.length)
    : 0;

  const stats = [
    { label: "Total Users",    value: users.length,  color: "#6366f1", icon: <Users size={20} /> },
    { label: "Active Traders", value: activeTraders, color: "var(--emerald)", icon: <Activity size={20} /> },
    { label: "Avg Balance",    value: `${symbol}${avgBalance.toLocaleString()}`, color: "#f59e0b", icon: <DollarSign size={20} /> },
    { label: "Total Trades",   value: totalTrades,   color: "#ec4899", icon: <UserCheck size={20} /> },
  ];

  return (
    <div style={{ padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "linear-gradient(135deg, #ec4899, #db2777)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Users size={22} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Users</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Real accounts from the database</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 20, background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `${s.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: s.color,
              }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px 180px 110px 100px",
          padding: "11px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-primary)",
        }}>
          {["User", "Wallet", "Email", "Joined", "Balance"].map((h) => (
            <span key={h} style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>No users yet</div>
        ) : (
          users.map((user, i) => (
            <div
              key={user.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 180px 110px 100px",
                padding: "13px 20px",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: avatarColors[i % avatarColors.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, fontWeight: 600 }}>
                    {user.name}
                    {user.isAdmin && (
                      <span style={{ marginLeft: 7, fontSize: 10, background: "var(--emerald-bg)", color: "var(--emerald)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                        ADMIN
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>@{user.username}</p>
                </div>
              </div>

              <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                {user.walletAddress ? `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}` : "—"}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{user.email}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{parseApiDate(user.joinedAt).toLocaleDateString()}</span>
              <span style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 700 }}>{fmt(user.balance)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
