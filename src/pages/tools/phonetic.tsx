import { Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  NATO_ENTRIES,
  sanitizeNatoInput,
  toNatoPhonetic,
  toNatoWords,
} from '@/lib/nato'
import {
  SERBIAN_ALPHABET,
  toSerbianPhonetic,
  toSerbianPhoneticString,
} from '@/lib/serbian-phonetic'

interface Entry {
  letter: string
  word: string
}

interface PhoneticPanelProps {
  idPrefix: string
  placeholder: string
  alphabet: Entry[]
  toUnits: (text: string) => { char: string; word: string }[]
  toText: (text: string) => string
  /** Optional input sanitizer (NATO restricts to A-Z/0-9). */
  sanitize?: (text: string) => string
}

function PhoneticPanel({
  idPrefix,
  placeholder,
  alphabet,
  toUnits,
  toText,
  sanitize,
}: PhoneticPanelProps) {
  const [text, setText] = useState('')

  const units = useMemo(() => toUnits(text), [text, toUnits])
  const phonetic = useMemo(() => toText(text), [text, toText])

  async function copy() {
    if (!phonetic) return
    await navigator.clipboard.writeText(phonetic)
    toast.success('Phonetic spelling copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-input`}>Text</Label>
        <Textarea
          id={`${idPrefix}-input`}
          value={text}
          onChange={(e) =>
            setText(sanitize ? sanitize(e.target.value) : e.target.value)
          }
          placeholder={placeholder}
          className="min-h-24"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-output`}>Phonetic spelling</Label>
          <Button variant="ghost" size="sm" onClick={copy} disabled={!phonetic}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
        <Textarea
          id={`${idPrefix}-output`}
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
          {alphabet.map((entry) => (
            <div key={entry.letter} className="flex gap-2 text-sm">
              <span className="w-8 font-semibold text-primary">
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

export function PhoneticTool() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Phonetic Alphabet</h1>
        <p className="text-muted-foreground">
          Spell text with the NATO or Serbian phonetic alphabet.
        </p>
      </div>

      <Tabs defaultValue="nato">
        <TabsList>
          <TabsTrigger value="nato">NATO</TabsTrigger>
          <TabsTrigger value="serbian">Serbian</TabsTrigger>
        </TabsList>

        <TabsContent value="nato" className="pt-2">
          <PhoneticPanel
            idPrefix="nato"
            placeholder="Type letters and numbers…"
            alphabet={NATO_ENTRIES}
            toUnits={toNatoWords}
            toText={toNatoPhonetic}
            sanitize={sanitizeNatoInput}
          />
        </TabsContent>

        <TabsContent value="serbian" className="pt-2">
          <PhoneticPanel
            idPrefix="serbian"
            placeholder="Унеси текст… / Unesi tekst…"
            alphabet={SERBIAN_ALPHABET}
            toUnits={toSerbianPhonetic}
            toText={toSerbianPhoneticString}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
