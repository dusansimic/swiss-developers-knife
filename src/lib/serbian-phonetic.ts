/**
 * Serbian phonetic alphabet, parsing both Latin and Cyrillic script.
 *
 * Serbian is digraphic. The code words are keyed by their Gaj Latin letter
 * (uppercased), including the digraphs Lj, Nj and Dž. Input parsing recognises:
 *  - Latin letters + the two-character digraphs `lj`, `nj`, `dž`
 *  - the single-codepoint digraph forms (ǅ ǈ ǋ and their case variants)
 *  - Cyrillic letters (incl. Љ, Њ, Џ), mapped to the same code words
 *  - digits 0-9
 * Anything else (spaces, punctuation) is skipped.
 */

export interface SerbianEntry {
  /** Display letter, e.g. "Č" or "Dž". */
  letter: string
  word: string
}

export const SERBIAN_ALPHABET: SerbianEntry[] = [
  { letter: 'A', word: 'Avala' },
  { letter: 'B', word: 'Beograd' },
  { letter: 'C', word: 'Cetinje' },
  { letter: 'Č', word: 'Čačak' },
  { letter: 'Ć', word: 'Ćuprija' },
  { letter: 'D', word: 'Drina' },
  { letter: 'Đ', word: 'Đakovica' },
  { letter: 'Dž', word: 'Džep' },
  { letter: 'E', word: 'Evropa' },
  { letter: 'F', word: 'Futog' },
  { letter: 'G', word: 'Golija' },
  { letter: 'H', word: 'Heroj' },
  { letter: 'I', word: 'Igalo' },
  { letter: 'J', word: 'Jadran' },
  { letter: 'K', word: 'Kosovo' },
  { letter: 'L', word: 'Lovćen' },
  { letter: 'Lj', word: 'Ljubovija' },
  { letter: 'M', word: 'Morava' },
  { letter: 'N', word: 'Niš' },
  { letter: 'Nj', word: 'Njegoš' },
  { letter: 'O', word: 'Obilić' },
  { letter: 'P', word: 'Pirot' },
  { letter: 'Q', word: 'Kvorum' },
  { letter: 'R', word: 'Ruma' },
  { letter: 'S', word: 'Sava' },
  { letter: 'Š', word: 'Šabac' },
  { letter: 'T', word: 'Timok' },
  { letter: 'U', word: 'Užice' },
  { letter: 'V', word: 'Valjevo' },
  { letter: 'W', word: 'Duplo ve' },
  { letter: 'X', word: 'Iks' },
  { letter: 'Y', word: 'Ipsilon' },
  { letter: 'Z', word: 'Zemun' },
  { letter: 'Ž', word: 'Žabljak' },
  { letter: '1', word: 'Jedinica' },
  { letter: '2', word: 'Dva' },
  { letter: '3', word: 'Tri' },
  { letter: '4', word: 'Četiri' },
  { letter: '5', word: 'Petica' },
  { letter: '6', word: 'Šest' },
  { letter: '7', word: 'Sedam' },
  { letter: '8', word: 'Osam' },
  { letter: '9', word: 'Devet' },
  { letter: '0', word: 'Nula' },
]

/** Code word by canonical (uppercased Latin) token. */
const WORDS: Record<string, string> = Object.fromEntries(
  SERBIAN_ALPHABET.map((e) => [e.letter.toUpperCase(), e.word]),
)

const DIGRAPHS = new Set(['LJ', 'NJ', 'DŽ'])

/** Cyrillic uppercase letter → canonical Latin token. */
const CYRILLIC_TO_LATIN: Record<string, string> = {
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

/** Single-codepoint Latin digraph forms → canonical token. */
const PRECOMPOSED: Record<string, string> = {
  Ǆ: 'DŽ',
  ǅ: 'DŽ',
  ǆ: 'DŽ',
  Ǉ: 'LJ',
  ǈ: 'LJ',
  ǉ: 'LJ',
  Ǌ: 'NJ',
  ǋ: 'NJ',
  ǌ: 'NJ',
}

export interface SerbianUnit {
  /** Matched input substring (as typed). */
  char: string
  word: string
}

/** Parse text (Latin or Cyrillic) into recognised letter → code word units. */
export function toSerbianPhonetic(input: string): SerbianUnit[] {
  const chars = Array.from(input)
  const units: SerbianUnit[] = []

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] as string

    // Single-codepoint Latin digraph (ǅ ǈ ǋ …).
    const pre = PRECOMPOSED[ch]
    if (pre) {
      units.push({ char: ch, word: WORDS[pre] as string })
      continue
    }

    // Cyrillic letter (Љ, Њ, Џ are single characters here).
    const cyr = CYRILLIC_TO_LATIN[ch.toUpperCase()]
    if (cyr) {
      units.push({ char: ch, word: WORDS[cyr] as string })
      continue
    }

    // Latin two-character digraph (lj, nj, dž).
    const next = chars[i + 1]
    if (next !== undefined) {
      const pair = (ch + next).toUpperCase()
      if (DIGRAPHS.has(pair)) {
        units.push({ char: ch + next, word: WORDS[pair] as string })
        i++
        continue
      }
    }

    // Single Latin letter or digit.
    const word = WORDS[ch.toUpperCase()]
    if (word) units.push({ char: ch, word })
  }

  return units
}

/** Space-joined code words for the recognised units. */
export function toSerbianPhoneticString(input: string): string {
  return toSerbianPhonetic(input)
    .map((u) => u.word)
    .join(' ')
}
