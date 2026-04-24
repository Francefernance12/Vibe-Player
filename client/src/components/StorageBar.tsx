import { memo } from 'react'

const MB = 1024 * 1024

interface Props {
  used: number
  limit: number
  tier: string
}

export const StorageBar = memo(function StorageBar({ used, limit, tier }: Props) {
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const usedMB = (used / MB).toFixed(1)
  const limitMB = Math.round(limit / MB)
  const nearFull = pct >= 90

  return (
    <div className="bg-[#111113] border border-[#1e1e21] rounded-xl px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 capitalize">
          {tier === 'free' ? 'Free Trial' : tier}
        </span>
        <span className={`text-xs tabular-nums ${nearFull ? 'text-orange-400' : 'text-zinc-500'}`}>
          {usedMB} MB of {limitMB} MB used
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Storage used"
        className="h-1.5 rounded-full bg-[#1e1e21] overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${nearFull ? 'bg-orange-400' : 'bg-orange-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
})
