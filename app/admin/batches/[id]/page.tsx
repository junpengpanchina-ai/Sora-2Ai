import { Suspense } from "react";
import { validateAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import BatchDetailView from "./BatchDetailView";

export const dynamic = "force-dynamic";

export default async function BatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    redirect("/admin/login");
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Loading batch...</div>}>
        <BatchDetailView batchId={params.id} />
      </Suspense>
    </div>
  );
}
