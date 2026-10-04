import { EN_ADJECTIVES, EN_ANIMALS } from '@/lib/adjective-animal-en'
import { SR_ADJECTIVES, SR_ANIMALS } from '@/lib/adjective-animal-sr'
import { asciiFold, toCyrillic } from '@/lib/serbian-script'

export type Language = 'en' | 'sr'
export type SerbianScript = 'latin' | 'cyrillic'
export type Casing = 'lower' | 'title' | 'upper'

export const SEPARATORS = {
  space: ' ',
  hyphen: '-',
  underscore: '_',
  none: '',
} as const
export type Separator = keyof typeof SEPARATORS

/** One generated pair, as indices into the language's word lists. */
export interface Pick {
  adjective: number
  animal: number
}

export interface FormatOptions {
  /** Serbian only. */
  script: SerbianScript
  separator: Separator
  /** `title` with no separator gives PascalCase. */
  casing: Casing
  /** Serbian Latin only: č,ć → c, š → s, ž → z, đ → dj. */
  asciiOnly: boolean
}

function listSizes(language: Language): [number, number] {
  return language === 'en'
    ? [EN_ADJECTIVES.length, EN_ANIMALS.length]
    : [SR_ADJECTIVES.length, SR_ANIMALS.length]
}

/** Number of distinct pairs a language can produce. */
export function combinationCount(language: Language): number {
  const [adjectives, animals] = listSizes(language)
  return adjectives * animals
}

/** Unbiased random integer in [0, n) via Web Crypto + rejection sampling. */
function randomIndex(n: number): number {
  const range = 2 ** 32
  const limit = range - (range % n)
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while ((buf[0] as number) >= limit)
  return (buf[0] as number) % n
}

/** `count` distinct random pairs (capped at the number of combinations). */
export function randomPicks(language: Language, count: number): Pick[] {
  const [adjectives, animals] = listSizes(language)
  const target = Math.min(count, adjectives * animals)
  const seen = new Set<number>()
  const picks: Pick[] = []

  while (picks.length < target) {
    const pick = {
      adjective: randomIndex(adjectives),
      animal: randomIndex(animals),
    }
    const key = pick.adjective * animals + pick.animal
    if (seen.has(key)) continue
    seen.add(key)
    picks.push(pick)
  }
  return picks
}

/** Adjective + animal words for a pick, adjective agreeing in gender (SR). */
function pickWords(language: Language, pick: Pick): [string, string] {
  if (language === 'en') {
    return [
      EN_ADJECTIVES[pick.adjective] as string,
      EN_ANIMALS[pick.animal] as string,
    ]
  }
  const animal = SR_ANIMALS[pick.animal]
  const adjective = SR_ADJECTIVES[pick.adjective]
  if (!animal || !adjective) return ['', '']
  return [adjective[animal.gender], animal.word]
}

function applyCasing(word: string, casing: Casing, locale: string): string {
  if (casing === 'upper') return word.toLocaleUpperCase(locale)
  if (casing === 'lower') return word
  // First letter only, so the digraph stays "Dž", never "DŽ".
  const [first = '', ...rest] = Array.from(word)
  return first.toLocaleUpperCase(locale) + rest.join('')
}

/** Render a pick as text according to the format options. */
export function formatPick(
  language: Language,
  pick: Pick,
  options: FormatOptions,
): string {
  let words: string[] = pickWords(language, pick)

  if (language === 'sr') {
    if (options.script === 'cyrillic') words = words.map(toCyrillic)
    else if (options.asciiOnly) words = words.map(asciiFold)
  }

  return words
    .map((word) => applyCasing(word, options.casing, language))
    .join(SEPARATORS[options.separator])
}
