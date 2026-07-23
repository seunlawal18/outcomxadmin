"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import AdminLoginForm from "@/components/AdminLoginForm";

function AdminLoginContent() {
  const { isAdminLoggedIn } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isAdminLoggedIn) {
      const from = searchParams.get("from") || "/dashboard";
      router.replace(from);
    }
  }, [mounted, isAdminLoggedIn, router, searchParams]);

  if (!mounted) return null;
  if (isAdminLoggedIn) return null;

  return <AdminLoginForm />;
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  );
}
