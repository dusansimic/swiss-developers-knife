/**
 * Fixed-width integer base conversion (binary / octal / decimal / hex).
 *
 * A value is stored canonically as its raw unsigned bit pattern (`bits`) within
 * a chosen bit width, using BigInt so 64-bit values are exact. Binary, octal
 * and hex are read/written as the unsigned pattern; decimal is read/written as
 * the two's-complement signed value. The signed vs unsigned readings of the
 * same pattern are what the binary showcase surfaces.
 */

export type BitWidth = 8 | 16 | 32 | 64

export const BIT_WIDTHS: readonly BitWidth[] = [8, 16, 32, 64]

export type Base = 'bin' | 'oct' | 'dec' | 'hex'

export const BASES: readonly Base[] = ['bin', 'oct', 'dec', 'hex']

/** All-ones mask for a width, e.g. 8 → 0xFF. */
export function maskFor(width: BitWidth): bigint {
  return (1n << BigInt(width)) - 1n
}

/** Interpret an unsigned bit pattern as a two's-complement signed value. */
export function toSigned(bits: bigint, width: BitWidth): bigint {
  const signBit = 1n << BigInt(width - 1)
  return bits & signBit ? bits - (1n << BigInt(width)) : bits
}

const PREFIX: Record<Exclude<Base, 'dec'>, string> = {
  bin: '0b',
  oct: '0o',
  hex: '0x',
}
const DIGITS: Record<Base, RegExp> = {
  bin: /^[01]+$/,
  oct: /^[0-7]+$/,
  dec: /^[+-]?[0-9]+$/,
  hex: /^[0-9a-f]+$/,
}

/**
 * Parse a string in the given base into the canonical unsigned bit pattern for
 * `width`. Decimal accepts a leading sign; the others are unsigned. Underscores
 * and spaces are allowed as digit separators. Throws on invalid digits or a
 * value that does not fit the width.
 */
export function parseValue(input: string, base: Base, width: BitWidth): bigint {
  const s = input.trim().replace(/[_\s]/g, '').toLowerCase()
  if (s === '') throw new Error('Empty input.')
  if (!DIGITS[base].test(s)) throw new Error(`Invalid ${base} digits.`)

  const mask = maskFor(width)

  if (base === 'dec') {
    const value = BigInt(s)
    const min = -(1n << BigInt(width - 1))
    if (value < min || value > mask) {
      throw new Error(`Value does not fit in ${width} bits.`)
    }
    // BigInt bitwise AND yields the two's-complement low bits for negatives.
    return value & mask
  }

  const value = BigInt(PREFIX[base] + s)
  if (value > mask) throw new Error(`Value does not fit in ${width} bits.`)
  return value
}

/** Format the canonical bit pattern into the given base for display. */
export function formatValue(bits: bigint, base: Base, width: BitWidth): string {
  switch (base) {
    case 'bin':
      return bits.toString(2).padStart(width, '0')
    case 'oct':
      return bits.toString(8)
    case 'hex':
      return bits.toString(16).toUpperCase()
    case 'dec':
      return toSigned(bits, width).toString()
  }
}
