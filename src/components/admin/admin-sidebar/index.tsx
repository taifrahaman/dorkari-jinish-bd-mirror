// src/components/admin/admin-sidebar/index.tsx

// src/components/admin/admin-sidebar/index.ts

import { DesktopSidebar } from "./DesktopSidebar";
import { MobileSidebar } from "./MobileSidebar";

export function AdminSidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}
