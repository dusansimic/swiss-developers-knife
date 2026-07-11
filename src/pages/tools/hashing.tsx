import { Copy, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  formatDigest,
  HASH_ALGORITHMS,
  type HashResults,
  hashFile,
  hashText,
  OUTPUT_FORMATS,
  type OutputFormat,
} from '@/lib/hashing'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

export function HashingTool() {
  const [text, setText] = useState('')
  const [textResults, setTextResults] = useState<HashResults | null>(null)
  const [fileResults, setFileResults] = useState<HashResults | null>(null)
  const [fileInfo, setFileInfo] = useState<{
    name: string
    size: number
  } | null>(null)
  const [hashing, setHashing] = useState(false)
  const [format, setFormat] = useState<OutputFormat>('hex')
  const fileRef = useRef<HTMLInputElement>(null)
  const textToken = useRef(0)

  useEffect(() => {
    const token = ++textToken.current
    hashText(text).then((results) => {
      // Ignore stale results if the text changed while hashing.
      if (token === textToken.current) setTextResults(results)
    })
  }, [text])

  async function onFile(file: File) {
    setHashing(true)
    setFileInfo({ name: file.name, size: file.size })
    try {
      setFileResults(await hashFile(file))
    } catch {
      toast.error(`Failed to hash ${file.name}.`)
      setFileResults(null)
    } finally {
      setHashing(false)
    }
  }

  async function copy(name: string, value: string) {
    await navigator.clipboard.writeText(value)
    toast.success(`${name} copied to clipboard`)
  }

  function renderResults(results: HashResults | null) {
    if (!results) return null
    return (
      <ul className="space-y-2">
        {HASH_ALGORITHMS.map((algo) => {
          const value = formatDigest(results[algo.id] ?? '', format)
          return (
            <li key={algo.id} className="rounded-md border bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {algo.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copy(algo.name, value)}
                  aria-label={`Copy ${algo.name}`}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="font-mono text-sm break-all">{value}</p>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hashing</h1>
        <p className="text-muted-foreground">
          Hash text or a file with MD5, SHA-1, SHA-2 and SHA-3 variants at once.
        </p>
      </div>

      <div className="w-full space-y-2 sm:w-72">
        <Label htmlFor="hash-format">Output format</Label>
        <Select
          value={format}
          onValueChange={(v) => setFormat(v as OutputFormat)}
        >
          <SelectTrigger id="hash-format" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OUTPUT_FORMATS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="text">
        <TabsList>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="file">File</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hash-text">Text</Label>
            <Textarea
              id="hash-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text to hash…"
              className="min-h-28 font-mono"
            />
          </div>
          {renderResults(textResults)}
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => fileRef.current?.click()} disabled={hashing}>
              <Upload className="mr-2 h-4 w-4" />
              {hashing ? 'Hashing…' : 'Choose a file'}
            </Button>
            {fileInfo && (
              <span className="text-sm text-muted-foreground">
                {fileInfo.name} · {formatBytes(fileInfo.size)}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void onFile(file)
              }}
            />
          </div>
          {renderResults(fileResults)}
        </TabsContent>
      </Tabs>
    </div>
  )
}
