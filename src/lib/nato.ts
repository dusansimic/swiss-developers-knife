/**
 * NATO phonetic alphabet conversion.
 *
 * Letters use the official NATO/ICAO spellings (note "Alfa" and "Juliett").
 * Digits use their plain English number words. Only ASCII letters and digits
 * are supported — any other character is not part of the alphabet.
 */

export const NATO_ALPHABET: Record<string, string> = {
  A: 'Alfa',
  B: 'Bravo',
  C: 'Charlie',
  D: 'Delta',
  E: 'Echo',
  F: 'Foxtrot',
  G: 'Golf',
  H: 'Hotel',
  I: 'India',
  J: 'Juliett',
  K: 'Kilo',
  L: 'Lima',
  M: 'Mike',
  N: 'November',
  O: 'Oscar',
  P: 'Papa',
  Q: 'Quebec',
  R: 'Romeo',
  S: 'Sierra',
  T: 'Tango',
  U: 'Uniform',
  V: 'Victor',
  W: 'Whiskey',
  X: 'X-ray',
  Y: 'Yankee',
  Z: 'Zulu',
  '0': 'Zero',
  '1': 'One',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
}

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
