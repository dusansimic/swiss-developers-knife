import { Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  BASES,
  type Base,
  BIT_WIDTHS,
  type BitWidth,
  formatValue,
  maskFor,
  parseValue,
  toSigned,
} from '@/lib/radix'

const BASE_LABELS: Record<Base, string> = {
  bin: 'Binary',
  oct: 'Octal',
  dec: 'Decimal',
  hex: 'Hexadecimal',
}

const BASE_PLACEHOLDERS: Record<Base, string> = {
  bin: '1010…',
  oct: '755…',
  dec: '-42…',
  hex: 'DEAD…',
}

const EMPTY: Record<Base, string> = { bin: '', oct: '', dec: '', hex: '' }

export function BaseConverterTool() {
  const [width, setWidth] = useState<BitWidth>(32)
  const [values, setValues] = useState<Record<Base, string>>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<Base, string>>>({})
  const [bits, setBits] = useState<bigint | null>(null)

  function onChange(base: Base, raw: string) {
    if (raw.trim() === '') {
      setValues(EMPTY)
      setErrors({})
      setBits(null)
      return
    }

    try {
      const next = parseValue(raw, base, width)
      setBits(next)
      setErrors({})
      // Keep the field the user is editing verbatim; regenerate the rest.
      setValues((prev) => {
        const out = { ...prev, [base]: raw }
        for (const other of BASES) {
          if (other !== base) out[other] = formatValue(next, other, width)
        }
        return out
      })
    } catch (err) {
      setValues((prev) => ({ ...prev, [base]: raw }))
      setErrors({ [base]: err instanceof Error ? err.message : 'Invalid.' })
    }
  }

  function onWidthChange(value: string) {
    const nextWidth = Number(value) as BitWidth
    setWidth(nextWidth)
    setErrors({})
    if (bits === null) return
    // Reinterpret the existing pattern within the new width (truncating).
    const nextBits = bits & maskFor(nextWidth)
    setBits(nextBits)
    setValues(
      Object.fromEntries(
        BASES.map((base) => [base, formatValue(nextBits, base, nextWidth)]),
      ) as Record<Base, string>,
    )
  }

  async function copy(base: Base) {
    const value = values[base]
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success(`${BASE_LABELS[base]} copied to clipboard`)
  }

  const unsigned = bits !== null ? bits.toString() : null
  const signed = bits !== null ? toSigned(bits, width).toString() : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Base Converter</h1>
        <p className="text-muted-foreground">
          Type a number in any base — the others update instantly. Values are
          fixed-width two's-complement integers; decimal shows the signed value.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bc-width">Bit width</Label>
        <Select value={String(width)} onValueChange={onWidthChange}>
          <SelectTrigger id="bc-width" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BIT_WIDTHS.map((w) => (
              <SelectItem key={w} value={String(w)}>
                {w}-bit
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {BASES.map((base) => (
          <div key={base} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`bc-${base}`}>{BASE_LABELS[base]}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copy(base)}
                disabled={!values[base]}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <Input
              id={`bc-${base}`}
              value={values[base]}
              onChange={(e) => onChange(base, e.target.value)}
              placeholder={BASE_PLACEHOLDERS[base]}
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
              aria-invalid={errors[base] !== undefined}
            />
            {errors[base] && (
              <p className="text-sm text-destructive">{errors[base]}</p>
            )}

            {base === 'bin' && unsigned !== null && signed !== null && (
              <div className="grid gap-3 rounded-md border border-border bg-muted/50 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    As unsigned integer
                  </p>
                  <p className="font-mono text-sm">{unsigned}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    As signed integer (two's complement)
                  </p>
                  <p className="font-mono text-sm">{signed}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Separator />

      <p className="text-sm text-muted-foreground">
        Binary is padded to the selected width. Underscores and spaces are
        allowed as digit separators. Values that don't fit the width are
        rejected.
      </p>
    </div>
  )
}
