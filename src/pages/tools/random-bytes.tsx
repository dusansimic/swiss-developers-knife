import { Copy, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { bytesToBase62 } from '@/lib/base62'
import {
  BASE64_VARIANTS,
  bytesToBase64,
  DEFAULT_VARIANT_ID,
  getVariant,
} from '@/lib/base64'

/** Upper bound on the byte count — keeps the encoded output textarea sane. */
const MAX_BYTES = 4096

type Format = 'hex' | 'base64' | 'base62'

/** Cryptographically secure random bytes via the Web Crypto API. */
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

/** Lowercase hex, matching `openssl rand -hex`. */
function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

/** The `openssl rand` invocation equivalent to the current settings, if any. */
function opensslCommand(
  format: Format,
  count: number,
  variantId: string,
): string | null {
  if (format === 'hex') return `openssl rand -hex ${count}`
  // `openssl rand -base64` only emits the standard RFC 4648 alphabet.
  if (format === 'base64' && variantId === DEFAULT_VARIANT_ID) {
    return `openssl rand -base64 ${count}`
  }
  return null
}

export function RandomBytesTool() {
  const [count, setCount] = useState(32)
  const [bytes, setBytes] = useState<Uint8Array>(() => randomBytes(32))
  const [format, setFormat] = useState<Format>('hex')
  const [variantId, setVariantId] = useState(DEFAULT_VARIANT_ID)

  const valid = Number.isInteger(count) && count >= 1 && count <= MAX_BYTES

  // Re-roll whenever the (valid) byte count changes, including on mount.
  useEffect(() => {
    if (valid) setBytes(randomBytes(count))
  }, [count, valid])

  const output = useMemo(() => {
    if (bytes.length === 0) return ''
    if (format === 'hex') return bytesToHex(bytes)
    if (format === 'base62') return bytesToBase62(bytes)
    return bytesToBase64(bytes, getVariant(variantId))
  }, [bytes, format, variantId])

  const command = valid ? opensslCommand(format, count, variantId) : null

  function regenerate() {
    if (valid) setBytes(randomBytes(count))
  }

  async function copy() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    toast.success('Output copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Random Bytes</h1>
        <p className="text-muted-foreground">
          Generate cryptographically secure random bytes and encode them as hex,
          Base64 or Base62 — the browser equivalent of <code>openssl rand</code>
          .
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="rb-count">Bytes</Label>
          <Input
            id="rb-count"
            type="number"
            min={1}
            max={MAX_BYTES}
            value={count}
            onChange={(e) => setCount(e.target.valueAsNumber)}
            className="w-32"
            aria-invalid={!valid}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rb-format">Format</Label>
          <Select
            value={format}
            onValueChange={(value) => setFormat(value as Format)}
          >
            <SelectTrigger id="rb-format" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hex">Hex</SelectItem>
              <SelectItem value="base64">Base64</SelectItem>
              <SelectItem value="base62">Base62</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {format === 'base64' && (
          <div className="space-y-2">
            <Label htmlFor="rb-variant">Base64 variant</Label>
            <Select value={variantId} onValueChange={setVariantId}>
              <SelectTrigger id="rb-variant" className="w-full sm:w-96">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASE64_VARIANTS.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={regenerate} disabled={!valid}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
      </div>

      {!valid && (
        <p className="text-sm text-destructive">
          Enter a whole number of bytes between 1 and {MAX_BYTES}.
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rb-output">Output</Label>
          <Button variant="ghost" size="sm" onClick={copy} disabled={!output}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <Textarea
          id="rb-output"
          value={output}
          readOnly
          placeholder="Generated output…"
          className="min-h-32 font-mono break-all"
        />
        {command && (
          <p className="font-mono text-xs text-muted-foreground">$ {command}</p>
        )}
      </div>
    </div>
  )
}
