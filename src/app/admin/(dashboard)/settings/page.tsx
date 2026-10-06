// src/app/admin/(dashboard)/settings/page.tsx

import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Store details, VAT configuration, and inventory defaults."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Settings" },
        ]}
      />

      <SettingsForm />
    </div>
  );
}
