import { ArrowLeftRight, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { convert, FORMATS, type Format } from '@/lib/structured'

const PLACEHOLDERS: Record<Format, string> = {
  json: '{\n  "name": "example",\n  "count": 3\n}',
  yaml: 'name: example\ncount: 3',
  toml: 'name = "example"\ncount = 3',
}

function FormatSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: Format
  onChange: (value: Format) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Format)}>
      <SelectTrigger id={id} className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FORMATS.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function FormatConverterTool() {
  const [from, setFrom] = useState<Format>('json')
  const [to, setTo] = useState<Format>('yaml')
  const [input, setInput] = useState(PLACEHOLDERS.json)

  const result = useMemo(() => {
    try {
      return { output: convert(input, from, to), error: null }
    } catch (err) {
      return {
        output: '',
        error: err instanceof Error ? err.message : 'Conversion failed.',
      }
    }
  }, [input, from, to])

  function swap() {
    setFrom(to)
    setTo(from)
    if (result.output) setInput(result.output)
  }

  async function copyOutput() {
    if (!result.output) return
    await navigator.clipboard.writeText(result.output)
    toast.success('Output copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Format Converter</h1>
        <p className="text-muted-foreground">
          Convert between JSON, YAML and TOML. Conversion runs live.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="from-format">From</Label>
          <FormatSelect id="from-format" value={from} onChange={setFrom} />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={swap}
          aria-label="Swap formats"
          className="mb-0.5"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        <div className="space-y-2">
          <Label htmlFor="to-format">To</Label>
          <FormatSelect id="to-format" value={to} onChange={setTo} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fc-input">Input</Label>
          <Textarea
            id="fc-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDERS[from]}
            className="min-h-72 font-mono"
            aria-invalid={result.error !== null}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="fc-output">Output</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyOutput}
              disabled={!result.output}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
          <Textarea
            id="fc-output"
            value={result.output}
            readOnly
            placeholder="Result appears here…"
            className="min-h-72 font-mono"
          />
        </div>
      </div>

      {result.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
    </div>
  )
}
