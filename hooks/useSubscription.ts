'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Tier, TIER_CONFIG, hasFeature, canCreateEvent, canCreatePackage } from '@/lib/tier-config'

export function useSubscription(userId: string | undefined) {
  const [tier, setTier] = useState<Tier>('free')
  const [status, setStatus] = useState<string>('active')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setTier(data.tier as Tier)
          setStatus(data.status)
        }
        setLoading(false)
      })
  }, [userId])

  const upgrade = async () => {
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  const manage = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return {
    tier,
    status,
    loading,
    config: TIER_CONFIG[tier],
    hasFeature: (f: string) => hasFeature(tier, f),
    canCreateEvent: (n: number) => canCreateEvent(tier, n),
    canCreatePackage: (n: number) => canCreatePackage(tier, n),
    upgrade,
    manage,
  }
}
