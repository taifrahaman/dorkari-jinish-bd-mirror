// src/app/admin/(dashboard)/customers/[id]/page.tsx

"use client";

import { use } from "react";
import { CustomerDetail } from "@/components/admin/customer";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CustomerDetail customerId={id} />;
}
