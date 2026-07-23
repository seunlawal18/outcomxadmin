import { redirect } from "next/navigation";

// / → redirect to /dashboard
// AdminGuard (app/layout.tsx) handles auth — if not logged in it
// redirects to /login first.
export default function AdminRoot() {
  redirect("/dashboard");
}
