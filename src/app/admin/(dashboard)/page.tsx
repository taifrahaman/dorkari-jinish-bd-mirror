// src/app/admin/(dashboard)/page.tsx

import { PageHeader } from "@/components/admin/page-header";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description="Welcome to the Dorkari Jinish BD admin panel."
      />
    </div>
  );
}
