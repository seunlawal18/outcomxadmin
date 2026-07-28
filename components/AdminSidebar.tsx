"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/themeStore";
import { LogoMark } from "@/components/Logo";
import {
  LayoutDashboard, PlusCircle, ListFilter,
  CheckSquare2, Users, TrendingUp, LogOut,
  ExternalLink, Menu, X, Sun, Moon, DollarSign, Banknote,
  Clapperboard,
} from "lucide-react";

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000";

const navItems = [
  { href: "/dashboard",    label: "Dashboard",       icon: LayoutDashboard },
  { href: "/slides",       label: "Hero Slides",     icon: Clapperboard    },
  { href: "/create",       label: "Create Market",   icon: PlusCircle      },
  { href: "/manage",       label: "Manage Markets",  icon: ListFilter      },
  { href: "/resolve",      label: "Resolve Markets", icon: CheckSquare2    },
  { href: "/withdrawals",  label: "Withdrawals",     icon: Banknote        },
  { href: "/income",       label: "Platform Income", icon: DollarSign      },
  { href: "/users",        label: "Users",           icon: Users           },
];

export default function AdminSidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { adminLogout, markets, promoSlides } = useStore();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeSlideCount = (promoSlides ?? []).filter(s => s.active).length;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 4px", marginBottom: 28 }}>
        <LogoMark size={30} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>outcomx</p>
          <p style={{ fontSize: 10, color: "var(--emerald)", margin: 0, fontWeight: 700, letterSpacing: "1px" }}>ADMIN</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          const badge = href === "/slides" ? (activeSlideCount > 0 ? activeSlideCount : null) : null;
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon size={16} />
                {label}
              </span>
              {badge !== null && (
                <span style={{ fontSize: 10, fontWeight: 700, background: "#f59e0b", color: "#000", borderRadius: 20, padding: "1px 6px", lineHeight: 1.6 }}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick stats */}
      <div style={{
        padding: "12px 14px",
        background: "var(--bg-primary)",
        borderRadius: 10,
        marginBottom: 10,
        border: "1px solid var(--border)",
      }}>
        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "0 0 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Quick Stats
        </p>
        {[
          { label: "Markets", value: markets.length,                                    color: "var(--text-primary)" },
          { label: "Open",    value: markets.filter((m) => m.status === "open").length, color: "var(--emerald)"      },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
            <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <button
          onClick={toggleTheme}
          className="sidebar-link"
          style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>

        <a href={MAIN_APP_URL} className="sidebar-link" style={{ fontSize: 13 }} onClick={() => setMobileOpen(false)}>
          <ExternalLink size={14} />
          View Platform
        </a>

        <button
          onClick={() => { adminLogout(); router.replace("/login"); }}
          className="sidebar-link"
          style={{ background: "none", border: "none", width: "100%", textAlign: "left", color: "var(--red)", cursor: "pointer" }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="admin-sidebar-desktop"
        style={{
          width: 220,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 12px",
          flexShrink: 0,
          minHeight: "100vh",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          transition: "background 0.25s, border-color 0.25s",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div
        className="admin-mobile-bar"
        style={{
          display: "none",
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "0 16px", height: 56,
          alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={15} color="white" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>OUTCOMX ADMIN</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, backdropFilter: "blur(4px)" }}
          />
          <aside style={{
            position: "fixed", top: 0, left: 0, bottom: 0,
            width: 240, zIndex: 301,
            background: "var(--bg-secondary)",
            borderRight: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            padding: "20px 12px",
            overflowY: "auto",
            animation: "slideInLeft 0.22s ease",
          }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ alignSelf: "flex-end", width: 30, height: 30, borderRadius: 7, background: "var(--bg-card-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}
            >
              <X size={15} />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-mobile-bar { display: flex !important; }
        }
      `}</style>
    </>
  );
}
