"use client";
import { useEffect, useState, useCallback } from "react";
import {
  apiAdminGetWithdrawals, apiAdminApproveWithdrawal, apiAdminRejectWithdrawal, apiAdminCompleteWithdrawal,
  ApiWithdrawalRequest,
} from "@/lib/api";
import { parseApiDate } from "@/lib/types";
import { useCurrency } from "@/lib/useCurrency";
import { toast } from "@/lib/toastStore";
import { Banknote, Clock, CheckCircle2, XCircle, Copy, Send, ExternalLink } from "lucide-react";

type FilterStatus = "pending" | "approved" | "rejected" | "all";

// Set via NEXT_PUBLIC_EXPLORER_BASE_URL in .env.local (mainnet Polygonscan
// now that real funds are live) — this fallback is only hit if that's unset.
const EXPLORER_BASE = process.env.NEXT_PUBLIC_EXPLORER_BASE_URL ?? "https://amoy.polygonscan.com";

const STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  approved:  "var(--emerald)",
  rejected:  "var(--red)",
  completed: "#6366f1",
};

export default function WithdrawalsPage() {
  const { fmt } = useCurrency();
  const [requests, setRequests] = useState<ApiWithdrawalRequest[]>([]);
  const [filter, setFilter]     = useState<FilterStatus>("pending");
  const [loading, setLoading]   = useState(true);
  const [busyId, setBusyId]     = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [txHashInput, setTxHashInput]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiAdminGetWithdrawals(filter === "all" ? undefined : filter).then(res => {
      if (res.ok && res.data) setRequests(res.data);
      else toast(res.error ?? "Failed to load withdrawal requests", "error");
      setLoading(false);
    });
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: number) => {
    setBusyId(id);
    const res = await apiAdminApproveWithdrawal(id);
    if (res.ok) { toast("Withdrawal approved — awaiting manual fund transfer"); load(); }
    else toast(res.error ?? "Failed to approve", "error");
    setBusyId(null);
  };

  const handleReject = async (id: number) => {
    setBusyId(id);
    const res = await apiAdminRejectWithdrawal(id);
    if (res.ok) { toast("Withdrawal rejected — balance refunded"); load(); }
    else toast(res.error ?? "Failed to reject", "error");
    setBusyId(null);
  };

  const handleComplete = async (id: number) => {
    if (!txHashInput.trim()) { toast("Enter the transaction hash", "error"); return; }
    setBusyId(id);
    const res = await apiAdminCompleteWithdrawal(id, txHashInput.trim());
    if (res.ok) { toast("Marked as sent — user notified"); setCompletingId(null); setTxHashInput(""); load(); }
    else toast(res.error ?? "Failed to mark as sent", "error");
    setBusyId(null);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard?.writeText(address).catch(() => {});
    toast("Address copied");
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const pendingTotal = requests.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);

  return (
    <div style={{ padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Banknote size={22} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Withdrawals</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            {filter === "pending" ? `${pendingCount} pending request${pendingCount !== 1 ? "s" : ""}` : `${requests.length} request${requests.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {filter === "pending" && pendingCount > 0 && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 18, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", fontSize: 13, color: "#f59e0b" }}>
          <strong>{fmt(pendingTotal)}</strong> locked across pending requests, awaiting review.
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
              textTransform: "capitalize", border: "1px solid",
              borderColor: filter === f ? "var(--emerald)" : "var(--border)",
              background: filter === f ? "var(--emerald-bg)" : "var(--bg-card-hover)",
              color: filter === f ? "var(--emerald)" : "var(--text-secondary)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 90px 1fr 110px 100px 230px",
          padding: "11px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-primary)",
        }}>
          {["User", "Amount", "Destination", "Status", "Requested", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
            No {filter !== "all" ? filter : ""} withdrawal requests
          </div>
        ) : (
          requests.map(r => (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 90px 1fr 110px 100px 230px",
                padding: "13px 20px",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, fontWeight: 600 }}>{r.username}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{r.userEmail}</p>
              </div>

              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{fmt(r.amount)}</span>

              <div
                onClick={() => copyAddress(r.destinationAddress)}
                style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                title="Click to copy full address"
              >
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                  {r.destinationAddress.slice(0, 8)}…{r.destinationAddress.slice(-6)}
                </span>
                <Copy size={11} color="var(--text-muted)" />
              </div>

              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4, width: "fit-content",
                fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase",
                background: `${STATUS_COLORS[r.status]}18`, color: STATUS_COLORS[r.status],
              }}>
                {r.status === "pending" && <Clock size={10} />}
                {r.status === "approved" && <CheckCircle2 size={10} />}
                {r.status === "rejected" && <XCircle size={10} />}
                {r.status === "completed" && <Send size={10} />}
                {r.status}
              </span>

              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {parseApiDate(r.createdAt).toLocaleString()}
              </span>

              {r.status === "pending" ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={busyId === r.id}
                    className="btn-emerald"
                    style={{ padding: "6px 12px", fontSize: 12, borderRadius: 7 }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={busyId === r.id}
                    style={{
                      padding: "6px 12px", fontSize: 12, borderRadius: 7, fontWeight: 700, cursor: "pointer",
                      background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)",
                    }}
                  >
                    Reject
                  </button>
                </div>
              ) : r.status === "approved" ? (
                completingId === r.id ? (
                  <div style={{ display: "flex", gap: 5 }}>
                    <input
                      autoFocus
                      className="input-dark"
                      placeholder="0x tx hash"
                      value={txHashInput}
                      onChange={e => setTxHashInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleComplete(r.id)}
                      style={{ fontSize: 11, fontFamily: "monospace", padding: "6px 8px", width: 130 }}
                    />
                    <button
                      onClick={() => handleComplete(r.id)}
                      disabled={busyId === r.id}
                      className="btn-emerald"
                      style={{ padding: "6px 9px", fontSize: 11, borderRadius: 7 }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => { setCompletingId(null); setTxHashInput(""); }}
                      style={{ padding: "6px 9px", fontSize: 11, borderRadius: 7, cursor: "pointer", background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setCompletingId(r.id); setTxHashInput(""); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "6px 12px", fontSize: 12, borderRadius: 7, fontWeight: 700, cursor: "pointer",
                      background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#6366f1",
                    }}
                  >
                    <Send size={11} /> Mark Sent
                  </button>
                )
              ) : r.status === "completed" && r.txHash ? (
                <div>
                  <a
                    href={`${EXPLORER_BASE}/tx/${r.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--emerald)", textDecoration: "none" }}
                  >
                    {r.txHash.slice(0, 8)}…{r.txHash.slice(-6)} <ExternalLink size={10} />
                  </a>
                  {r.resolvedByUsername && (
                    <span style={{ fontSize: 10, color: "var(--text-secondary)", display: "block" }}>
                      sent by {r.resolvedByUsername}
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
                    {r.resolvedAt ? parseApiDate(r.resolvedAt).toLocaleDateString() : "—"}
                  </span>
                  {r.resolvedByUsername && (
                    <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                      by {r.resolvedByUsername}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
