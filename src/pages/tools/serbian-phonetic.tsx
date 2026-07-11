import { Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  SERBIAN_ALPHABET,
  toSerbianPhonetic,
  toSerbianPhoneticString,
} from '@/lib/serbian-phonetic'

export function SerbianPhoneticTool() {
  const [text, setText] = useState('')

  const units = useMemo(() => toSerbianPhonetic(text), [text])
  const phonetic = useMemo(() => toSerbianPhoneticString(text), [text])

  async function copy() {
    if (!phonetic) return
    await navigator.clipboard.writeText(phonetic)
    toast.success('Phonetic spelling copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Serbian Phonetic Alphabet
        </h1>
        <p className="text-muted-foreground">
          Spell text with the Serbian phonetic alphabet. Accepts both Latin and
          Cyrillic script (including the Lj, Nj and Dž digraphs) and digits.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="srb-input">Text</Label>
        <Textarea
          id="srb-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Унеси текст… / Unesi tekst…"
          className="min-h-24"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="srb-output">Phonetic spelling</Label>
          <Button variant="ghost" size="sm" onClick={copy} disabled={!phonetic}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <Textarea
          id="srb-output"
          value={phonetic}
          readOnly
          placeholder="Result appears here…"
          className="min-h-24"
        />
      </div>

      {units.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {units.map((unit, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed ordered sequence where position is the identity
              key={`${unit.char}-${index}`}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm"
            >
              <span className="font-semibold text-primary">{unit.char}</span>
              <span className="text-muted-foreground">{unit.word}</span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Alphabet</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
          {SERBIAN_ALPHABET.map((entry) => (
            <div key={entry.letter} className="flex gap-2 text-sm">
              <span className="w-6 font-semibold text-primary">
                {entry.letter}
              </span>
              <span className="text-muted-foreground">{entry.word}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
