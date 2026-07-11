import { RotateCcw, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
  expandField,
  type FieldKey,
  fieldSingle,
  formatCron,
  formatSystemd,
  hasDowDomConflict,
  parseCron,
  parseSystemd,
  type Schedule,
  withField,
  withValues,
} from '@/lib/schedule'
import { cn } from '@/lib/utils'

const INITIAL_CRON = '0 9 * * 1-5'
const HOURS = Array.from({ length: 24 }, (_, h) => h)
const MINUTES = Array.from({ length: 60 }, (_, m) => m)
// A fixed 31-day month that starts on a Monday, so with a Monday week start the
// calendar renders a clean 1-31 grid (day-of-month is month-agnostic here).
const DOM_MONTH = new Date(2021, 2, 1)
const DOM_YEAR = 2021
const DOM_MONTH_INDEX = 2
// Weekday buttons in ISO order; values are cron numbers (Sun = 0).
const WEEKDAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
]
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

  const domSet = new Set(expandField(schedule.dom, 1, 31) ?? [])
  const dowSet = new Set(
    (expandField(schedule.dow, 0, 7) ?? []).map((v) => (v === 7 ? 0 : v)),
  )

  function toggleDow(value: number) {
    const next = new Set(dowSet)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    applySchedule(withValues(schedule, 'dow', [...next]))
  }

  const hourValue = fieldSingle(schedule.hour)
  const minuteValue = fieldSingle(schedule.minute)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Schedule Converter
        </h1>
        <p className="text-muted-foreground">
          Convert between cron, systemd <code>OnCalendar</code>, and pickers.
          Editing any one updates the others.
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

      {/* Day of month — independent from weekday, so it is a plain 1-31 grid. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Day of month</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              applySchedule({ ...schedule, dom: { wildcard: true } })
            }
            disabled={schedule.dom.wildcard}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
        <Calendar
          mode="multiple"
          defaultMonth={DOM_MONTH}
          weekStartsOn={1}
          showOutsideDays={false}
          disableNavigation
          selected={[...domSet].map(
            (d) => new Date(DOM_YEAR, DOM_MONTH_INDEX, d),
          )}
          onSelect={(dates) =>
            applySchedule(
              withValues(
                schedule,
                'dom',
                (dates ?? []).map((d) => d.getDate()),
              ),
            )
          }
          classNames={{
            nav: 'hidden',
            month_caption: 'hidden',
            weekdays: 'hidden',
          }}
          className="w-fit rounded-md border"
        />
        <p className="text-xs text-muted-foreground">
          {schedule.dom.wildcard
            ? 'Every day of the month (*).'
            : 'Runs on the selected days.'}
        </p>
      </div>

      {/* Day of week — separate field; cron/systemd both treat it independently. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Day of week</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              applySchedule({ ...schedule, dow: { wildcard: true } })
            }
            disabled={schedule.dow.wildcard}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDow(day.value)}
              className={cn(
                'w-14 rounded-md border py-2 text-sm transition-colors',
                dowSet.has(day.value)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {day.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {schedule.dow.wildcard
            ? 'Every day of the week (*).'
            : 'Runs on the selected weekdays.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <p className="text-xs text-muted-foreground">
        Hour/minute “Any” maps to <code>*</code>. Steps, ranges and lists (e.g.{' '}
        <code>*/5</code>) show as “Any” — edit them in the fields above. The
        month field is edited via the cron/systemd fields.
      </p>
    </div>
  )
}
