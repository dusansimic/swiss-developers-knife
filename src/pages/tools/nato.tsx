import { Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sanitizeNatoInput, toNatoPhonetic, toNatoWords } from '@/lib/nato'

export function NatoTool() {
  const [text, setText] = useState('')

  const words = useMemo(() => toNatoWords(text), [text])
  const phonetic = useMemo(() => toNatoPhonetic(text), [text])

  async function copy() {
    if (!phonetic) return
    await navigator.clipboard.writeText(phonetic)
    toast.success('Phonetic spelling copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          NATO Phonetic Alphabet
        </h1>
        <p className="text-muted-foreground">
          Spell text with the NATO phonetic alphabet. Only ASCII letters (A-Z)
          and digits (0-9) are accepted; anything else is dropped as you type.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nato-input">Text</Label>
        <Textarea
          id="nato-input"
          value={text}
          onChange={(e) => setText(sanitizeNatoInput(e.target.value))}
          placeholder="Type letters and numbers…"
          className="min-h-24 font-mono"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="nato-output">Phonetic spelling</Label>
          <Button variant="ghost" size="sm" onClick={copy} disabled={!phonetic}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <Textarea
          id="nato-output"
          value={phonetic}
          readOnly
          placeholder="Result appears here…"
          className="min-h-24 font-mono"
        />
      </div>

      {words.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {words.map((entry, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed ordered sequence where position is the identity
              key={`${entry.char}-${index}`}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm"
            >
              <span className="font-mono font-semibold text-primary">
                {entry.char}
              </span>
              <span className="text-muted-foreground">{entry.word}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
