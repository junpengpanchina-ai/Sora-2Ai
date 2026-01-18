'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { LockdownDailyEntry } from '@/types/admin-lockdown'
import type { LockdownPhase } from '@/types/admin-lockdown'
import { judgeDay15 } from '@/lib/admin-lockdown'

interface AdminLockdownContextValue {
  phase: LockdownPhase
  loading: boolean
}

const AdminLockdownContext = createContext<AdminLockdownContextValue>({
  phase: 'LOCKDOWN',
  loading: true,
})

export function useLockdown() {
  const ctx = useContext(AdminLockdownContext)
  if (!ctx) {
    return { phase: 'LOCKDOWN' as LockdownPhase, loading: false }
  }
  return ctx
}

function computePhase(entries: LockdownDailyEntry[]): LockdownPhase {
  const asc = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  if (asc.length < 14) return 'LOCKDOWN'
  return judgeDay15(asc)
}

interface AdminLockdownProviderProps {
  children: ReactNode
  /** 当 pathname 为 /admin/login 时可不请求，直接 LOCKDOWN */
  isLoginPage?: boolean
}

export function AdminLockdownProvider({ children, isLoginPage }: AdminLockdownProviderProps) {
  const [phase, setPhase] = useState<LockdownPhase>('LOCKDOWN')
  const [loading, setLoading] = useState(true)

  const fetchAndCompute = useCallback(async () => {
    if (isLoginPage) {
      setPhase('LOCKDOWN')
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/admin/lockdown-daily?days=14')
      const data = await res.json().catch(() => ({}))
      const entries: LockdownDailyEntry[] = Array.isArray(data.entries) ? data.entries : []
      setPhase(computePhase(entries))
    } catch {
      setPhase('LOCKDOWN')
    } finally {
      setLoading(false)
    }
  }, [isLoginPage])

  useEffect(() => {
    fetchAndCompute()
  }, [fetchAndCompute])

  return (
    <AdminLockdownContext.Provider value={{ phase, loading }}>
      {children}
    </AdminLockdownContext.Provider>
  )
}
