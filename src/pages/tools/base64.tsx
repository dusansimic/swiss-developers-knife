import { Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FileConverter } from '@/components/file-converter'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  BASE64_VARIANTS,
  base64ToBytes,
  bytesToBase64,
  DEFAULT_VARIANT_ID,
  decodeText,
  encodeText,
  getVariant,
} from '@/lib/base64'

export function Base64Tool() {
  const [variantId, setVariantId] = useState(DEFAULT_VARIANT_ID)
  const [text, setText] = useState('')
  const [base64, setBase64] = useState('')
  const [error, setError] = useState<string | null>(null)

  function onTextChange(value: string) {
    setText(value)
    setError(null)
    setBase64(encodeText(value, getVariant(variantId)))
  }

  function onBase64Change(value: string) {
    setBase64(value)
    if (value.trim() === '') {
      setText('')
      setError(null)
      return
    }
    try {
      setText(decodeText(value, getVariant(variantId)))
      setError(null)
    } catch {
      setError('Invalid Base64 — cannot decode to text.')
    }
  }

  function onVariantChange(value: string) {
    setVariantId(value)
    // Text is canonical: re-encode it into the newly-selected variant.
    setError(null)
    setBase64(encodeText(text, getVariant(value)))
  }

  async function copy(value: string, label: string) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Base64</h1>
        <p className="text-muted-foreground">
          Live, two-way conversion. Edit either box — the other updates
          instantly. UTF-8 safe.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="b64-variant">Variant</Label>
        <Select value={variantId} onValueChange={onVariantChange}>
          <SelectTrigger id="b64-variant" className="w-full sm:w-96">
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="b64-text">Text</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copy(text, 'Text')}
            disabled={!text}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <Textarea
          id="b64-text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Plain text…"
          className="min-h-32 font-mono"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="b64-encoded">Base64</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copy(base64, 'Base64')}
            disabled={!base64}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <Textarea
          id="b64-encoded"
          value={base64}
          onChange={(e) => onBase64Change(e.target.value)}
          placeholder="Base64…"
          className="min-h-32 font-mono"
          aria-invalid={error !== null}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Separator />

      <FileConverter
        label={`${getVariant(variantId).name} Base64`}
        encodedExt="b64"
        encodeBytes={(bytes) => bytesToBase64(bytes, getVariant(variantId))}
        decodeBytes={(value) => base64ToBytes(value, getVariant(variantId))}
      />
    </div>
  )
}
