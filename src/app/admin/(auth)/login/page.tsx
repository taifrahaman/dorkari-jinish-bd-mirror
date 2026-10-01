// src/app/admin/(auth)/login/page.tsx

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyJwt } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login · Dorkari Jinish BD",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["admin", "moderator"];

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Already signed in as admin? Skip the form.
  const token = (await cookies()).get("token")?.value;

  if (token) {
    try {
      const payload = await verifyJwt(token);
      if (ADMIN_ROLES.includes(payload.role)) {
        redirect(sanitizeNext(next));
      }
    } catch {
      // Invalid/expired token — fall through and show the form
    }
  }

  return <AdminLoginForm nextUrl={next} />;
}

// Only allow same-origin /admin paths. Anything else → /admin.
function sanitizeNext(next?: string): string {
  if (!next) return "/admin";
  if (!next.startsWith("/admin")) return "/admin";
  if (next.startsWith("/admin/login")) return "/admin";
  return next;
}
