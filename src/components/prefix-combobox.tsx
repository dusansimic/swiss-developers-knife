import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface PrefixOption {
  /** Prefix length, e.g. 24. */
  prefix: number
  /** Netmask for that prefix, shown alongside in the list. */
  netmask: string
}

interface PrefixComboboxProps {
  id?: string
  /** Current raw text value (may be freely typed). */
  value: string
  onChange: (value: string) => void
  options: PrefixOption[]
  placeholder?: string
}

/**
 * Editable combobox for a subnet prefix: type a value directly, or open the
 * dropdown to pick a prefix (each option also shows its netmask).
 */
export function PrefixCombobox({
  id,
  value,
  onChange,
  options,
  placeholder,
}: PrefixComboboxProps) {
  const [open, setOpen] = useState(false)

  const query = value.trim().toLowerCase()
  const filtered =
    query === ''
      ? options
      : options.filter(
          (o) =>
            String(o.prefix).startsWith(query) ||
            o.netmask.toLowerCase().includes(query),
        )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            id={id}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            className="pr-9 font-mono"
          />
          <button
            type="button"
            aria-label="Toggle prefix list"
            tabIndex={-1}
            onClick={() => setOpen((o) => !o)}
            className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronsUpDown className="h-4 w-4" />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-1"
        // Keep focus in the input so the user can keep typing to filter.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul className="max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="px-2 py-1.5 text-muted-foreground">No match</li>
          )}
          {filtered.map((o) => (
            <li key={o.prefix}>
              <button
                type="button"
                onClick={() => {
                  onChange(String(o.prefix))
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
              >
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    value.trim() === String(o.prefix)
                      ? 'opacity-100'
                      : 'opacity-0',
                  )}
                />
                <span className="font-mono">/{o.prefix}</span>
                <span className="ml-auto truncate font-mono text-xs text-muted-foreground">
                  {o.netmask}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
