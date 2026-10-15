// src/app/admin/(dashboard)/media/page.tsx

import { PageHeader } from "@/components/admin/page-header";
import { MediaLibrary } from "@/components/admin/media";

export default function MediaLibraryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="All images uploaded from products, categories, and brands."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Media Library" },
        ]}
      />

      <MediaLibrary />
    </div>
  );
}
