import { useState, useEffect, useCallback } from 'react'

export interface QuotaInfo {
  used: number
  limit: number
  tier: string
}

export function useQuota() {
  const [quota, setQuota] = useState<QuotaInfo | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/user/quota')
      if (!res.ok) return
      setQuota(await res.json())
    } catch {
      // ignore — user may not be logged in yet
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { quota, refresh }
}
