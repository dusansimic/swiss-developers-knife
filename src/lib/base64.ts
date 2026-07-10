/**
 * Data-driven Base64 variant registry and pure encode/decode logic.
 *
 * Every variant is a full 64-character alphabet (index = 6-bit value) plus
 * padding and line-wrapping options. This uniform model handles both the
 * "standard alphabet, different last two chars" variants (RFC 4648 etc.) and
 * the fully re-ordered alphabets (crypt, bcrypt) with the same code path.
 *
 * Character data (alphabets, index-62/63, pad chars, line lengths, checksum
 * rules) is taken from the Wikipedia "Base64 — Variants" summary table and the
 * "atypical alphabet" section, not from memory.
 */

/** Base alphabet shared by the RFC 4648 family: A–Z a–z 0–9 then two symbols. */
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export interface Base64Variant {
  /** Stable identifier used as the Select value. */
  id: string
  /** Human-readable name shown in the dropdown. */
  name: string
  /** Source specification / RFC label. */
  spec: string
  /** Exactly 64 characters; the index is the 6-bit value it represents. */
  alphabet: string
  /** Padding character, or null when the variant uses no padding. */
  pad: string | null
  /** When true (with a pad char), encoding omits padding (e.g. base64url). */
  padOptional?: boolean
  /** Wrap the encoded output every N characters when set. */
  lineLength?: number
  /** Line separator for wrapping (defaults to CRLF). */
  lineSeparator?: string
  /** Ignore characters outside the alphabet when decoding (MIME behaviour). */
  ignoreUnknown?: boolean
  /** Append an OpenPGP Radix-64 CRC-24 checksum line on encode. */
  crc24?: boolean
}

/**
 * Ordered registry of Base64 variants. The first entry (standard RFC 4648 §4)
 * is the default. Adding a new variant is a single entry here.
 */
export const BASE64_VARIANTS: readonly Base64Variant[] = [
  {
    id: 'standard',
    name: 'Standard (RFC 4648 §4)',
    spec: 'RFC 4648 §4',
    alphabet: `${ALNUM}+/`,
    pad: '=',
  },
  {
    id: 'url',
    name: 'URL & Filename Safe / base64url (RFC 4648 §5)',
    spec: 'RFC 4648 §5',
    alphabet: `${ALNUM}-_`,
    pad: '=',
    // §5 makes padding optional; we omit it on encode (JWT/URL convention) and
    // tolerate it on decode.
    padOptional: true,
  },
  {
    id: 'mime',
    name: 'MIME (RFC 2045)',
    spec: 'RFC 2045',
    alphabet: `${ALNUM}+/`,
    pad: '=',
    lineLength: 76,
    lineSeparator: '\r\n',
    ignoreUnknown: true,
  },
  {
    id: 'pem',
    name: 'PEM — Privacy-Enhanced Mail (RFC 1421)',
    spec: 'RFC 1421',
    alphabet: `${ALNUM}+/`,
    pad: '=',
    lineLength: 64,
    lineSeparator: '\r\n',
    // Simplification: RFC 1421 also defines a separate CRC "MIC" field that is
    // part of the surrounding PEM message headers, not of the Base64 body, so
    // it is not produced here — only the 64-char line wrapping is applied.
  },
  {
    id: 'pkix',
    name: 'PKIX / PKCS / CMS (RFC 7468)',
    spec: 'RFC 7468',
    alphabet: `${ALNUM}+/`,
    pad: '=',
    lineLength: 64,
    lineSeparator: '\n',
  },
  {
    id: 'utf7',
    name: 'UTF-7 (RFC 2152)',
    spec: 'RFC 2152',
    alphabet: `${ALNUM}+/`,
    pad: null,
    // Simplification: only the modified-Base64 alphabet/padding of RFC 2152 is
    // implemented. The surrounding UTF-7 "+ ... -" shift sequences and the
    // UTF-16BE transform of the source text are not applied.
  },
  {
    id: 'imap',
    name: 'IMAP mailbox names (RFC 3501)',
    spec: 'RFC 3501',
    alphabet: `${ALNUM}+,`,
    pad: null,
    // Simplification: implements RFC 3501 modified Base64 (index 63 is ",",
    // no padding). The full modified-UTF-7 "& ... -" framing is not applied.
  },
  {
    id: 'openpgp',
    name: 'OpenPGP Radix-64 / ASCII armor (RFC 9580)',
    spec: 'RFC 9580 (RFC 4880)',
    alphabet: `${ALNUM}+/`,
    pad: '=',
    lineLength: 76,
    lineSeparator: '\n',
    crc24: true,
    // Produces the Radix-64 body plus the "=" + CRC-24 checksum line. The
    // full ASCII-armor headers (-----BEGIN PGP MESSAGE----- etc.) are omitted.
  },
  {
    id: 'crypt',
    name: 'crypt / GEDCOM (Unix)',
    spec: 'Unix crypt(3)',
    alphabet: `./0123456789${ALNUM.slice(0, 52)}`,
    pad: null,
  },
  {
    id: 'bcrypt',
    name: 'bcrypt',
    spec: 'bcrypt',
    alphabet: `./${ALNUM.slice(0, 52)}0123456789`,
    pad: null,
  },
  {
    id: 'y64',
    name: 'Y64 (Yahoo URL-safe)',
    spec: 'Y64',
    alphabet: `${ALNUM}._`,
    pad: '-',
  },
]

export const DEFAULT_VARIANT_ID = 'standard'

/** Look up a variant by id, falling back to the standard variant. */
export function getVariant(id: string): Base64Variant {
  return (
    BASE64_VARIANTS.find((v) => v.id === id) ??
    (BASE64_VARIANTS[0] as Base64Variant)
  )
}

/** OpenPGP Radix-64 CRC-24 over a byte sequence (RFC 9580 §6.1). */
function crc24(bytes: Uint8Array): number {
  let crc = 0xb7_04_ce
  for (const byte of bytes) {
    crc ^= byte << 16
    for (let i = 0; i < 8; i++) {
      crc <<= 1
      if (crc & 0x1_00_00_00) crc ^= 0x1_86_4c_fb
    }
  }
  return crc & 0xff_ff_ff
}

/** Wrap a string into fixed-length lines joined by a separator. */
function wrap(text: string, length: number, separator: string): string {
  const lines: string[] = []
  for (let i = 0; i < text.length; i += length) {
    lines.push(text.slice(i, i + length))
  }
  return lines.join(separator)
}

/** Encode raw bytes to a Base64 string using the given variant. */
export function bytesToBase64(
  bytes: Uint8Array,
  variant: Base64Variant,
): string {
  const a = variant.alphabet
  const len = bytes.length
  let out = ''

  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i] as number
    const has1 = i + 1 < len
    const has2 = i + 2 < len
    const b1 = has1 ? (bytes[i + 1] as number) : 0
    const b2 = has2 ? (bytes[i + 2] as number) : 0
    const triple = (b0 << 16) | (b1 << 8) | b2

    out += a[(triple >> 18) & 63]
    out += a[(triple >> 12) & 63]
    if (has1) out += a[(triple >> 6) & 63]
    if (has2) out += a[triple & 63]
  }

  // Apply padding unless the variant has no pad char or opts out of it.
  if (variant.pad && !variant.padOptional) {
    const remainder = len % 3
    if (remainder === 1) out += variant.pad.repeat(2)
    else if (remainder === 2) out += variant.pad
  }

  if (variant.crc24) {
    const checksum = crc24(bytes)
    const checksumBytes = new Uint8Array([
      (checksum >> 16) & 0xff,
      (checksum >> 8) & 0xff,
      checksum & 0xff,
    ])
    // The checksum is encoded with the same alphabet, on its own "=" line.
    const checksumText = bytesToBase64(checksumBytes, {
      ...variant,
      lineLength: undefined,
      crc24: false,
    })
    const separator = variant.lineSeparator ?? '\r\n'
    const body = variant.lineLength
      ? wrap(out, variant.lineLength, separator)
      : out
    return `${body}${separator}=${checksumText}`
  }

  if (variant.lineLength) {
    return wrap(out, variant.lineLength, variant.lineSeparator ?? '\r\n')
  }

  return out
}

/** Build a char → 6-bit-value lookup for a variant's alphabet. */
function decodeMap(variant: Base64Variant): Map<string, number> {
  const map = new Map<string, number>()
  for (let i = 0; i < variant.alphabet.length; i++) {
    map.set(variant.alphabet[i] as string, i)
  }
  return map
}

/**
 * Decode a Base64 string to raw bytes using the given variant.
 * Whitespace is always ignored; a trailing CRC-24 line is stripped for
 * OpenPGP. Throws on malformed input.
 */
export function base64ToBytes(
  input: string,
  variant: Base64Variant,
): Uint8Array {
  let text = input

  // OpenPGP: drop the "=<4 base64 chars>" checksum line before decoding.
  if (variant.crc24) {
    text = text.replace(/\r?\n=[^\s]{4}\s*$/, '')
  }

  const map = decodeMap(variant)
  const values: number[] = []

  for (const char of text) {
    if (char === '\n' || char === '\r' || char === '\t' || char === ' ') {
      continue
    }
    if (variant.pad && char === variant.pad) continue
    const value = map.get(char)
    if (value === undefined) {
      if (variant.ignoreUnknown) continue
      throw new Error(`Invalid character "${char}" for ${variant.name}.`)
    }
    values.push(value)
  }

  if (values.length % 4 === 1) {
    throw new Error('Invalid Base64 length.')
  }

  const bytes: number[] = []
  let bitBuffer = 0
  let bitCount = 0
  for (const value of values) {
    bitBuffer = (bitBuffer << 6) | value
    bitCount += 6
    if (bitCount >= 8) {
      bitCount -= 8
      bytes.push((bitBuffer >> bitCount) & 0xff)
    }
  }

  return Uint8Array.from(bytes)
}

/** Encode a UTF-8 string to Base64 with the given variant. */
export function encodeText(input: string, variant: Base64Variant): string {
  return bytesToBase64(new TextEncoder().encode(input), variant)
}

/** Decode a Base64 string to a UTF-8 string with the given variant. Throws on invalid input. */
export function decodeText(input: string, variant: Base64Variant): string {
  const bytes = base64ToBytes(input, variant)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
