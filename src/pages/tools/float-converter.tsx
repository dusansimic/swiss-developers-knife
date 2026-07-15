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
  bitsToFloat,
  decompose,
  FLOAT_FORMATS,
  type FloatKind,
  floatToBits,
  formatFloat,
  parseFloatInput,
} from '@/lib/ieee754'
import { formatValue, parseValue } from '@/lib/radix'

type Field = 'dec' | 'hex' | 'bin'

const FIELD_LABELS: Record<Field, string> = {
  dec: 'Decimal value',
  hex: 'Hexadecimal',
  bin: 'Binary',
}

const FIELD_PLACEHOLDERS: Record<Field, string> = {
  dec: '3.14, -0, Infinity, NaN…',
  hex: '40490FDB…',
  bin: '01000000…',
}

const EMPTY: Record<Field, string> = { dec: '', hex: '', bin: '' }

const CATEGORY_LABELS: Record<string, string> = {
  zero: 'Zero',
  subnormal: 'Subnormal',
  normal: 'Normal',
  infinity: 'Infinity',
  nan: 'NaN',
}

export function FloatConverterTool() {
  const [kind, setKind] = useState<FloatKind>('f32')
  const [values, setValues] = useState<Record<Field, string>>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [bits, setBits] = useState<bigint | null>(null)

  const fmt = FLOAT_FORMATS[kind]

  /** Push a resolved bit pattern into every field except the one being typed. */
  function propagate(next: bigint, except: Field, raw: string) {
    setBits(next)
    setErrors({})
    setValues((prev) => {
      const out = { ...prev, [except]: raw }
      if (except !== 'dec') out.dec = formatFloat(bitsToFloat(next, fmt))
      if (except !== 'hex') out.hex = formatValue(next, 'hex', fmt.width)
      if (except !== 'bin') out.bin = formatValue(next, 'bin', fmt.width)
      return out
    })
  }

  function onChange(field: Field, raw: string) {
    if (raw.trim() === '') {
      setValues(EMPTY)
      setErrors({})
      setBits(null)
      return
    }

    try {
      const next =
        field === 'dec'
          ? floatToBits(parseFloatInput(raw), fmt)
          : parseValue(raw, field, fmt.width)
      propagate(next, field, raw)
    } catch (err) {
      setValues((prev) => ({ ...prev, [field]: raw }))
      setErrors({ [field]: err instanceof Error ? err.message : 'Invalid.' })
    }
  }

  function onKindChange(value: string) {
    const nextKind = value as FloatKind
    const nextFmt = FLOAT_FORMATS[nextKind]
    setKind(nextKind)
    setErrors({})
    if (bits === null) return
    // Preserve the number the user entered; re-encode into the new precision.
    const value_ = bitsToFloat(bits, fmt)
    const nextBits = floatToBits(value_, nextFmt)
    setBits(nextBits)
    setValues({
      dec: formatFloat(bitsToFloat(nextBits, nextFmt)),
      hex: formatValue(nextBits, 'hex', nextFmt.width),
      bin: formatValue(nextBits, 'bin', nextFmt.width),
    })
  }

  async function copy(field: Field) {
    const value = values[field]
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success(`${FIELD_LABELS[field]} copied to clipboard`)
  }

  const parts = bits !== null ? decompose(bits, fmt) : null
  const binary = bits !== null ? formatValue(bits, 'bin', fmt.width) : ''
  const signBits = binary.slice(0, 1)
  const exponentBits = binary.slice(1, 1 + fmt.exponentBits)
  const mantissaBits = binary.slice(1 + fmt.exponentBits)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Float Converter</h1>
        <p className="text-muted-foreground">
          Convert between a decimal number and its IEEE 754 binary
          representation. Edit any field — the others update instantly.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fc-kind">Precision</Label>
        <Select value={kind} onValueChange={onKindChange}>
          <SelectTrigger id="fc-kind" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(FLOAT_FORMATS).map((f) => (
              <SelectItem key={f.kind} value={f.kind}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {(['dec', 'hex', 'bin'] as const).map((field) => (
          <div key={field} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`fc-${field}`}>{FIELD_LABELS[field]}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copy(field)}
                disabled={!values[field]}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <Input
              id={`fc-${field}`}
              value={values[field]}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={FIELD_PLACEHOLDERS[field]}
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
              aria-invalid={errors[field] !== undefined}
            />
            {errors[field] && (
              <p className="text-sm text-destructive">{errors[field]}</p>
            )}
          </div>
        ))}
      </div>

      {parts && (
        <>
          <Separator />
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Bit layout</h2>

            <div className="overflow-x-auto">
              <p className="font-mono text-sm break-all">
                <span style={{ color: 'var(--chart-1)' }}>{signBits}</span>
                <span style={{ color: 'var(--chart-2)' }}>{exponentBits}</span>
                <span style={{ color: 'var(--chart-3)' }}>{mantissaBits}</span>
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs" style={{ color: 'var(--chart-1)' }}>
                  Sign
                </p>
                <p className="font-mono text-sm">
                  {parts.sign} ({parts.sign === 0 ? '+' : '−'})
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs" style={{ color: 'var(--chart-2)' }}>
                  Exponent
                </p>
                <p className="font-mono text-sm">
                  {parts.exponentRaw.toString()}
                  {parts.exponentUnbiased !== null && (
                    <span className="text-muted-foreground">
                      {' '}
                      (2^{parts.exponentUnbiased})
                    </span>
                  )}
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs" style={{ color: 'var(--chart-3)' }}>
                  Mantissa
                </p>
                <p className="font-mono text-sm break-all">
                  0x{parts.mantissaRaw.toString(16).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                Class:{' '}
                <span className="text-foreground">
                  {CATEGORY_LABELS[parts.category]}
                </span>
              </span>
              <span className="text-muted-foreground">
                Stored value:{' '}
                <span className="font-mono text-foreground">
                  {formatFloat(parts.value)}
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
