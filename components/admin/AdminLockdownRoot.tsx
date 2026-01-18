'use client'

import { usePathname } from 'next/navigation'
import { AdminLockdownProvider, useLockdown } from './AdminLockdownContext'
import { LockdownBanner } from './LockdownBanner'

/**
 * Admin 全局锁仓根组件：Provider + 强制 Banner。
 * 在 app/admin/layout.tsx 中包裹 {children}。
 */
function AdminLockdownInner({ children }: { children: React.ReactNode }) {
  const { phase, loading } = useLockdown()
  return (
    <>
      <LockdownBanner phase={loading ? 'LOCKDOWN' : phase} />
      {children}
    </>
  )
}

export function AdminLockdownRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login/')

  return (
    <AdminLockdownProvider isLoginPage={isLoginPage}>
      <AdminLockdownInner>{children}</AdminLockdownInner>
    </AdminLockdownProvider>
  )
}
