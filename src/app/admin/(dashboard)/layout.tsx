// src/app/admin/(dashboard)/layout.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { verifyJwt } from "@/lib/auth";
import AuthProvider from "@/components/providers/AuthProvider";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["admin", "moderator"];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get("token")?.value;

  if (!token) redirect("/admin/login");

  let role: string;
  try {
    const payload = await verifyJwt(token);
    role = payload.role;
  } catch {
    redirect("/admin/login");
  }

  if (!ADMIN_ROLES.includes(role)) {
    redirect("/admin/login");
  }
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="flex min-h-screen bg-muted/30">
          <AdminSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  );
}
