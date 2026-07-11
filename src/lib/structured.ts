/**
 * Convert between JSON, YAML and TOML.
 *
 * Each format is parsed to a plain JS value and re-serialized in the target
 * format. Note the formats are not perfectly interchangeable: TOML has no
 * top-level array or scalar and no null, so converting such values to TOML
 * throws — surfaced to the caller as an error.
 */

import { parse as parseToml, stringify as stringifyToml } from 'smol-toml'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

export type Format = 'json' | 'yaml' | 'toml'

export const FORMATS: { id: Format; name: string }[] = [
  { id: 'json', name: 'JSON' },
  { id: 'yaml', name: 'YAML' },
  { id: 'toml', name: 'TOML' },
]

function parseInput(text: string, format: Format): unknown {
  switch (format) {
    case 'json':
      return JSON.parse(text)
    case 'yaml':
      return parseYaml(text)
    case 'toml':
      return parseToml(text)
  }
}

function stringifyOutput(value: unknown, format: Format): string {
  switch (format) {
    case 'json':
      return `${JSON.stringify(value, null, 2)}\n`
    case 'yaml':
      return stringifyYaml(value)
    case 'toml':
      return stringifyToml(value)
  }
}

/**
 * Convert `text` from one format to another. Returns '' for empty input.
 * Throws with a readable message on parse/serialize failure.
 */
export function convert(text: string, from: Format, to: Format): string {
  if (text.trim() === '') return ''
  const value = parseInput(text, from)
  return stringifyOutput(value, to)
}
