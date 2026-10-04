/**
 * Serbian script helpers. Serbian is digraphic: Gaj Latin and Vuk Cyrillic map
 * one-to-one, with the Latin digraphs Lj, Nj and Dž each being one Cyrillic
 * letter (Љ, Њ, Џ).
 */

/** Cyrillic uppercase letter → canonical (uppercased) Latin token. */
export const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: 'A',
  Б: 'B',
  В: 'V',
  Г: 'G',
  Д: 'D',
  Ђ: 'Đ',
  Е: 'E',
  Ж: 'Ž',
  З: 'Z',
  И: 'I',
  Ј: 'J',
  К: 'K',
  Л: 'L',
  Љ: 'LJ',
  М: 'M',
  Н: 'N',
  Њ: 'NJ',
  О: 'O',
  П: 'P',
  Р: 'R',
  С: 'S',
  Т: 'T',
  Ћ: 'Ć',
  У: 'U',
  Ф: 'F',
  Х: 'H',
  Ц: 'C',
  Ч: 'Č',
  Џ: 'DŽ',
  Ш: 'Š',
}

/** Canonical Latin token → Cyrillic uppercase letter. */
const LATIN_TO_CYRILLIC: Record<string, string> = Object.fromEntries(
  Object.entries(CYRILLIC_TO_LATIN).map(([cyr, lat]) => [lat, cyr]),
)

/**
 * Transliterate Serbian Latin text to Cyrillic, keeping letter case.
 *
 * Digraphs are always read as one letter, so words where `lj`/`nj`/`dž` span a
 * morpheme boundary (e.g. "nadživeti") come out wrong — keep such words out of
 * any list fed through here. Characters without a mapping pass through.
 */
export function toCyrillic(latin: string): string {
  const chars = Array.from(latin)
  let out = ''

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] as string
    const next = chars[i + 1] ?? ''
    const digraph = LATIN_TO_CYRILLIC[(ch + next).toUpperCase()]
    const letter = digraph ?? LATIN_TO_CYRILLIC[ch.toUpperCase()]
    if (!letter) {
      out += ch
      continue
    }
    if (digraph) i++
    out += ch === ch.toUpperCase() ? letter : letter.toLowerCase()
  }

  return out
}

/** Latin letters with diacritics → their plain ASCII spelling. */
const ASCII_FOLD: Record<string, string> = {
  č: 'c',
  ć: 'c',
  š: 's',
  ž: 'z',
  đ: 'dj',
  Č: 'C',
  Ć: 'C',
  Š: 'S',
  Ž: 'Z',
  Đ: 'Dj',
}

/** Strip Serbian Latin diacritics: č,ć → c, š → s, ž → z, đ → dj. */
export function asciiFold(latin: string): string {
  return latin.replace(/[čćšžđČĆŠŽĐ]/g, (ch) => ASCII_FOLD[ch] ?? ch)
}
