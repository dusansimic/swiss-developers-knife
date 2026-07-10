/**
 * IPv6 subnet math and address formatting.
 *
 * Addresses are handled as 128-bit BigInts. Three display forms are supported,
 * matching the Wikipedia "Address representation" section:
 *  - `full`          all 8 groups, 4 hex digits each (leading zeros kept)
 *  - `noLeadingZero` all 8 groups, leading zeros removed
 *  - `compressed`    leading zeros removed + the longest run of consecutive
 *                    all-zero groups collapsed to `::` (the default)
 */

export type Ipv6Format = 'compressed' | 'noLeadingZero' | 'full'

export const IPV6_FORMATS: { id: Ipv6Format; name: string }[] = [
  { id: 'compressed', name: 'Compressed (collapse zeros with ::)' },
  { id: 'noLeadingZero', name: 'Omit leading zeros' },
  { id: 'full', name: 'Full (all leading zeros)' },
]

export const DEFAULT_IPV6_FORMAT: Ipv6Format = 'compressed'

const MAX_128 = (1n << 128n) - 1n

export interface Ipv6Subnet {
  prefix: number
  networkAddress: string
  netmask: string
  /** First address in the block. */
  startAddress: string
  /** Last address in the block. */
  endAddress: string
  /** First address of the block (network) as a 128-bit BigInt. */
  rangeStart: bigint
  /** Last address of the block as a 128-bit BigInt. */
  rangeEnd: bigint
}

/** Parse an IPv6 string (supports `::` and a trailing embedded IPv4) to BigInt. */
export function parseIpv6(input: string): bigint {
  let text = input.trim()
  if (text === '') throw new Error('Empty address.')

  // Embedded IPv4 tail, e.g. ::ffff:192.168.0.1 → convert to two hex groups.
  const lastColon = text.lastIndexOf(':')
  if (text.includes('.')) {
    const tail = text.slice(lastColon + 1)
    const octets = tail.split('.')
    if (octets.length !== 4) throw new Error('Invalid embedded IPv4.')
    let v = 0
    for (const o of octets) {
      if (!/^\d{1,3}$/.test(o) || Number(o) > 255) {
        throw new Error(`Invalid embedded IPv4 octet "${o}".`)
      }
      v = v * 256 + Number(o)
    }
    const hi = (v >>> 16) & 0xff_ff
    const lo = v & 0xff_ff
    text = `${text.slice(0, lastColon + 1)}${hi.toString(16)}:${lo.toString(16)}`
  }

  const doubleColon = text.split('::')
  if (doubleColon.length > 2) {
    throw new Error('"::" may only appear once.')
  }

  const parseGroups = (part: string): number[] => {
    if (part === '') return []
    return part.split(':').map((g) => {
      if (!/^[0-9a-fA-F]{1,4}$/.test(g)) {
        throw new Error(`Invalid group "${g}".`)
      }
      return Number.parseInt(g, 16)
    })
  }

  let groups: number[]
  if (doubleColon.length === 2) {
    const head = parseGroups(doubleColon[0] as string)
    const tail = parseGroups(doubleColon[1] as string)
    const missing = 8 - head.length - tail.length
    if (missing < 1) {
      throw new Error('"::" must collapse at least one group.')
    }
    groups = [...head, ...new Array<number>(missing).fill(0), ...tail]
  } else {
    groups = parseGroups(text)
    if (groups.length !== 8) {
      throw new Error('Address must have 8 groups (or use "::").')
    }
  }

  let value = 0n
  for (const g of groups) {
    value = (value << 16n) | BigInt(g)
  }
  return value
}

/** Split a 128-bit BigInt into its 8 16-bit groups. */
function toGroups(value: bigint): number[] {
  const groups: number[] = []
  for (let shift = 112n; shift >= 0n; shift -= 16n) {
    groups.push(Number((value >> shift) & 0xff_ffn))
  }
  return groups
}

/** Format a 128-bit BigInt as an IPv6 string in the requested form. */
export function formatIpv6(value: bigint, format: Ipv6Format): string {
  const groups = toGroups(value)

  if (format === 'full') {
    return groups.map((g) => g.toString(16).padStart(4, '0')).join(':')
  }

  const hex = groups.map((g) => g.toString(16))
  if (format === 'noLeadingZero') {
    return hex.join(':')
  }

  // compressed: collapse the longest run of zero groups (length >= 2) with "::".
  let bestStart = -1
  let bestLen = 0
  let curStart = -1
  let curLen = 0
  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === 0) {
      if (curStart === -1) curStart = i
      curLen++
      if (curLen > bestLen) {
        bestLen = curLen
        bestStart = curStart
      }
    } else {
      curStart = -1
      curLen = 0
    }
  }

  if (bestLen < 2) {
    return hex.join(':')
  }

  const head = hex.slice(0, bestStart)
  const tail = hex.slice(bestStart + bestLen)
  return `${head.join(':')}::${tail.join(':')}`
}

/** Netmask (as 128-bit BigInt) for a prefix length. */
function maskForPrefix(prefix: number): bigint {
  return prefix === 0 ? 0n : (MAX_128 << BigInt(128 - prefix)) & MAX_128
}

/** Netmask address for a prefix length (0-128), in the given display form. */
export function ipv6Netmask(prefix: number, format: Ipv6Format): string {
  return formatIpv6(maskForPrefix(prefix), format)
}

/** All prefix lengths 0-128 with their netmasks, for a prefix picker. */
export function ipv6PrefixOptions(
  format: Ipv6Format,
): { prefix: number; netmask: string }[] {
  return Array.from({ length: 129 }, (_, prefix) => ({
    prefix,
    netmask: ipv6Netmask(prefix, format),
  }))
}

/** Compute subnet details for an IPv6 address and prefix length (0-128). */
export function calculateIpv6(
  input: string,
  prefix: number,
  format: Ipv6Format,
): Ipv6Subnet {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) {
    throw new Error('Prefix must be an integer between 0 and 128.')
  }
  const ip = parseIpv6(input)
  const mask = maskForPrefix(prefix)
  const network = ip & mask
  const last = network | (~mask & MAX_128)

  return {
    prefix,
    networkAddress: formatIpv6(network, format),
    netmask: formatIpv6(mask, format),
    startAddress: formatIpv6(network, format),
    endAddress: formatIpv6(last, format),
    rangeStart: network,
    rangeEnd: last,
  }
}
