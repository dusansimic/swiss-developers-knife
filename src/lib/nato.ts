/**
 * NATO phonetic alphabet conversion.
 *
 * Letters use the official NATO/ICAO spellings (note "Alfa" and "Juliett").
 * Digits use their plain English number words. Only ASCII letters and digits
 * are supported — any other character is not part of the alphabet.
 */

export interface NatoEntry {
  letter: string
  word: string
}

/** The alphabet in display order (A-Z, then 0-9). */
export const NATO_ENTRIES: NatoEntry[] = [
  { letter: 'A', word: 'Alfa' },
  { letter: 'B', word: 'Bravo' },
  { letter: 'C', word: 'Charlie' },
  { letter: 'D', word: 'Delta' },
  { letter: 'E', word: 'Echo' },
  { letter: 'F', word: 'Foxtrot' },
  { letter: 'G', word: 'Golf' },
  { letter: 'H', word: 'Hotel' },
  { letter: 'I', word: 'India' },
  { letter: 'J', word: 'Juliett' },
  { letter: 'K', word: 'Kilo' },
  { letter: 'L', word: 'Lima' },
  { letter: 'M', word: 'Mike' },
  { letter: 'N', word: 'November' },
  { letter: 'O', word: 'Oscar' },
  { letter: 'P', word: 'Papa' },
  { letter: 'Q', word: 'Quebec' },
  { letter: 'R', word: 'Romeo' },
  { letter: 'S', word: 'Sierra' },
  { letter: 'T', word: 'Tango' },
  { letter: 'U', word: 'Uniform' },
  { letter: 'V', word: 'Victor' },
  { letter: 'W', word: 'Whiskey' },
  { letter: 'X', word: 'X-ray' },
  { letter: 'Y', word: 'Yankee' },
  { letter: 'Z', word: 'Zulu' },
  { letter: '0', word: 'Zero' },
  { letter: '1', word: 'One' },
  { letter: '2', word: 'Two' },
  { letter: '3', word: 'Three' },
  { letter: '4', word: 'Four' },
  { letter: '5', word: 'Five' },
  { letter: '6', word: 'Six' },
  { letter: '7', word: 'Seven' },
  { letter: '8', word: 'Eight' },
  { letter: '9', word: 'Nine' },
]

export const NATO_ALPHABET: Record<string, string> = Object.fromEntries(
  NATO_ENTRIES.map((e) => [e.letter, e.word]),
)

/** Matches a single disallowed character (anything but ASCII letters/digits). */
const DISALLOWED = /[^A-Za-z0-9]/g

/** Remove every character that is not an ASCII letter or digit. */
export function sanitizeNatoInput(input: string): string {
  return input.replace(DISALLOWED, '')
}

/** One `{ char, word }` pair per input character (input must be sanitized). */
export function toNatoWords(input: string): { char: string; word: string }[] {
  return [...input].map((char) => ({
    char,
    word: NATO_ALPHABET[char.toUpperCase()] ?? char,
  }))
}

/** Convert sanitized text to a space-separated NATO phonetic string. */
export function toNatoPhonetic(input: string): string {
  return toNatoWords(input)
    .map((entry) => entry.word)
    .join(' ')
}
