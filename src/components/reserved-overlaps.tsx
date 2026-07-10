import { TriangleAlert } from 'lucide-react'
import type { ReservedRange } from '@/lib/reserved-ips'

interface ReservedOverlapsProps {
  overlaps: ReservedRange[]
}

/** Warns when the calculated subnet overlaps reserved/special-purpose ranges. */
export function ReservedOverlaps({ overlaps }: ReservedOverlapsProps) {
  if (overlaps.length === 0) return null

  return (
    <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <TriangleAlert className="h-4 w-4" />
        Overlaps {overlaps.length} reserved range
        {overlaps.length > 1 ? 's' : ''}
      </div>
      <ul className="space-y-1">
        {overlaps.map((range) => (
          <li key={range.cidr} className="flex flex-wrap gap-x-2 text-sm">
            <span className="font-mono">{range.cidr}</span>
            <span className="text-muted-foreground">— {range.description}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
