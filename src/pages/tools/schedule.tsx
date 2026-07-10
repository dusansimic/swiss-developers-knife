import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type FieldKey,
  fieldSingle,
  formatCron,
  formatSystemd,
  hasDowDomConflict,
  parseCron,
  parseSystemd,
  type Schedule,
  withDate,
  withField,
} from '@/lib/schedule'

const INITIAL_CRON = '0 9 * * 1-5'
const REFERENCE_YEAR = new Date().getFullYear()
const HOURS = Array.from({ length: 24 }, (_, h) => h)
const MINUTES = Array.from({ length: 60 }, (_, m) => m)
const ANY = 'any'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Invalid expression.'
}

export function ScheduleTool() {
  const [schedule, setSchedule] = useState<Schedule>(() =>
    parseCron(INITIAL_CRON),
  )
  const [cronText, setCronText] = useState(() => formatCron(schedule))
  const [systemdText, setSystemdText] = useState(() => formatSystemd(schedule))
  const [cronError, setCronError] = useState<string | null>(null)
  const [systemdError, setSystemdError] = useState<string | null>(null)

  /** Adopt a new schedule and refresh every representation. */
  function applySchedule(next: Schedule) {
    setSchedule(next)
    setCronText(formatCron(next))
    setSystemdText(formatSystemd(next))
    setCronError(null)
    setSystemdError(null)
  }

  function onCronChange(value: string) {
    setCronText(value)
    try {
      const next = parseCron(value)
      setSchedule(next)
      setSystemdText(formatSystemd(next))
      setCronError(null)
      setSystemdError(null)
    } catch (err) {
      setCronError(errorMessage(err))
    }
  }

  function onSystemdChange(value: string) {
    setSystemdText(value)
    try {
      const next = parseSystemd(value)
      setSchedule(next)
      setCronText(formatCron(next))
      setSystemdError(null)
      setCronError(null)
    } catch (err) {
      setSystemdError(errorMessage(err))
    }
  }

  function setTimeField(key: FieldKey, raw: string) {
    applySchedule(withField(schedule, key, raw === ANY ? null : Number(raw)))
  }

  const hourValue = fieldSingle(schedule.hour)
  const minuteValue = fieldSingle(schedule.minute)
  const monthValue = fieldSingle(schedule.month)
  const domValue = fieldSingle(schedule.dom)
  const selectedDate =
    monthValue !== null && domValue !== null
      ? new Date(REFERENCE_YEAR, monthValue - 1, domValue)
      : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Schedule Converter
        </h1>
        <p className="text-muted-foreground">
          Convert between cron, systemd <code>OnCalendar</code>, and a date/time
          picker. Editing any one updates the others.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cron-input">Cron (minute hour day month weekday)</Label>
        <Input
          id="cron-input"
          value={cronText}
          onChange={(e) => onCronChange(e.target.value)}
          placeholder="0 9 * * 1-5"
          className="font-mono"
          aria-invalid={cronError !== null}
        />
        {cronError && <p className="text-sm text-destructive">{cronError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemd-input">systemd OnCalendar</Label>
        <Input
          id="systemd-input"
          value={systemdText}
          onChange={(e) => onSystemdChange(e.target.value)}
          placeholder="Mon..Fri *-*-* 09:00:00"
          className="font-mono"
          aria-invalid={systemdError !== null}
        />
        {systemdError && (
          <p className="text-sm text-destructive">{systemdError}</p>
        )}
      </div>

      {hasDowDomConflict(schedule) && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>
            Both day-of-month and weekday are set. cron fires when{' '}
            <em>either</em> matches; systemd fires only when <em>both</em>{' '}
            match.
          </span>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Date (month &amp; day-of-month)</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => applySchedule(withDate(schedule, date ?? null))}
            className="rounded-md border"
          />
          <p className="text-xs text-muted-foreground">
            Picks a specific month + day. Clear it (click the selected day) for
            “every day/month”. Weekday is edited via the fields above.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hour-select">Hour</Label>
            <Select
              value={hourValue === null ? ANY : String(hourValue)}
              onValueChange={(v) => setTimeField('hour', v)}
            >
              <SelectTrigger id="hour-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any hour</SelectItem>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {String(h).padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minute-select">Minute</Label>
            <Select
              value={minuteValue === null ? ANY : String(minuteValue)}
              onValueChange={(v) => setTimeField('minute', v)}
            >
              <SelectTrigger id="minute-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Any minute</SelectItem>
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {String(m).padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            “Any” maps to <code>*</code>. Steps, ranges and lists (e.g.{' '}
            <code>*/5</code>) show as “Any” here — edit them in the fields
            above.
          </p>
        </div>
      </div>
    </div>
  )
}
