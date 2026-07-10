import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ResultFieldProps {
  label: string
  value: string
}

/** A labelled read-only value with a copy button. */
export function ResultField({ label, value }: ResultFieldProps) {
  const copyable = value !== '' && value !== '—'

  async function copy() {
    if (!copyable) return
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="truncate font-mono text-sm">{value || '—'}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={copy}
        disabled={!copyable}
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}
