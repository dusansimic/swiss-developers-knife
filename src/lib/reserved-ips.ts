/**
 * Reserved / special-purpose IP address ranges and subnet overlap checks.
 *
 * Source: Wikipedia "List of reserved IP addresses" (IANA special-purpose
 * registries). CIDR blocks are recorded verbatim; numeric bounds are derived
 * once at module load so overlap tests are simple integer/BigInt comparisons.
 */

import { parseIpv4 } from '@/lib/ipv4'
import { parseIpv6 } from '@/lib/ipv6'

export interface ReservedRange {
  cidr: string
  description: string
}

interface ReservedRangeV4 extends ReservedRange {
  start: number
  end: number
}

interface ReservedRangeV6 extends ReservedRange {
  start: bigint
  end: bigint
}

const MAX_128 = (1n << 128n) - 1n

const RESERVED_IPV4_RAW: ReservedRange[] = [
  { cidr: '0.0.0.0/8', description: 'Current network (software scope)' },
  { cidr: '10.0.0.0/8', description: 'Private network' },
  {
    cidr: '100.64.0.0/10',
    description: 'Shared address space (carrier-grade NAT)',
  },
  { cidr: '127.0.0.0/8', description: 'Loopback (localhost)' },
  { cidr: '169.254.0.0/16', description: 'Link-local' },
  { cidr: '172.16.0.0/12', description: 'Private network' },
  { cidr: '192.0.0.0/24', description: 'IETF protocol assignments' },
  { cidr: '192.0.2.0/24', description: 'Documentation (TEST-NET-1)' },
  {
    cidr: '192.88.99.0/24',
    description: 'Reserved (formerly 6to4 relay anycast)',
  },
  { cidr: '192.168.0.0/16', description: 'Private network' },
  { cidr: '198.18.0.0/15', description: 'Benchmark testing' },
  { cidr: '198.51.100.0/24', description: 'Documentation (TEST-NET-2)' },
  { cidr: '203.0.113.0/24', description: 'Documentation (TEST-NET-3)' },
  { cidr: '224.0.0.0/4', description: 'Multicast' },
  {
    cidr: '233.252.0.0/24',
    description: 'Multicast documentation (MCAST-TEST-NET)',
  },
  { cidr: '240.0.0.0/4', description: 'Reserved for future use' },
  { cidr: '255.255.255.255/32', description: 'Limited broadcast' },
]

const RESERVED_IPV6_RAW: ReservedRange[] = [
  { cidr: '::/128', description: 'Unspecified address' },
  { cidr: '::1/128', description: 'Loopback (localhost)' },
  { cidr: '::ffff:0:0/96', description: 'IPv4-mapped addresses' },
  { cidr: '64:ff9b::/96', description: 'NAT64 IPv4/IPv6 translation' },
  { cidr: '64:ff9b:1::/48', description: 'Local-use IPv4/IPv6 translation' },
  { cidr: '100::/64', description: 'Discard prefix' },
  { cidr: '2001::/32', description: 'Teredo tunneling' },
  { cidr: '2001:20::/28', description: 'ORCHIDv2' },
  { cidr: '2001:db8::/32', description: 'Documentation and examples' },
  { cidr: '2002::/16', description: '6to4 addressing scheme' },
  { cidr: '3fff::/20', description: 'Documentation and examples' },
  { cidr: '5f00::/16', description: 'IPv6 Segment Routing (SRv6)' },
  { cidr: 'fc00::/7', description: 'Unique local addresses' },
  { cidr: 'fe80::/10', description: 'Link-local addresses' },
  { cidr: 'ff00::/8', description: 'Multicast' },
]

function boundsV4(cidr: string): { start: number; end: number } {
  const [ip, prefixText] = cidr.split('/')
  const prefix = Number(prefixText)
  const mask = prefix === 0 ? 0 : (0xff_ff_ff_ff << (32 - prefix)) >>> 0
  const start = (parseIpv4(ip as string) & mask) >>> 0
  const end = (start | (~mask >>> 0)) >>> 0
  return { start, end }
}

function boundsV6(cidr: string): { start: bigint; end: bigint } {
  const [ip, prefixText] = cidr.split('/')
  const prefix = Number(prefixText)
  const mask = prefix === 0 ? 0n : (MAX_128 << BigInt(128 - prefix)) & MAX_128
  const start = parseIpv6(ip as string) & mask
  const end = start | (~mask & MAX_128)
  return { start, end }
}

/** Reserved IPv4 ranges with precomputed numeric bounds. */
export const RESERVED_IPV4: ReservedRangeV4[] = RESERVED_IPV4_RAW.map((r) => ({
  ...r,
  ...boundsV4(r.cidr),
}))

/** Reserved IPv6 ranges with precomputed BigInt bounds. */
export const RESERVED_IPV6: ReservedRangeV6[] = RESERVED_IPV6_RAW.map((r) => ({
  ...r,
  ...boundsV6(r.cidr),
}))

/** Reserved IPv4 ranges that overlap the block [start, end] (inclusive). */
export function findReservedOverlapsV4(
  start: number,
  end: number,
): ReservedRange[] {
  return RESERVED_IPV4.filter((r) => start <= r.end && r.start <= end).map(
    ({ cidr, description }) => ({ cidr, description }),
  )
}

/** Reserved IPv6 ranges that overlap the block [start, end] (inclusive). */
export function findReservedOverlapsV6(
  start: bigint,
  end: bigint,
): ReservedRange[] {
  return RESERVED_IPV6.filter((r) => start <= r.end && r.start <= end).map(
    ({ cidr, description }) => ({ cidr, description }),
  )
}
