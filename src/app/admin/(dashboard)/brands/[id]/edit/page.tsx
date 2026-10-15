// src/app/admin/(dashboard)/brands/[id]/edit/page.tsx

import { EditBrandClient } from "./EditBrandClient";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditBrandClient id={id} />;
}
