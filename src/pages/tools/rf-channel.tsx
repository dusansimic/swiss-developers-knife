import { Copy } from 'lucide-react'
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
import { generateChannels, STEP_PRESETS_KHZ } from '@/lib/rf-channels'

const CUSTOM = 'custom'

export function RfChannelTool() {
  const [frequency, setFrequency] = useState('145.000')
  const [stepMode, setStepMode] = useState<string>('12.5')
  const [customStep, setCustomStep] = useState('6.25')
  const [count, setCount] = useState('16')

  const stepKHz = stepMode === CUSTOM ? Number(customStep) : Number(stepMode)

  const result = useMemo(() => {
    try {
      return {
        channels: generateChannels(Number(frequency), stepKHz, Number(count)),
        error: null,
      }
    } catch (err) {
      return {
        channels: null,
        error: err instanceof Error ? err.message : 'Invalid input.',
      }
    }
  }, [frequency, stepKHz, count])

  async function copyOne(mhz: string) {
    await navigator.clipboard.writeText(mhz)
    toast.success(`${mhz} MHz copied`)
  }

  async function copyAll() {
    if (!result.channels) return
    await navigator.clipboard.writeText(
      result.channels.map((c) => c.mhz).join('\n'),
    )
    toast.success(`${result.channels.length} frequencies copied`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">RF Channel Plan</h1>
        <p className="text-muted-foreground">
          Generate evenly spaced channels from a base frequency. Channel 1 is
          the entered frequency; each next channel is one step higher.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48 space-y-2">
          <Label htmlFor="rf-frequency">Frequency (MHz)</Label>
          <Input
            id="rf-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="145.000"
            className="font-mono"
          />
        </div>

        <div className="w-40 space-y-2">
          <Label htmlFor="rf-step">Step</Label>
          <Select value={stepMode} onValueChange={setStepMode}>
            <SelectTrigger id="rf-step" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEP_PRESETS_KHZ.map((step) => (
                <SelectItem key={step} value={String(step)}>
                  {step} kHz
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM}>Custom…</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {stepMode === CUSTOM && (
          <div className="w-40 space-y-2">
            <Label htmlFor="rf-custom-step">Custom step (kHz)</Label>
            <Input
              id="rf-custom-step"
              type="number"
              min={0}
              step="any"
              value={customStep}
              onChange={(e) => setCustomStep(e.target.value)}
              className="font-mono"
            />
          </div>
        )}

        <div className="w-40 space-y-2">
          <Label htmlFor="rf-count">Channels</Label>
          <Input
            id="rf-count"
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      {result.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}

      {result.channels && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {result.channels.length} channels · {stepKHz} kHz spacing
            </p>
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="mr-2 h-4 w-4" />
              Copy all
            </Button>
          </div>

          <ul className="divide-y rounded-md border">
            {result.channels.map((channel) => (
              <li
                key={channel.index}
                className="flex items-center justify-between gap-3 px-4 py-2"
              >
                <span className="w-16 text-sm text-muted-foreground">
                  Ch {channel.index}
                </span>
                <span className="flex-1 font-mono text-sm">
                  {channel.mhz} MHz
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyOne(channel.mhz)}
                  aria-label={`Copy channel ${channel.index}`}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
