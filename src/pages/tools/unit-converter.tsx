import { ArrowLeftRight, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { CATEGORIES, convertUnit, formatResult } from '@/lib/units'

export function UnitConverterTool() {
  const [categoryId, setCategoryId] = useState(CATEGORIES[0]?.id ?? 'length')
  const [fromId, setFromId] = useState('m')
  const [toId, setToId] = useState('ft')
  const [value, setValue] = useState('1')

  const category =
    CATEGORIES.find((c) => c.id === categoryId) ??
    (CATEGORIES[0] as (typeof CATEGORIES)[number])
  const from = category.units.find((u) => u.id === fromId) ?? category.units[0]
  const to = category.units.find((u) => u.id === toId) ?? category.units[1]

  const output = useMemo(() => {
    const num = Number(value)
    if (value.trim() === '' || Number.isNaN(num) || !from || !to) return ''
    return formatResult(convertUnit(num, from, to))
  }, [value, from, to])

  function onCategoryChange(id: string) {
    const next = CATEGORIES.find((c) => c.id === id)
    if (!next) return
    setCategoryId(id)
    setFromId(next.units[0]?.id ?? '')
    setToId(next.units[1]?.id ?? next.units[0]?.id ?? '')
  }

  function swap() {
    setFromId(toId)
    setToId(fromId)
  }

  async function copyOutput() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    toast.success('Result copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Unit Converter</h1>
        <p className="text-muted-foreground">
          Convert length, weight, temperature, speed, area and volume.
        </p>
      </div>

      <div className="w-full space-y-2 sm:w-72">
        <Label htmlFor="uc-category">Category</Label>
        <Select value={categoryId} onValueChange={onCategoryChange}>
          <SelectTrigger id="uc-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-2">
          <Label htmlFor="uc-from">From</Label>
          <Input
            id="uc-from-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            className="font-mono"
          />
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger id="uc-from" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {category.units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={swap}
          aria-label="Swap units"
          className="mb-1"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="uc-to">To</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyOutput}
              disabled={!output}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
          <Input
            id="uc-to-value"
            value={output}
            readOnly
            placeholder="Result"
            className="font-mono"
          />
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger id="uc-to" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {category.units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
