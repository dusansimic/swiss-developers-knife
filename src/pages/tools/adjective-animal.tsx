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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  type Casing,
  combinationCount,
  formatPick,
  type Language,
  type Pick,
  randomPicks,
  type Separator,
  type SerbianScript,
} from '@/lib/adjective-animal'

/** Upper bound on pairs per batch. */
const MAX_COUNT = 50

export function AdjectiveAnimalTool() {
  const [language, setLanguage] = useState<Language>('en')
  const [count, setCount] = useState(5)
  const [picks, setPicks] = useState<Pick[]>([])
  const [script, setScript] = useState<SerbianScript>('latin')
  const [separator, setSeparator] = useState<Separator>('space')
  const [casing, setCasing] = useState<Casing>('lower')
  const [asciiOnly, setAsciiOnly] = useState(false)

  const valid = Number.isInteger(count) && count >= 1 && count <= MAX_COUNT

  // Re-roll on mount and whenever the language or (valid) count changes.
  // Format options only re-render the same picks.
  useEffect(() => {
    if (valid) setPicks(randomPicks(language, count))
  }, [language, count, valid])

  const names = useMemo(
    () =>
      picks.map((pick) => ({
        // Picks are unique within a batch, so this key is too.
        key: `${pick.adjective}-${pick.animal}`,
        text: formatPick(language, pick, {
          script,
          separator,
          casing,
          asciiOnly,
        }),
      })),
    [picks, language, script, separator, casing, asciiOnly],
  )

  const combinations = combinationCount(language)
  const bits = Math.log2(combinations)

  function regenerate() {
    if (valid) setPicks(randomPicks(language, count))
  }

  async function copy(text: string, message: string) {
    if (!text) return
    await navigator.clipboard.writeText(text)
    toast.success(message)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Adjective Animal</h1>
        <p className="text-muted-foreground">
          Generate random, memorable adjective + animal names in English or
          Serbian — for branch names, test users, or anything that needs a
          friendly label.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Language</Label>
          <Tabs
            value={language}
            onValueChange={(value) => setLanguage(value as Language)}
          >
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="sr">Srpski</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {language === 'sr' && (
          <div className="space-y-2">
            <Label>Script</Label>
            <Tabs
              value={script}
              onValueChange={(value) => setScript(value as SerbianScript)}
            >
              <TabsList>
                <TabsTrigger value="latin">Latinica</TabsTrigger>
                <TabsTrigger value="cyrillic">Ћирилица</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="aa-separator">Separator</Label>
          <Select
            value={separator}
            onValueChange={(value) => setSeparator(value as Separator)}
          >
            <SelectTrigger id="aa-separator" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="space">Space</SelectItem>
              <SelectItem value="hyphen">Hyphen (-)</SelectItem>
              <SelectItem value="underscore">Underscore (_)</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aa-casing">Case</Label>
          <Select
            value={casing}
            onValueChange={(value) => setCasing(value as Casing)}
          >
            <SelectTrigger id="aa-casing" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lower">lower case</SelectItem>
              <SelectItem value="title">Title Case</SelectItem>
              <SelectItem value="upper">UPPER CASE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {language === 'sr' && script === 'latin' && (
          <div className="space-y-2">
            <Label htmlFor="aa-letters">Letters</Label>
            <Select
              value={asciiOnly ? 'ascii' : 'diacritics'}
              onValueChange={(value) => setAsciiOnly(value === 'ascii')}
            >
              <SelectTrigger id="aa-letters" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diacritics">Keep č ć š ž đ</SelectItem>
                <SelectItem value="ascii">ASCII only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="aa-count">Count</Label>
          <Input
            id="aa-count"
            type="number"
            min={1}
            max={MAX_COUNT}
            value={count}
            onChange={(e) => setCount(e.target.valueAsNumber)}
            className="w-24"
            aria-invalid={!valid}
          />
        </div>

        <Button onClick={regenerate} disabled={!valid}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
      </div>

      {!valid && (
        <p className="text-sm text-destructive">
          Enter a whole number between 1 and {MAX_COUNT}.
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Names</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              copy(
                names.map((name) => name.text).join('\n'),
                'All names copied',
              )
            }
            disabled={names.length === 0}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy all
          </Button>
        </div>
        <ul className="space-y-2">
          {names.map(({ key, text }) => (
            <li
              key={key}
              className="flex items-center justify-between gap-3 rounded-md border bg-card px-4 py-2"
            >
              <span className="truncate font-mono">{text}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copy(text, `Copied “${text}”`)}
                aria-label={`Copy ${text}`}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          {combinations.toLocaleString()} combinations · ≈ {bits.toFixed(1)}{' '}
          bits — memorable, not secret. Don&apos;t use as passwords.
        </p>
      </div>
    </div>
  )
}
