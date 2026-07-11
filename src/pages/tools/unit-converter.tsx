import { Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CATEGORIES,
  type Category,
  convertUnit,
  formatResult,
} from '@/lib/units'

const FIRST = CATEGORIES[0] as Category

interface Active {
  /** Id of the unit the user last typed into. */
  unitId: string
  /** Raw text as typed (kept verbatim in its own field). */
  raw: string
}

function CategoryPanel({ category }: { category: Category }) {
  const [active, setActive] = useState<Active>(() => ({
    unitId: category.units[0]?.id ?? '',
    raw: '1',
  }))

  const source = category.units.find((u) => u.id === active.unitId)
  const num = Number(active.raw)
  const valid = active.raw.trim() !== '' && !Number.isNaN(num) && source

  function fieldValue(unitId: string): string {
    if (unitId === active.unitId) return active.raw
    if (!valid || !source) return ''
    const unit = category.units.find((u) => u.id === unitId)
    if (!unit) return ''
    return formatResult(convertUnit(num, source, unit))
  }

  async function copy(name: string, value: string) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success(`${name} copied to clipboard`)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {category.units.map((unit) => {
        const value = fieldValue(unit.id)
        return (
          <div key={unit.id} className="space-y-1.5">
            <Label htmlFor={`unit-${unit.id}`}>{unit.name}</Label>
            <div className="flex gap-2">
              <Input
                id={`unit-${unit.id}`}
                value={value}
                inputMode="decimal"
                placeholder="0"
                className="font-mono"
                onChange={(e) =>
                  setActive({ unitId: unit.id, raw: e.target.value })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copy(unit.name, value)}
                disabled={!value}
                aria-label={`Copy ${unit.name}`}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function UnitConverterTool() {
  const [categoryId, setCategoryId] = useState(FIRST.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Unit Converter</h1>
        <p className="text-muted-foreground">
          Type a value in any unit to convert it to every other unit in the
          category.
        </p>
      </div>

      <Tabs value={categoryId} onValueChange={setCategoryId}>
        <TabsList className="flex-wrap">
          {CATEGORIES.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="pt-2">
            <CategoryPanel category={category} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
