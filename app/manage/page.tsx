"use client";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Market, MarketCategory, DURATION_LABELS } from "@/lib/types";
import {
  Pencil, Trash2, Power, PowerOff, Search, X, Save,
  ListFilter, Clock, CheckCircle2, XCircle, ImagePlus,
  RefreshCw, AlertCircle, Star, Clapperboard,
} from "lucide-react";
import Countdown from "@/components/Countdown";
import { toast } from "@/lib/toastStore";

// ─────────────────────────────────────────────────────────────────
// Featured Slots Summary Panel
// ─────────────────────────────────────────────────────────────────
function FeaturedSlotsPanel({
  markets,
  onRemove,
  onEditSlot,
}: {
  markets: Market[];
  onRemove: (m: Market) => void;
  onEditSlot: (m: Market) => void;
}) {
  const occupied = markets
    .filter(m => m.featured)
    .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99));

  // Show all occupied slots + empty slots up to max+2, minimum 5
  const maxSlot = Math.max(5, ...occupied.map(m => m.featuredOrder ?? 0)) + 2;
  const slots = Array.from({ length: maxSlot }, (_, i) => i + 1);

  return (
    <div className="card" style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "12px 18px",
        background: "linear-gradient(135deg, #f59e0b18, #f59e0b08)",
        borderBottom: "1px solid #f59e0b33",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Clapperboard size={15} color="#f59e0b" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Hero Slideshow Slots</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 2 }}>
          {occupied.length} occupied · {maxSlot - occupied.length} available
        </span>
      </div>
      <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        {slots.map(slot => {
          const m = occupied.find(f => f.featuredOrder === slot);
          return (
            <div key={slot} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8,
              background: m ? "#f59e0b08" : "var(--bg-card-hover)",
              border: `1px solid ${m ? "#f59e0b33" : "var(--border)"}`,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: m ? (m.status === "open" ? "#10b981" : "#6b7280") : "#3f3f46",
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: m ? "#f59e0b" : "var(--text-muted)", minWidth: 44 }}>
                Slot {slot}
              </span>
              {m ? (
                <>
                  <span style={{ fontSize: 12, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.title}
                  </span>
                  {m.heroTag && (
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: `${m.heroAccent ?? "#f59e0b"}22`, color: m.heroAccent ?? "#f59e0b", fontWeight: 700, flexShrink: 0 }}>
                      {m.heroTag}
                    </span>
                  )}
                  <button onClick={() => onEditSlot(m)}
                    style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>Edit</button>
                  <button onClick={() => onRemove(m)}
                    style={{ fontSize: 11, fontWeight: 600, color: "var(--red)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--red-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>Remove</button>
                </>
              ) : (
                <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>— available —</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Hero Slideshow Editor (inside edit row)
// ─────────────────────────────────────────────────────────────────
function HeroSlideshowEditor({
  market,
  allMarkets,
  onSave,
}: {
  market: Market;
  allMarkets: Market[];
  onSave: (featured: boolean, order: number, tag: string, sub: string, accent: string, heroBanner: string, heroHref: string) => Promise<void>;
}) {
  const [featured,       setFeatured]       = useState(market.featured ?? false);
  const [order,          setOrder]          = useState(market.featuredOrder ?? 1);
  const [tag,            setTag]            = useState(market.heroTag ?? "");
  const [sub,            setSub]            = useState(market.heroSub ?? "");
  const [accent,         setAccent]         = useState(market.heroAccent ?? "#10b981");
  const [heroBanner,     setHeroBanner]     = useState(market.heroBanner ?? "");
  const [heroHref,       setHeroHref]       = useState(market.heroHref ?? "");
  const [saving,         setSaving]         = useState(false);
  const [bannerDragging, setBannerDragging] = useState(false);
  const colorRef       = useRef<HTMLInputElement>(null);
  const heroBannerRef  = useRef<HTMLInputElement>(null);

  const processBanner = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 4 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = e => setHeroBanner(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (featured) {
      const conflict = allMarkets.find(m => m.id !== market.id && m.featured && m.featuredOrder === order);
      if (conflict) {
        const t = conflict.title.length > 40 ? conflict.title.slice(0, 40) + "…" : conflict.title;
        if (!window.confirm(`Slot ${order} is already used by "${t}". Replace it?`)) return;
      }
    }
    setSaving(true);
    await onSave(featured, order, tag, sub, accent, heroBanner, heroHref);
    setSaving(false);
  };

  // Derived: background for the live preview
  const previewBg = heroBanner
    ? `url("${heroBanner}") center/cover no-repeat`
    : "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)";

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f59e0b44" }}>
      {/* Gradient header */}
      <div style={{ padding: "11px 16px", background: "linear-gradient(135deg, #f59e0b22, #f59e0b0a)", display: "flex", alignItems: "center", gap: 8 }}>
        <Clapperboard size={14} color="#f59e0b" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Hero Slideshow
        </span>
      </div>

      <div style={{ padding: "14px 16px", background: "var(--bg-primary)", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Feature toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: "#f59e0b", cursor: "pointer" }} />
          <span style={{ fontSize: 13, color: "var(--text-primary)" }}>Feature this market on the homepage</span>
        </label>

        {featured && (
          <>
            {/* Slot picker */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", margin: "0 0 8px" }}>
                Slot position
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Array.from({ length: Math.max(5, (market.featuredOrder ?? 0) + 2) }, (_, i) => i + 1).map(n => {
                  const takenBy = allMarkets.find(m => m.id !== market.id && m.featured && m.featuredOrder === n);
                  const active = order === n;
                  return (
                    <button key={n} onClick={() => setOrder(n)}
                      title={takenBy ? `Occupied: ${takenBy.title.slice(0, 30)}` : `Slot ${n} — available`}
                      style={{ position: "relative", width: 38, height: 38, borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1px solid ${active ? "#f59e0b" : "var(--border)"}`, background: active ? "#f59e0b" : "var(--bg-card-hover)", color: active ? "#000" : takenBy ? "#ef4444" : "var(--text-secondary)", transition: "all 0.15s" }}>
                      {n}
                      {takenBy && !active && (
                        <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid var(--bg-secondary)" }} />
                      )}
                    </button>
                  );
                })}
                <button onClick={() => setOrder(Math.max(5, (market.featuredOrder ?? 0) + 2) + 1)}
                  title="Use a higher slot"
                  style={{ width: 38, height: 38, borderRadius: 20, fontSize: 16, fontWeight: 700, cursor: "pointer", border: "1px dashed var(--border)", background: "var(--bg-card-hover)", color: "var(--text-muted)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#f59e0b"; (e.currentTarget as HTMLElement).style.color = "#f59e0b"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
                  +
                </button>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0" }}>Red = occupied · Click + to use a higher slot number</p>
            </div>

            {/* ── Hero Background Banner ── */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                Slide Background Image <span style={{ fontWeight: 400, textTransform: "none" }}>(replaces default gradient · 1200×400px · max 4MB)</span>
              </label>

              {heroBanner ? (
                /* ── Live hero preview ── */
                <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                  <div style={{ width: "100%", height: "clamp(100px, 14vw, 160px)", background: previewBg, position: "relative" }}>
                    {/* Gradient overlay — same as real hero */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)" }} />
                    {/* Simulated text overlay */}
                    <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", maxWidth: "60%" }}>
                      {tag && <span style={{ fontSize: 9, fontWeight: 800, color: accent, letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{tag}</span>}
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.3 }}>
                        {market.title.length > 50 ? market.title.slice(0, 50) + "…" : market.title}
                      </p>
                      {sub && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", margin: 0 }}>{sub}</p>}
                    </div>
                    {/* Preview label */}
                    <span style={{ position: "absolute", bottom: 6, right: 10, fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: "0.5px" }}>HERO PREVIEW</span>
                  </div>
                  {/* Controls bar */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-card-hover)", borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Custom background set</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => heroBannerRef.current?.click()}
                        style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer" }}>
                        Replace
                      </button>
                      <button onClick={() => setHeroBanner("")}
                        style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)", cursor: "pointer" }}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Upload drop zone ── */
                <div
                  onDragOver={e => { e.preventDefault(); setBannerDragging(true); }}
                  onDragLeave={() => setBannerDragging(false)}
                  onDrop={e => { e.preventDefault(); setBannerDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processBanner(f); }}
                  onClick={() => heroBannerRef.current?.click()}
                  style={{ border: `2px dashed ${bannerDragging ? "#f59e0b" : "var(--border)"}`, borderRadius: 10, cursor: "pointer", background: bannerDragging ? "#f59e0b08" : "var(--bg-card-hover)", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: "20px 16px", aspectRatio: "3/1" }}>
                  <ImagePlus size={20} color={bannerDragging ? "#f59e0b" : "var(--text-muted)"} />
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>Drop image or click to upload</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Recommended: 1200 × 400 px · Hero height: clamp(120px, 18vw, 200px)</p>
                </div>
              )}
              <input ref={heroBannerRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) processBanner(f); if (heroBannerRef.current) heroBannerRef.current.value = ""; }} />
            </div>

            {/* Tag label */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                Tag label <span style={{ fontWeight: 400, textTransform: "none" }}>(optional — e.g. 🔥 HOT MARKET)</span>
              </label>
              <input className="input-dark" value={tag} onChange={e => setTag(e.target.value)}
                placeholder="🔥 HOT MARKET" maxLength={40} style={{ fontSize: 13, width: "100%" }} />
            </div>

            {/* Subheadline */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                Slide subheadline <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <input className="input-dark" value={sub} onChange={e => setSub(e.target.value)}
                placeholder="Short description shown on the banner"
                maxLength={100} style={{ fontSize: 13, width: "100%" }} />
            </div>

            {/* Destination URL */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                Hero Destination URL <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <input className="input-dark" value={heroHref} onChange={e => setHeroHref(e.target.value)}
                placeholder="e.g. / or /?category=sports or /market/42"
                maxLength={200} style={{ fontSize: 13, width: "100%" }} />
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "5px 0 0" }}>
                Leave blank to default to this market's own page. Use <code style={{ background: "var(--bg-card-hover)", padding: "1px 4px", borderRadius: 3 }}>/?category=sports</code> to send users to a filtered view.
              </p>
            </div>

            {/* Accent color */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                Accent color <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => colorRef.current?.click()} style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: accent, border: "2px solid var(--border)", cursor: "pointer", padding: 0 }} title="Pick color" />
                <input ref={colorRef} type="color" value={accent} onChange={e => setAccent(e.target.value)}
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }} />
                <input className="input-dark" value={accent}
                  onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setAccent(e.target.value); }}
                  placeholder="#10b981" maxLength={7} style={{ fontSize: 13, width: 110, fontFamily: "monospace" }} />
                {["#10b981","#6366f1","#f59e0b","#ef4444","#3b82f6"].map(c => (
                  <button key={c} onClick={() => setAccent(c)} title={c}
                    style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: accent === c ? "2px solid white" : "2px solid transparent", cursor: "pointer", padding: 0, flexShrink: 0 }} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Save button */}
        <div>
          <button onClick={handleSave} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, background: "#f59e0b", border: "none", color: "#000", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            <Star size={13} fill="#000" color="#000" />
            {saving ? "Saving…" : "Save Hero Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function ManageMarketsPage() {
  const { markets, updateMarket, deleteMarket, toggleMarketStatus, fetchMarkets, featureMarket } = useStore();
  const [search, setSearch]               = useState("");
  const [editingId, setEditingId]         = useState<number | null>(null);
  const [editTitle, setEditTitle]         = useState("");
  const [editCategory, setEditCategory]   = useState<MarketCategory>("sports");
  const [editImage, setEditImage]         = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [statusFilter, setStatusFilter]   = useState<"all"|"open"|"closed"|"settled">("all");
  const [actionError, setActionError]     = useState<string>("");
  const [refreshing, setRefreshing]       = useState(false);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => { handleRefresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const filtered = markets.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const startEdit = (m: Market) => {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditCategory(m.category);
    setEditImage(m.image || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await updateMarket(editingId, { title: editTitle, category: editCategory, image: editImage || undefined });
    if (res.ok) { setEditingId(null); toast("Market updated"); }
    else toast(res.error, "error");
  };

  const handleDelete = async (id: number) => {
    setActionError("");
    const res = await deleteMarket(id);
    setConfirmDelete(null);
    if (res.ok) toast("Market deleted");
    else { setActionError(res.error); toast(res.error, "error"); }
  };

  const handleToggle = async (m: Market) => {
    const res = await toggleMarketStatus(m.id);
    if (res.ok) toast(m.status === "open" ? "Market closed" : "Market opened");
    else toast(res.error, "error");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await fetchMarkets();
    if (!res.ok) setActionError(res.error);
    setRefreshing(false);
  };

  const handleFeatureSave = async (market: Market, featured: boolean, order: number, tag: string, sub: string, accent: string, heroBanner: string, heroHref: string) => {
    const res = await featureMarket(
      market.id, featured,
      featured ? order : undefined,
      tag || undefined,
      sub || undefined,
      accent || undefined,
      heroBanner || undefined,
      heroHref || undefined,
    );
    if (res.ok) {
      toast(featured ? `⭐ Slot ${order} set — hero updated` : "Removed from hero slideshow");
    } else {
      toast(res.error, "error");
    }
  };

  const handleRemoveFeature = async (m: Market) => {
    const res = await featureMarket(m.id, false);
    if (res.ok) toast("Removed from hero slideshow");
    else toast(res.error, "error");
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = e => setEditImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const categories: MarketCategory[] = ["sports","crypto","politics","finance","esports","entertainment","economy"];
  const statusColors: Record<string, string> = { open: "#10b981", closed: "#ef4444", settled: "#8b8fa8" };

  return (
    <div style={{ padding: "28px 24px" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ListFilter size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Manage Markets</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{markets.length} total markets</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={handleRefresh} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: refreshing ? "not-allowed" : "pointer", opacity: refreshing ? 0.6 : 1 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all","open","closed","settled"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", textTransform: "capitalize", transition: "all 0.15s", borderColor: statusFilter === s ? (s === "all" ? "var(--emerald)" : statusColors[s] || "var(--emerald)") : "var(--border)", background: statusFilter === s ? (s === "all" ? "var(--emerald-bg)" : `${statusColors[s]}18`) : "var(--bg-card-hover)", color: statusFilter === s ? (s === "all" ? "var(--emerald)" : statusColors[s]) : "var(--text-secondary)" }}>{s}</button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="input-dark" placeholder="Search markets..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, fontSize: 13, width: 220 }} />
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {actionError && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "var(--red-bg)", border: "1px solid var(--red-border)" }}>
          <AlertCircle size={15} color="var(--red)" />
          <span style={{ fontSize: 13, color: "var(--red)", flex: 1 }}>{actionError}</span>
          <button onClick={() => setActionError("")} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Featured Slots Panel ── */}
      <FeaturedSlotsPanel
        markets={markets}
        onRemove={handleRemoveFeature}
        onEditSlot={m => startEdit(m)}
      />

      {/* ── Markets table ── */}
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 80px 100px 140px", padding: "11px 18px", borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
          {["Market", "Category", "Type", "Duration", "Status", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>No markets found</div>
        ) : filtered.map(m => (
          <div key={m.id}>
            {editingId === m.id ? (
              /* ── Edit row ── */
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", background: "var(--emerald-bg)", display: "flex", flexDirection: "column", gap: 14 }}>
                <textarea className="input-dark" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  rows={2} style={{ fontSize: 14, resize: "vertical", fontFamily: "inherit", minHeight: 52 }} placeholder="Market title" />

                {/* Image upload */}
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  {editImage && (
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img src={editImage} alt="preview" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                      <button onClick={() => setEditImage("")} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={11} />
                      </button>
                    </div>
                  )}
                  <button onClick={() => fileInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 8, background: "var(--bg-card-hover)", border: "1px dashed var(--border)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
                    <ImagePlus size={14} /> {editImage ? "Change image" : "Upload image"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                </div>

                {/* Category */}
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setEditCategory(cat)} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "1px solid", textTransform: "capitalize", borderColor: editCategory === cat ? "var(--emerald)" : "var(--border)", background: editCategory === cat ? "var(--emerald-bg)" : "var(--bg-card-hover)", color: editCategory === cat ? "var(--emerald)" : "var(--text-secondary)" }}>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Hero Slideshow Editor */}
                <HeroSlideshowEditor
                  market={m}
                  allMarkets={markets}
                  onSave={(featured, order, tag, sub, accent, heroBanner, heroHref) => handleFeatureSave(m, featured, order, tag, sub, accent, heroBanner, heroHref)}
                />

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveEdit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "var(--emerald)", border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    <Save size={13} /> Save Changes
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Normal row ── */
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 80px 100px 140px", padding: "12px 18px", borderBottom: "1px solid var(--border)", alignItems: "center", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Title cell */}
                <div style={{ paddingRight: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  {m.image ? (
                    <img src={m.image} alt="" style={{ width: 36, height: 36, borderRadius: 7, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 7, background: "var(--bg-card-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>📊</div>
                  )}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                        {m.title.length > 44 ? m.title.slice(0, 44) + "…" : m.title}
                      </span>
                      {m.featured && (
                        <button
                          onClick={() => startEdit(m)}
                          title={`Hero Slot ${m.featuredOrder} — click to edit`}
                          style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 20, background: "#f59e0b22", border: "1px solid #f59e0b55", fontSize: 10, fontWeight: 700, color: "#f59e0b", flexShrink: 0, cursor: "pointer" }}
                        >
                          <Star size={9} fill="#f59e0b" color="#f59e0b" />
                          {m.featuredOrder}
                        </button>
                      )}
                    </div>
                    {m.status === "open" && <Countdown expiresAt={m.expiresAt} duration={m.duration} compact />}
                  </div>
                </div>

                <span style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize" }}>{m.category}</span>
                <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700 }}>
                  {m.type === "MULTI_YESNO" ? "MULTI+Y/N" : m.type.replace("_", "/")}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} color="var(--text-muted)" />
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{DURATION_LABELS[m.duration]}</span>
                </div>
                <span className={`badge-${m.status}`} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", display: "inline-block" }}>
                  {m.status}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => startEdit(m)} title="Edit"
                    style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6366f1"; (e.currentTarget as HTMLElement).style.color = "#6366f1"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}>
                    <Pencil size={13} />
                  </button>

                  {m.status !== "settled" && (
                    <button onClick={() => handleToggle(m)} title={m.status === "open" ? "Close market" : "Open market"}
                      style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: m.status === "open" ? "#10b981" : "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = m.status === "open" ? "#ef4444" : "#10b981"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                      {m.status === "open" ? <PowerOff size={13} /> : <Power size={13} />}
                    </button>
                  )}

                  {confirmDelete === m.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {m.status === "settled" && <span style={{ fontSize: 9, color: "var(--red)", fontWeight: 600 }}>Deletes all trade history</span>}
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleDelete(m.id)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, background: "#ef4444", border: "none", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          <CheckCircle2 size={11} /> Yes
                        </button>
                        <button onClick={() => setConfirmDelete(null)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer" }}>
                          <XCircle size={11} /> No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(m.id)} title="Delete"
                      style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--red)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-bg)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--red-border)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
