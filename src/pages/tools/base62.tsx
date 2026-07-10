import { Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FileConverter } from '@/components/file-converter'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  base62ToBytes,
  bytesToBase62,
  decodeText,
  encodeText,
} from '@/lib/base62'

export function Base62Tool() {
  const [text, setText] = useState('')
  const [base62, setBase62] = useState('')
  const [error, setError] = useState<string | null>(null)

  function onTextChange(value: string) {
    setText(value)
    setError(null)
    setBase62(encodeText(value))
  }

  function onBase62Change(value: string) {
    setBase62(value)
    if (value.trim() === '') {
      setText('')
      setError(null)
      return
    }
    try {
      setText(decodeText(value))
      setError(null)
    } catch {
      setError('Invalid Base62 — cannot decode to text.')
    }
  }

  async function copy(value: string, label: string) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Base62</h1>
        <p className="text-muted-foreground">
          Live, two-way conversion. Edit either box — the other updates
          instantly. UTF-8 safe, alphabet 0-9A-Za-z.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="b62-text">Text</Label>
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
          id="b62-text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Plain text…"
          className="min-h-32 font-mono"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="b62-encoded">Base62</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copy(base62, 'Base62')}
            disabled={!base62}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <Textarea
          id="b62-encoded"
          value={base62}
          onChange={(e) => onBase62Change(e.target.value)}
          placeholder="Base62…"
          className="min-h-32 font-mono"
          aria-invalid={error !== null}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Separator />

      <FileConverter
        label="Base62"
        encodedExt="b62"
        encodeBytes={bytesToBase62}
        decodeBytes={base62ToBytes}
      />
    </div>
  )
}
