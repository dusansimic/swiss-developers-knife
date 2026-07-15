/**
 * IEEE 754 binary floating-point encode/decode and field decomposition for
 * single (32-bit) and double (64-bit) precision.
 *
 * The bit pattern is carried as a BigInt so both widths use one code path and
 * 64-bit patterns stay exact. Encoding/decoding goes through a DataView so the
 * platform's own IEEE 754 rounding is used rather than a hand-rolled one.
 */

export type FloatKind = 'f32' | 'f64'

export interface FloatFormat {
  kind: FloatKind
  /** Human label for the precision selector. */
  label: string
  /** Total bit width. */
  width: 32 | 64
  /** Exponent field width in bits. */
  exponentBits: number
  /** Mantissa (fraction) field width in bits. */
  mantissaBits: number
  /** Exponent bias. */
  bias: number
}

export const FLOAT_FORMATS: Record<FloatKind, FloatFormat> = {
  f32: {
    kind: 'f32',
    label: 'Float (32-bit)',
    width: 32,
    exponentBits: 8,
    mantissaBits: 23,
    bias: 127,
  },
  f64: {
    kind: 'f64',
    label: 'Double (64-bit)',
    width: 64,
    exponentBits: 11,
    mantissaBits: 52,
    bias: 1023,
  },
}

/** Encode a JS number into the IEEE 754 bit pattern for the given format. */
export function floatToBits(value: number, fmt: FloatFormat): bigint {
  const view = new DataView(new ArrayBuffer(8))
  if (fmt.width === 32) {
    view.setFloat32(0, value)
    return BigInt(view.getUint32(0))
  }
  view.setFloat64(0, value)
  return view.getBigUint64(0)
}

/** Decode an IEEE 754 bit pattern back into a JS number. */
export function bitsToFloat(bits: bigint, fmt: FloatFormat): number {
  const view = new DataView(new ArrayBuffer(8))
  if (fmt.width === 32) {
    view.setUint32(0, Number(bits & 0xff_ff_ff_ffn))
    return view.getFloat32(0)
  }
  view.setBigUint64(0, bits & 0xff_ff_ff_ff_ff_ff_ff_ffn)
  return view.getFloat64(0)
}

/**
 * Parse a decimal float, accepting the IEEE special values (case-insensitive
 * `inf`/`infinity`/`nan`, with optional sign) and signed zero. Throws on
 * anything Number() can't represent.
 */
export function parseFloatInput(input: string): number {
  const text = input.trim()
  if (text === '') throw new Error('Empty input.')
  if (/^[+-]?inf(inity)?$/i.test(text)) {
    return text.startsWith('-')
      ? Number.NEGATIVE_INFINITY
      : Number.POSITIVE_INFINITY
  }
  if (/^[+-]?nan$/i.test(text)) return Number.NaN
  const value = Number(text)
  if (Number.isNaN(value)) throw new Error('Invalid number.')
  return value
}

/** Format a number for the decimal field, preserving negative zero. */
export function formatFloat(value: number): string {
  if (Object.is(value, -0)) return '-0'
  return String(value)
}

export type FloatCategory = 'zero' | 'subnormal' | 'normal' | 'infinity' | 'nan'

export interface FloatParts {
  /** Raw sign bit (0 or 1). */
  sign: number
  /** Raw (biased) exponent field. */
  exponentRaw: bigint
  /** Unbiased exponent, or null for infinity/NaN. */
  exponentUnbiased: number | null
  /** Raw mantissa field. */
  mantissaRaw: bigint
  category: FloatCategory
  /** The decoded numeric value. */
  value: number
}

/** Split a bit pattern into its sign / exponent / mantissa fields. */
export function decompose(bits: bigint, fmt: FloatFormat): FloatParts {
  const sign = Number((bits >> BigInt(fmt.width - 1)) & 1n)
  const exponentMask = (1n << BigInt(fmt.exponentBits)) - 1n
  const exponentRaw = (bits >> BigInt(fmt.mantissaBits)) & exponentMask
  const mantissaRaw = bits & ((1n << BigInt(fmt.mantissaBits)) - 1n)

  let category: FloatCategory
  let exponentUnbiased: number | null
  if (exponentRaw === 0n) {
    category = mantissaRaw === 0n ? 'zero' : 'subnormal'
    // Subnormals use the minimum exponent (1 - bias).
    exponentUnbiased = 1 - fmt.bias
  } else if (exponentRaw === exponentMask) {
    category = mantissaRaw === 0n ? 'infinity' : 'nan'
    exponentUnbiased = null
  } else {
    category = 'normal'
    exponentUnbiased = Number(exponentRaw) - fmt.bias
  }

  return {
    sign,
    exponentRaw,
    exponentUnbiased,
    mantissaRaw,
    category,
    value: bitsToFloat(bits, fmt),
  }
}
