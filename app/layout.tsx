"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ToastContainer from "@/components/ToastContainer";
import AdminSidebar from "@/components/AdminSidebar";
import RealtimeSync from "@/components/RealtimeSync";
import { useStore } from "@/lib/store";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdminLoggedIn } = useStore();
  const router   = useRouter();
  const pathname = usePathname();

  // Wait for Zustand to rehydrate from localStorage before making any
  // redirect decisions — prevents a flash redirect on page refresh.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Backend rejected the stored token (expired/revoked) — log out and
  // bounce to login immediately. Dispatched from lib/api.ts on any 401.
  useEffect(() => {
    const handler = () => {
      useStore.setState({ isAdminLoggedIn: false });
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    };
    window.addEventListener("admin-token-expired", handler);
    return () => window.removeEventListener("admin-token-expired", handler);
  }, [router, pathname]);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!mounted) return;
    if (!isAdminLoggedIn && !isLoginPage) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isAdminLoggedIn, isLoginPage, router, pathname]);

  if (isLoginPage) return <>{children}</>;
  if (!mounted) return null;
  if (!isAdminLoggedIn) return null; // redirect in progress

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <RealtimeSync />
      <AdminSidebar />
      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }} className="admin-main-content">
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .admin-main-content { padding-top: 56px; }
        }
      `}</style>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <title>OutcomX Admin</title>
      </head>
      <body>
        <ThemeProvider>
          <AdminGuard>{children}</AdminGuard>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
