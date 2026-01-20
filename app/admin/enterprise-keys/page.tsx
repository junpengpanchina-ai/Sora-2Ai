import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAdminSession } from "@/lib/admin-auth";

type EnterpriseApiKeyRow = {
  id: string;
  user_id: string;
  name: string | null;
  is_active: boolean;
  rate_limit_per_min: number;
  created_at: string | null;
  last_seen_at: string | null;
};

async function fetchKeys(): Promise<EnterpriseApiKeyRow[]> {
  const supabase = await createServiceClient();
  const {
    data: keys,
  } = await supabase
    .from("enterprise_api_keys")
    .select("id, user_id, name, is_active, rate_limit_per_min, created_at, last_seen_at")
    .order("created_at", { ascending: false });
  return (keys ?? []) as EnterpriseApiKeyRow[];
}

async function EnterpriseKeysTable() {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized. Please login as admin.
      </div>
    );
  }

  const keys = await fetchKeys();

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Enterprise API Keys</h1>
      <p className="mb-4 text-sm text-gray-500">
        Simple read-only view of API keys. Use Admin API to create or update keys.
      </p>
      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">User ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Rate / min</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-t border-gray-100">
                <td className="px-3 py-2 text-xs font-mono">{k.id}</td>
                <td className="px-3 py-2 text-xs font-mono">{k.user_id}</td>
                <td className="px-3 py-2">{k.name ?? "-"}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                      k.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {k.is_active ? "On" : "Off"}
                  </span>
                </td>
                <td className="px-3 py-2">{k.rate_limit_per_min}</td>
                <td className="px-3 py-2 text-xs">
                  {k.created_at ? new Date(k.created_at).toLocaleString() : "-"}
                </td>
                <td className="px-3 py-2 text-xs">
                  {k.last_seen_at
                    ? new Date(k.last_seen_at).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-4 text-center text-sm text-gray-400"
                >
                  No API keys found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EnterpriseKeysPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-gray-500">Loading enterprise keys…</div>
      }
    >
      <EnterpriseKeysTable />
    </Suspense>
  );
}

