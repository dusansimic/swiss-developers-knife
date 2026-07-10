/**
 * IPv4 subnet math. Addresses are handled as unsigned 32-bit integers
 * (`>>> 0` keeps JS bitwise results unsigned).
 */

export interface Ipv4Subnet {
  prefix: number
  networkAddress: string
  netmask: string
  broadcastAddress: string
  /** First usable host address. */
  startAddress: string
  /** Last usable host address. */
  endAddress: string
  /** Number of usable host addresses. */
  usableHosts: number
  /** First address of the whole block (network) as an unsigned 32-bit int. */
  rangeStart: number
  /** Last address of the whole block (broadcast) as an unsigned 32-bit int. */
  rangeEnd: number
}

/** Parse dotted-quad IPv4 to an unsigned 32-bit integer. Throws on bad input. */
export function parseIpv4(input: string): number {
  const parts = input.trim().split('.')
  if (parts.length !== 4) {
    throw new Error('IPv4 address must have four octets.')
  }
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      throw new Error(`Invalid octet "${part}".`)
    }
    const octet = Number(part)
    if (octet > 255) {
      throw new Error(`Octet "${part}" is out of range (0-255).`)
    }
    value = value * 256 + octet
  }
  return value >>> 0
}

/** Format an unsigned 32-bit integer as dotted-quad IPv4. */
export function toIpv4(value: number): string {
  return [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ].join('.')
}

/** Netmask (as unsigned 32-bit int) for a prefix length. */
function maskForPrefix(prefix: number): number {
  return prefix === 0 ? 0 : (0xff_ff_ff_ff << (32 - prefix)) >>> 0
}

/** Dotted-quad netmask for a prefix length (0-32). */
export function ipv4Netmask(prefix: number): string {
  return toIpv4(maskForPrefix(prefix))
}

/** All prefix lengths 0-32 with their netmasks, for a prefix picker. */
export function ipv4PrefixOptions(): { prefix: number; netmask: string }[] {
  return Array.from({ length: 33 }, (_, prefix) => ({
    prefix,
    netmask: ipv4Netmask(prefix),
  }))
}

/** Compute subnet details for an IPv4 address and prefix length (0-32). */
export function calculateIpv4(input: string, prefix: number): Ipv4Subnet {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error('Prefix must be an integer between 0 and 32.')
  }
  const ip = parseIpv4(input)
  const mask = maskForPrefix(prefix)
  const network = (ip & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0

  let startAddress: string
  let endAddress: string
  let broadcastAddress: string
  let usableHosts: number

  if (prefix >= 31) {
    // /31 (RFC 3021 point-to-point) and /32 have no broadcast; every address
    // in the block is usable.
    startAddress = toIpv4(network)
    endAddress = toIpv4(broadcast)
    broadcastAddress = '—'
    usableHosts = prefix === 32 ? 1 : 2
  } else {
    startAddress = toIpv4((network + 1) >>> 0)
    endAddress = toIpv4((broadcast - 1) >>> 0)
    broadcastAddress = toIpv4(broadcast)
    usableHosts = 2 ** (32 - prefix) - 2
  }

  return {
    prefix,
    networkAddress: toIpv4(network),
    netmask: toIpv4(mask),
    broadcastAddress,
    startAddress,
    endAddress,
    usableHosts,
    rangeStart: network,
    rangeEnd: broadcast,
  }
}
