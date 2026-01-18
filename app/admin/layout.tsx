import { AdminLockdownRoot } from '@/components/admin/AdminLockdownRoot'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLockdownRoot>{children}</AdminLockdownRoot>
}
