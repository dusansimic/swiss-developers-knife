import { Info, TriangleAlert } from 'lucide-react'
import type { ReservedRange } from '@/lib/reserved-ips'

interface SubnetOverlapsProps {
  /** Reserved / special-purpose ranges the subnet touches. */
  reserved: ReservedRange[]
  /** Whether the subnet also includes public, globally-routable space. */
  publicOverlap: boolean
}

/**
 * Two signals for a calculated subnet:
 *  - a danger alert when it includes public internet space
 *  - an info alert listing the reserved ranges it overlaps
 */
export function SubnetOverlaps({
  reserved,
  publicOverlap,
}: SubnetOverlapsProps) {
  if (!publicOverlap && reserved.length === 0) return null

  return (
    <div className="space-y-3">
      {publicOverlap && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>
            <span className="font-semibold text-destructive">
              Includes public internet address space.
            </span>{' '}
            Part of this subnet is globally routable — don't use it for a
            private network.
          </span>
        </div>
      )}

      {reserved.length > 0 && (
        <div className="space-y-2 rounded-md border border-blue-500/40 bg-blue-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <Info className="h-4 w-4" />
            Overlaps {reserved.length} reserved range
            {reserved.length > 1 ? 's' : ''}
          </div>
          <ul className="space-y-1">
            {reserved.map((range) => (
              <li key={range.cidr} className="flex flex-wrap gap-x-2 text-sm">
                <span className="font-mono">{range.cidr}</span>
                <span className="text-muted-foreground">
                  — {range.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
