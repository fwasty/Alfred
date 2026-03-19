'use client'

import { useState } from 'react'

export function SyncWhopButton({ handle }: { handle: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/whop/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ handle }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Sync failed')
      setMsg('Synced')
      window.location.reload()
    } catch (e: any) {
      setMsg(e?.message || 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-2">
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition bg-black text-white hover:bg-black/90 disabled:opacity-60"
      >
        {loading ? 'Syncing…' : 'Sync from Whop'}
      </button>
      {msg ? <div className="text-xs text-neutral-600">{msg}</div> : null}
    </div>
  )
}
