/**
 * A shared schedule model that cron, systemd OnCalendar, and the date/time
 * picker all read from and write to.
 *
 * The model is the five cron fields (minute, hour, day-of-month, month,
 * day-of-week). Each field is either a wildcard or a list of parts (single
 * value, range, or step). This is the common ground between the two formats;
 * cron-only and systemd-only features are handled as follows:
 *  - cron has no seconds or year → systemd output always uses `:00` seconds and
 *    a `*` year; on parse those are dropped.
 *  - systemd treats a restricted day-of-month AND day-of-week as "both must
 *    match" while cron treats them as "either matches". Callers should warn
 *    when both are set (see `hasDowDomConflict`).
 */

export type FieldKey = 'minute' | 'hour' | 'dom' | 'month' | 'dow'

export type Part =
  | { kind: 'value'; value: number }
  | { kind: 'range'; from: number; to: number }
  | { kind: 'step'; from: number | null; to: number | null; step: number }

export type Field = { wildcard: true } | { wildcard: false; parts: Part[] }

export interface Schedule {
  minute: Field
  hour: Field
  dom: Field
  month: Field
  dow: Field
}

const BOUNDS: Record<FieldKey, [number, number]> = {
  minute: [0, 59],
  hour: [0, 23],
  dom: [1, 31],
  month: [1, 12],
  dow: [0, 7],
}

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const NAME_TO_DOW: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}
const NAME_TO_MONTH: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

const CRON_MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
}

const SYSTEMD_ALIASES: Record<string, string> = {
  minutely: '*-*-* *:*:00',
  hourly: '*-*-* *:00:00',
  daily: '*-*-* 00:00:00',
  weekly: 'Mon *-*-* 00:00:00',
  monthly: '*-*-01 00:00:00',
  yearly: '*-01-01 00:00:00',
  annually: '*-01-01 00:00:00',
  quarterly: '*-01,04,07,10-01 00:00:00',
  semiannually: '*-01,07-01 00:00:00',
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function parseValue(raw: string, key: FieldKey): number {
  const lower = raw.toLowerCase()
  let value: number
  if (key === 'dow' && lower in NAME_TO_DOW) {
    value = NAME_TO_DOW[lower] as number
  } else if (key === 'month' && lower in NAME_TO_MONTH) {
    value = NAME_TO_MONTH[lower] as number
  } else if (/^\d+$/.test(raw)) {
    value = Number(raw)
  } else {
    throw new Error(`Invalid value "${raw}".`)
  }
  const [min, max] = BOUNDS[key]
  if (value < min || value > max) {
    throw new Error(`Value "${raw}" out of range (${min}-${max}).`)
  }
  return value
}

function parseStepCount(raw: string): number {
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new Error(`Invalid step "${raw}".`)
  }
  return Number(raw)
}

// --- cron ---------------------------------------------------------------

function parseCronPart(raw: string, key: FieldKey): Part {
  const [base, stepRaw, extra] = raw.split('/')
  if (extra !== undefined) throw new Error(`Invalid field "${raw}".`)
  if (stepRaw !== undefined) {
    const step = parseStepCount(stepRaw)
    if (base === '*') return { kind: 'step', from: null, to: null, step }
    if (base?.includes('-')) {
      const [a, b] = base.split('-')
      return {
        kind: 'step',
        from: parseValue(a as string, key),
        to: parseValue(b as string, key),
        step,
      }
    }
    return {
      kind: 'step',
      from: parseValue(base as string, key),
      to: null,
      step,
    }
  }
  if (raw.includes('-')) {
    const [a, b] = raw.split('-')
    return {
      kind: 'range',
      from: parseValue(a as string, key),
      to: parseValue(b as string, key),
    }
  }
  return { kind: 'value', value: parseValue(raw, key) }
}

function parseCronField(token: string, key: FieldKey): Field {
  if (token === '*') return { wildcard: true }
  const parts = token.split(',').map((t) => parseCronPart(t, key))
  return { wildcard: false, parts }
}

function formatCronPart(part: Part): string {
  if (part.kind === 'value') return String(part.value)
  if (part.kind === 'range') return `${part.from}-${part.to}`
  const base =
    part.from === null
      ? '*'
      : part.to === null
        ? String(part.from)
        : `${part.from}-${part.to}`
  return `${base}/${part.step}`
}

function formatCronField(field: Field): string {
  if (field.wildcard) return '*'
  return field.parts.map(formatCronPart).join(',')
}

/** Parse a 5-field cron expression (or an `@macro`) into a schedule. */
export function parseCron(input: string): Schedule {
  const trimmed = input.trim()
  const macro = CRON_MACROS[trimmed.toLowerCase()]
  const source = macro ?? trimmed
  const fields = source.split(/\s+/)
  if (fields.length !== 5) {
    throw new Error('Cron needs 5 fields: minute hour day month weekday.')
  }
  const [minute, hour, dom, month, dow] = fields as [
    string,
    string,
    string,
    string,
    string,
  ]
  return {
    minute: parseCronField(minute, 'minute'),
    hour: parseCronField(hour, 'hour'),
    dom: parseCronField(dom, 'dom'),
    month: parseCronField(month, 'month'),
    dow: parseCronField(dow, 'dow'),
  }
}

/** Format a schedule as a 5-field cron expression. */
export function formatCron(schedule: Schedule): string {
  return [
    formatCronField(schedule.minute),
    formatCronField(schedule.hour),
    formatCronField(schedule.dom),
    formatCronField(schedule.month),
    formatCronField(schedule.dow),
  ].join(' ')
}

// --- systemd ------------------------------------------------------------

function parseSystemdNumPart(raw: string, key: FieldKey): Part {
  const [base, stepRaw, extra] = raw.split('/')
  if (extra !== undefined) throw new Error(`Invalid field "${raw}".`)
  if (stepRaw !== undefined) {
    const step = parseStepCount(stepRaw)
    if (base === '*') return { kind: 'step', from: null, to: null, step }
    if (base?.includes('..')) {
      const [a, b] = base.split('..')
      return {
        kind: 'step',
        from: parseValue(a as string, key),
        to: parseValue(b as string, key),
        step,
      }
    }
    return {
      kind: 'step',
      from: parseValue(base as string, key),
      to: null,
      step,
    }
  }
  if (raw.includes('..')) {
    const [a, b] = raw.split('..')
    return {
      kind: 'range',
      from: parseValue(a as string, key),
      to: parseValue(b as string, key),
    }
  }
  return { kind: 'value', value: parseValue(raw, key) }
}

function parseSystemdNumField(token: string, key: FieldKey): Field {
  if (token === '*') return { wildcard: true }
  const parts = token.split(',').map((t) => parseSystemdNumPart(t, key))
  return { wildcard: false, parts }
}

function dowName(value: number): string {
  return DOW_NAMES[((value % 7) + 7) % 7] as string
}

function parseSystemdDowField(token: string): Field {
  if (token === '*') return { wildcard: true }
  const parts = token.split(',').map((raw): Part => {
    if (raw.includes('..')) {
      const [a, b] = raw.split('..')
      return {
        kind: 'range',
        from: parseValue(a as string, 'dow'),
        to: parseValue(b as string, 'dow'),
      }
    }
    return { kind: 'value', value: parseValue(raw, 'dow') }
  })
  return { wildcard: false, parts }
}

function formatSystemdNumField(field: Field): string {
  if (field.wildcard) return '*'
  return field.parts
    .map((part) => {
      if (part.kind === 'value') return pad2(part.value)
      if (part.kind === 'range') return `${pad2(part.from)}..${pad2(part.to)}`
      const base =
        part.from === null
          ? '*'
          : part.to === null
            ? pad2(part.from)
            : `${pad2(part.from)}..${pad2(part.to)}`
      return `${base}/${part.step}`
    })
    .join(',')
}

/** Returns the weekday prefix, or null when every weekday is allowed. */
function formatSystemdDowField(field: Field): string | null {
  if (field.wildcard) return null
  return field.parts
    .map((part) => {
      if (part.kind === 'value') return dowName(part.value)
      if (part.kind === 'range') {
        return `${dowName(part.from)}..${dowName(part.to)}`
      }
      const base =
        part.from === null
          ? '*'
          : part.to === null
            ? dowName(part.from)
            : `${dowName(part.from)}..${dowName(part.to)}`
      return `${base}/${part.step}`
    })
    .join(',')
}

/** Parse a systemd OnCalendar expression (or a shorthand alias). */
export function parseSystemd(input: string): Schedule {
  const trimmed = input.trim()
  const alias = SYSTEMD_ALIASES[trimmed.toLowerCase()]
  const source = alias ?? trimmed
  if (source === '') throw new Error('Empty expression.')

  let dow: Field = { wildcard: true }
  let month: Field = { wildcard: true }
  let dom: Field = { wildcard: true }
  let minute: Field = { wildcard: false, parts: [{ kind: 'value', value: 0 }] }
  let hour: Field = { wildcard: false, parts: [{ kind: 'value', value: 0 }] }
  let sawTime = false

  for (const token of source.split(/\s+/)) {
    if (token.includes(':')) {
      const [h, m] = token.split(':')
      hour = parseSystemdNumField(h as string, 'hour')
      minute = parseSystemdNumField(m as string, 'minute')
      sawTime = true
    } else if (/[a-zA-Z]/.test(token)) {
      dow = parseSystemdDowField(token)
    } else {
      // Date: Year-Month-Day or Month-Day.
      const parts = token.split('-')
      if (parts.length === 3) {
        month = parseSystemdNumField(parts[1] as string, 'month')
        dom = parseSystemdNumField(parts[2] as string, 'dom')
      } else if (parts.length === 2) {
        month = parseSystemdNumField(parts[0] as string, 'month')
        dom = parseSystemdNumField(parts[1] as string, 'dom')
      } else {
        throw new Error(`Invalid date "${token}".`)
      }
    }
  }

  if (!sawTime && dow.wildcard && month.wildcard && dom.wildcard) {
    throw new Error('Provide a time, date, or weekday.')
  }

  return { minute, hour, dom, month, dow }
}

/** Format a schedule as a systemd OnCalendar expression. */
export function formatSystemd(schedule: Schedule): string {
  const dow = formatSystemdDowField(schedule.dow)
  const date = `*-${formatSystemdNumField(schedule.month)}-${formatSystemdNumField(schedule.dom)}`
  const time = `${formatSystemdNumField(schedule.hour)}:${formatSystemdNumField(schedule.minute)}:00`
  return `${dow ? `${dow} ` : ''}${date} ${time}`
}

// --- picker helpers -----------------------------------------------------

/** The single concrete value of a field, or null if it isn't a single value. */
export function fieldSingle(field: Field): number | null {
  if (field.wildcard) return null
  if (field.parts.length === 1 && field.parts[0]?.kind === 'value') {
    return field.parts[0].value
  }
  return null
}

/** Set a field to a single value, or to a wildcard when value is null. */
export function withField(
  schedule: Schedule,
  key: FieldKey,
  value: number | null,
): Schedule {
  const field: Field =
    value === null
      ? { wildcard: true }
      : { wildcard: false, parts: [{ kind: 'value', value }] }
  return { ...schedule, [key]: field }
}

/**
 * Expand a field into the explicit sorted list of values it matches within
 * [min, max], or null when the field is a wildcard ("every value").
 */
export function expandField(
  field: Field,
  min: number,
  max: number,
): number[] | null {
  if (field.wildcard) return null
  const set = new Set<number>()
  for (const part of field.parts) {
    if (part.kind === 'value') {
      set.add(part.value)
    } else if (part.kind === 'range') {
      for (let v = part.from; v <= part.to; v++) set.add(v)
    } else {
      const start = part.from ?? min
      const end = part.to ?? max
      for (let v = start; v <= end; v += part.step) set.add(v)
    }
  }
  return [...set].filter((v) => v >= min && v <= max).sort((a, b) => a - b)
}

/** Set a field to an explicit list of values, or wildcard when the list is empty. */
export function withValues(
  schedule: Schedule,
  key: FieldKey,
  values: number[],
): Schedule {
  const unique = [...new Set(values)].sort((a, b) => a - b)
  const field: Field =
    unique.length === 0
      ? { wildcard: true }
      : {
          wildcard: false,
          parts: unique.map((value) => ({ kind: 'value', value })),
        }
  return { ...schedule, [key]: field }
}

/** True when both day-of-month and weekday are restricted (AND/OR mismatch). */
export function hasDowDomConflict(schedule: Schedule): boolean {
  return !schedule.dom.wildcard && !schedule.dow.wildcard
}
