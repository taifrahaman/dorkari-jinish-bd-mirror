// src/app/admin/(dashboard)/colors/new/page.tsx

import { PageHeader } from "@/components/admin/page-header";
import { ColorForm } from "@/components/admin/color";

export default function NewColorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/colors"
        title="New color"
        description="Add a color to the shared library."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Colors", href: "/admin/colors" },
          { label: "New" },
        ]}
      />

      <ColorForm />
    </div>
  );
}
