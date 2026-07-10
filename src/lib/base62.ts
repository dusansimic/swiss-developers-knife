/**
 * Base62 encoding of arbitrary byte sequences.
 *
 * Base62 has no padding and no fixed grouping like Base64 — the byte array is
 * treated as one big-endian big integer and repeatedly divided by 62. Leading
 * zero bytes carry no value in that integer, so (as in Base58/Base62 address
 * schemes) each leading zero byte is preserved explicitly as a leading `0`
 * symbol. This makes the transform fully reversible.
 *
 * Alphabet: digits, then uppercase, then lowercase (`0-9A-Za-z`) — the common
 * "GMP-style" ordering. (Some libraries use `0-9a-zA-Z`; this tool uses the
 * former.)
 */

const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ZERO = ALPHABET[0]
const BASE = 62n

const VALUE_OF = new Map<string, number>()
for (let i = 0; i < ALPHABET.length; i++) {
  VALUE_OF.set(ALPHABET[i] as string, i)
}

/** Encode raw bytes to a Base62 string. */
export function bytesToBase62(bytes: Uint8Array): string {
  let leadingZeros = 0
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros++
  }

  let num = 0n
  for (const byte of bytes) {
    num = num * 256n + BigInt(byte)
  }

  let out = ''
  while (num > 0n) {
    out = (ALPHABET[Number(num % BASE)] as string) + out
    num /= BASE
  }

  return ZERO.repeat(leadingZeros) + out
}

/** Decode a Base62 string to raw bytes. Throws on invalid characters. */
export function base62ToBytes(input: string): Uint8Array {
  const text = input.trim()

  let leadingZeros = 0
  while (leadingZeros < text.length && text[leadingZeros] === ZERO) {
    leadingZeros++
  }

  let num = 0n
  for (const char of text) {
    const value = VALUE_OF.get(char)
    if (value === undefined) {
      throw new Error(`Invalid Base62 character "${char}".`)
    }
    num = num * BASE + BigInt(value)
  }

  const tail: number[] = []
  while (num > 0n) {
    tail.unshift(Number(num % 256n))
    num /= 256n
  }

  const bytes = new Uint8Array(leadingZeros + tail.length)
  bytes.set(tail, leadingZeros)
  return bytes
}

/** Encode a UTF-8 string to Base62. */
export function encodeText(input: string): string {
  return bytesToBase62(new TextEncoder().encode(input))
}

/** Decode a Base62 string to a UTF-8 string. Throws on invalid input. */
export function decodeText(input: string): string {
  const bytes = base62ToBytes(input)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
