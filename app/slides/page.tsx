"use client";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { PromoSlide } from "@/lib/types";
import { toast } from "@/lib/toastStore";
import {
  Clapperboard, Plus, Pencil, Trash2, X, Save,
  CheckCircle2, XCircle, ImagePlus, AlertCircle,
  Power, PowerOff, RefreshCw, Star,
} from "lucide-react";

const EMPTY_FORM = {
  slideOrder: 1, tag: "", headline: "", subheadline: "",
  ctaText: "", ctaHref: "", bannerImage: "", accentColor: "#6c63ff", active: true,
};

type FormState = typeof EMPTY_FORM;

// ── Slide Form Modal ──────────────────────────────────────────────
function SlideForm({
  initial,
  occupiedOrders,
  onSave,
  onClose,
}: {
  initial: FormState;
  occupiedOrders: number[];
  onSave: (data: FormState) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm]           = useState<FormState>(initial);
  const [saving, setSaving]       = useState(false);
  const [imgDragging, setImgDrag] = useState(false);
  const [imgError, setImgError]   = useState("");
  const fileRef  = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  // Max slot = highest occupied + 5, minimum 10
  const maxSlot = Math.max(10, ...occupiedOrders, form.slideOrder) + 5;

  const set = (k: keyof FormState, v: string | number | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const processFile = (file: File) => {
    setImgError("");
    if (!file.type.startsWith("image/")) { setImgError("Must be an image file."); return; }
    if (file.size > 4 * 1024 * 1024)    { setImgError("Max 4MB."); return; }
    const reader = new FileReader();
    reader.onload = e => setForm(prev => ({ ...prev, bannerImage: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.headline.trim() && !form.bannerImage) {
      toast("Add a headline or a background image — at least one is required", "error");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const previewBg = form.bannerImage
    ? `url("${form.bannerImage}") center/cover no-repeat`
    : "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto", background: "var(--bg-secondary)", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #f59e0b18, #f59e0b08)", position: "sticky", top: 0, zIndex: 1, borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clapperboard size={16} color="#f59e0b" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              {initial.headline ? "Edit Slide" : "Create Slide"}
            </span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Live preview */}
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
            <div style={{ height: "clamp(90px, 12vw, 140px)", background: previewBg, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
              <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", maxWidth: "70%" }}>
                {form.tag && <span style={{ fontSize: 9, fontWeight: 800, color: form.accentColor, letterSpacing: "1.5px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{form.tag}</span>}
                <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 3px", lineHeight: 1.3 }}>{form.headline || "Slide headline…"}</p>
                {form.subheadline && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", margin: "0 0 6px" }}>{form.subheadline}</p>}
                {form.ctaText && (
                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, background: form.accentColor, color: "#fff", fontSize: 10, fontWeight: 700 }}>{form.ctaText}</span>
                )}
              </div>
              <span style={{ position: "absolute", bottom: 5, right: 8, fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.5px" }}>PREVIEW</span>
            </div>
          </div>

          {/* Row: order + active */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                Slide Order <span style={{ fontWeight: 400, textTransform: "none" }}>(pick a slot)</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {Array.from({ length: maxSlot }, (_, i) => i + 1).map(n => {
                  const isTaken = occupiedOrders.includes(n) && n !== initial.slideOrder;
                  const isSelected = form.slideOrder === n;
                  return (
                    <button key={n} onClick={() => set("slideOrder", n)}
                      title={isTaken ? `Slot ${n} — occupied` : isSelected ? `Slot ${n} — selected` : `Slot ${n} — available`}
                      style={{
                        width: 34, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 700,
                        cursor: "pointer", border: "1px solid", transition: "all 0.15s", position: "relative",
                        borderColor: isSelected ? "#f59e0b" : isTaken ? "var(--border)" : "var(--border)",
                        background: isSelected ? "#f59e0b" : isTaken ? "var(--bg-primary)" : "var(--bg-card-hover)",
                        color: isSelected ? "#000" : isTaken ? "var(--text-muted)" : "var(--text-secondary)",
                        opacity: isTaken ? 0.5 : 1,
                      }}>
                      {n}
                      {isTaken && !isSelected && (
                        <span style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: "2px solid var(--bg-secondary)" }} />
                      )}
                    </button>
                  );
                })}
                {/* + Add more slots button */}
                <button
                  onClick={() => set("slideOrder", maxSlot + 1)}
                  title="Use a higher slot number"
                  style={{ width: 34, height: 34, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer", border: "1px dashed var(--border)", background: "var(--bg-card-hover)", color: "var(--text-muted)", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#f59e0b"; (e.currentTarget as HTMLElement).style.color = "#f59e0b"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
                  +
                </button>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                Red dot = taken · Amber = selected · Click <strong>+</strong> to add more slots
              </p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", paddingTop: 24 }}>
              <input type="checkbox" checked={form.active} onChange={e => set("active", e.target.checked)}
                style={{ width: 15, height: 15, accentColor: "#10b981", cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "var(--text-primary)" }}>Active (visible on site)</span>
            </label>
          </div>

          {/* Headline */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
              Headline <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input className="input-dark" value={form.headline} onChange={e => set("headline", e.target.value)}
              placeholder="e.g. Predict the Champions League Final" maxLength={120} style={{ fontSize: 14, width: "100%" }} />
          </div>

          {/* Tag + Subheadline row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                Tag Label <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <input className="input-dark" value={form.tag} onChange={e => set("tag", e.target.value)}
                placeholder="e.g. NEW FEATURE" maxLength={40} style={{ fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                Subheadline <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <input className="input-dark" value={form.subheadline ?? ""} onChange={e => set("subheadline", e.target.value)}
                placeholder="One-line description" maxLength={120} style={{ fontSize: 13 }} />
            </div>
          </div>

          {/* CTA row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                CTA Button Text <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <input className="input-dark" value={form.ctaText ?? ""} onChange={e => set("ctaText", e.target.value)}
                placeholder="e.g. Take a Position →" maxLength={60} style={{ fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
                CTA Destination URL <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <input className="input-dark" value={form.ctaHref ?? ""} onChange={e => set("ctaHref", e.target.value)}
                placeholder="e.g. / or /?category=sports" maxLength={200} style={{ fontSize: 13 }} />
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
              Accent Color
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => colorRef.current?.click()} style={{ width: 32, height: 32, borderRadius: 8, background: form.accentColor, border: "2px solid var(--border)", cursor: "pointer", padding: 0, flexShrink: 0 }} />
              <input ref={colorRef} type="color" value={form.accentColor} onChange={e => set("accentColor", e.target.value)}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }} />
              <input className="input-dark" value={form.accentColor}
                onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) set("accentColor", e.target.value); }}
                maxLength={7} style={{ width: 110, fontSize: 13, fontFamily: "monospace" }} />
              {["#6c63ff","#10b981","#f59e0b","#ef4444","#3b82f6","#ec4899"].map(c => (
                <button key={c} onClick={() => set("accentColor", c)} title={c}
                  style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: form.accentColor === c ? "2px solid white" : "2px solid transparent", cursor: "pointer", padding: 0, flexShrink: 0 }} />
              ))}
            </div>
          </div>

          {/* Background image upload */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>
              Background Image <span style={{ fontWeight: 400, textTransform: "none" }}>(optional · 1200×400px rec. · max 4MB)</span>
            </label>
            {form.bannerImage ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "var(--bg-card-hover)", border: "1px solid var(--border)" }}>
                <img src={form.bannerImage} alt="" style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>Image set ({Math.round(form.bannerImage.length / 1024)}KB)</span>
                <button onClick={() => fileRef.current?.click()} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer" }}>Replace</button>
                <button onClick={() => setForm(p => ({ ...p, bannerImage: "" }))} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)", cursor: "pointer" }}>Remove</button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setImgDrag(true); }}
                onDragLeave={() => setImgDrag(false)}
                onDrop={e => { e.preventDefault(); setImgDrag(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
                onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${imgDragging ? "#f59e0b" : "var(--border)"}`, borderRadius: 10, padding: "18px 16px", textAlign: "center", cursor: "pointer", background: imgDragging ? "#f59e0b08" : "var(--bg-card-hover)", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, aspectRatio: "3/1" }}>
                <ImagePlus size={20} color={imgDragging ? "#f59e0b" : "var(--text-muted)"} />
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>Drop image or click to upload</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>1200×400px · JPG, PNG, WebP</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); if (fileRef.current) fileRef.current.value = ""; }} />
            {imgError && <p style={{ fontSize: 12, color: "var(--red)", marginTop: 5 }}>{imgError}</p>}
          </div>

          {/* Footer actions */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 9, fontSize: 14, fontWeight: 700, background: "#f59e0b", border: "none", color: "#000", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              <Save size={15} /> {saving ? "Saving…" : "Save Slide"}
            </button>
            <button onClick={onClose} style={{ padding: "11px 20px", borderRadius: 9, fontSize: 14, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Slides Page ──────────────────────────────────────────────
export default function HeroSlidesPage() {
  const { promoSlides, fetchPromoSlides, createPromoSlide, updatePromoSlide, deletePromoSlide } = useStore();
  const [loading, setLoading]         = useState(false);
  const [formOpen, setFormOpen]       = useState(false);
  const [editing, setEditing]         = useState<PromoSlide | null>(null);
  const [confirmDel, setConfirmDel]   = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchPromoSlides().then(r => {
      if (!r.ok) setActionError(r.error);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit   = (s: PromoSlide) => { setEditing(s); setFormOpen(true); };

  const handleSave = async (data: typeof EMPTY_FORM) => {
    const payload: Record<string, unknown> = {
      slideOrder:  data.slideOrder,
      accentColor: data.accentColor,
      active:      data.active,
      headline:    data.headline.trim() || "",
    };
    // Only include optional fields if they have a value — avoids null validation errors
    if (data.tag)         payload.tag         = data.tag;
    if (data.subheadline) payload.subheadline  = data.subheadline;
    if (data.ctaText)     payload.ctaText      = data.ctaText;
    if (data.ctaHref)     payload.ctaHref      = data.ctaHref;
    if (data.bannerImage) payload.bannerImage  = data.bannerImage;
    let res;
    if (editing) {
      res = await updatePromoSlide(editing.id, payload as Parameters<typeof updatePromoSlide>[1]);
    } else {
      res = await createPromoSlide(payload as Parameters<typeof createPromoSlide>[0]);
    }
    if (res.ok) {
      toast(editing ? "Slide updated" : "Slide created");
      setFormOpen(false);
      setEditing(null);
    } else {
      toast(res.error, "error");
    }
  };

  const handleToggleActive = async (s: PromoSlide) => {
    const res = await updatePromoSlide(s.id, { active: !s.active });
    if (res.ok) toast(s.active ? "Slide hidden" : "Slide activated");
    else toast(res.error, "error");
  };

  const handleDelete = async (id: number) => {
    const res = await deletePromoSlide(id);
    setConfirmDel(null);
    if (res.ok) toast("Slide deleted");
    else toast(res.error, "error");
  };

  const sorted = [...promoSlides].sort((a, b) => a.slideOrder - b.slideOrder);
  const activeCount = promoSlides.filter(s => s.active).length;

  return (
    <div style={{ padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clapperboard size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Hero Slides</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              {promoSlides.length} slides · {activeCount} active
            </p>
          </div>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, background: "#f59e0b", border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={15} /> Create Slide
        </button>
      </div>

      {/* Error */}
      {actionError && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "var(--red-bg)", border: "1px solid var(--red-border)" }}>
          <AlertCircle size={15} color="var(--red)" />
          <span style={{ fontSize: 13, color: "var(--red)", flex: 1 }}>{actionError}</span>
          <button onClick={() => setActionError("")} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Slides list */}
      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
          <RefreshCw size={20} style={{ animation: "spin 0.8s linear infinite", margin: "0 auto 10px", display: "block" }} />
          Loading slides…
        </div>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Clapperboard size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>No slides yet</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>Create your first promo slide to show in the hero banner.</p>
          <button onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, background: "#f59e0b", border: "none", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={14} /> Create Slide
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 120px 110px", padding: "11px 18px", borderBottom: "1px solid var(--border)", background: "var(--bg-primary)" }}>
            {["#", "Slide", "Order", "Status", "Tag", "Actions"].map(h => (
              <span key={h} style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</span>
            ))}
          </div>

          {sorted.map(s => (
            <div key={s.id}
              style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 120px 110px", padding: "12px 18px", borderBottom: "1px solid var(--border)", alignItems: "center", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Thumbnail */}
              <div style={{ width: 36, height: 28, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)" }}>
                {s.bannerImage ? (
                  <img src={s.bannerImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${s.accentColor}44, ${s.accentColor}22)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Star size={10} color={s.accentColor} fill={s.accentColor} />
                  </div>
                )}
              </div>

              {/* Title */}
              <div style={{ paddingRight: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.headline}
                </p>
                {s.subheadline && (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.subheadline}</p>
                )}
              </div>

              {/* Order */}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>#{s.slideOrder}</span>

              {/* Status */}
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", display: "inline-block", background: s.active ? "var(--emerald-bg)" : "var(--bg-card-hover)", color: s.active ? "var(--emerald)" : "var(--text-muted)", border: `1px solid ${s.active ? "var(--emerald-border)" : "var(--border)"}` }}>
                {s.active ? "Active" : "Hidden"}
              </span>

              {/* Tag */}
              {s.tag ? (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${s.accentColor}22`, color: s.accentColor, border: `1px solid ${s.accentColor}44`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.tag}
                </span>
              ) : (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => openEdit(s)} title="Edit"
                  style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#6366f1"; (e.currentTarget as HTMLElement).style.color = "#6366f1"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}>
                  <Pencil size={13} />
                </button>

                <button onClick={() => handleToggleActive(s)} title={s.active ? "Hide slide" : "Activate slide"}
                  style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: s.active ? "var(--emerald)" : "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.active ? <PowerOff size={13} /> : <Power size={13} />}
                </button>

                {confirmDel === s.id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => handleDelete(s.id)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, background: "#ef4444", border: "none", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      <CheckCircle2 size={11} /> Yes
                    </button>
                    <button onClick={() => setConfirmDel(null)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer" }}>
                      <XCircle size={11} /> No
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDel(s.id)} title="Delete"
                    style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--red)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-bg)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--red-border)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <SlideForm
          initial={editing ? {
            slideOrder:   editing.slideOrder,
            tag:          editing.tag ?? "",
            headline:     editing.headline,
            subheadline:  editing.subheadline ?? "",
            ctaText:      editing.ctaText ?? "",
            ctaHref:      editing.ctaHref ?? "",
            bannerImage:  editing.bannerImage ?? "",
            accentColor:  editing.accentColor,
            active:       editing.active,
          } : { ...EMPTY_FORM, slideOrder: Math.max(0, ...sorted.map(s => s.slideOrder)) + 1 }}
          occupiedOrders={sorted.map(s => s.slideOrder)}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
