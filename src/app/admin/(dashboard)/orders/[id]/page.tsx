// src/app/admin/(dashboard)/orders/[id]/page.tsx

"use client";

import { use } from "react";
import { OrderDetail } from "@/components/admin/order";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <OrderDetail orderId={id} />;
}
