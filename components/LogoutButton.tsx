'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    })

    if (response.ok) {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
    >
      Sign Out
    </button>
  )
}

