import { redirect } from 'next/navigation'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

type ContactRequestRow = {
  id: string
  created_at: string
  updated_at: string
  intent: string | null
  name: string
  email: string
  company: string
  message: string | null
  source_path: string | null
  status: string
}

export default async function AdminContactRequestsPage() {
  const adminUser = await validateAdminSession()
  if (!adminUser) {
    redirect('/admin/login')
  }

  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('contact_requests')
    .select(
      'id, created_at, updated_at, intent, name, email, company, message, source_path, status'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold">Contact Requests</h1>
        <p className="mt-4 text-sm text-red-600">Failed to load: {error.message}</p>
      </main>
    )
  }

  const rows = (data ?? []) as ContactRequestRow[]

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contact Requests</h1>
          <p className="mt-1 text-sm opacity-70">
            Latest {rows.length} submissions (contact + enterprise).
          </p>
        </div>
        <a
          href="/admin/dashboard"
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Back to Dashboard
        </a>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Intent</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Message</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-mono text-xs opacity-70">{r.created_at}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {r.intent ?? 'contact'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{r.name}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <a className="underline" href={`mailto:${r.email}`}>
                    {r.email}
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{r.company}</td>
                <td className="px-4 py-3 min-w-[320px] whitespace-pre-wrap">
                  {r.message ?? ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-xs opacity-70">
                    {r.source_path ?? ''}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center opacity-70" colSpan={8}>
                  No submissions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  )
}

