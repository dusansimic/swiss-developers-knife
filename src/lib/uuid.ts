import { MAX, NIL, v1, v4, v5, v7 } from 'uuid'

/** The all-zero UUID (RFC 9562 §5.9). */
export const NIL_UUID = NIL
/** The all-one UUID (RFC 9562 §5.10). */
export const MAX_UUID = MAX

/** Standard predefined namespaces for name-based UUIDs (RFC 9562 Appendix C). */
export const NAMESPACES = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
} as const

export type NamespaceKey = keyof typeof NAMESPACES

const MAC_RE = /^([0-9a-fA-F]{2})([:-])(?:[0-9a-fA-F]{2}\2){4}[0-9a-fA-F]{2}$/
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

/**
 * Parse a MAC address (`00:1a:2b:3c:4d:5e` or `00-1a-...`) into the 6-byte node
 * array expected by the v1 generator. Throws on malformed input.
 */
export function parseMac(mac: string): Uint8Array {
  const trimmed = mac.trim()
  if (!MAC_RE.test(trimmed)) {
    throw new Error(
      'Invalid MAC address — expected 6 hex octets, e.g. 00:1a:2b:3c:4d:5e',
    )
  }
  return Uint8Array.from(
    trimmed.split(/[:-]/).map((octet) => Number.parseInt(octet, 16)),
  )
}

/** Generate a v4 (random) UUID. */
export function generateV4(): string {
  return v4()
}

/** Generate a v7 (Unix-time-ordered, sortable) UUID. */
export function generateV7(): string {
  return v7()
}

/**
 * Generate a v1 (timestamp) UUID. Without a MAC the spec-compliant random node
 * is used (browsers cannot read a hardware MAC); pass one to pin the node.
 */
export function generateV1(mac?: string): string {
  if (mac && mac.trim() !== '') {
    return v1({ node: parseMac(mac) })
  }
  return v1()
}

/** Generate a v5 (SHA-1, name-based, deterministic) UUID. */
export function generateV5(name: string, namespace: string): string {
  if (!UUID_RE.test(namespace.trim())) {
    throw new Error('Namespace must be a valid UUID.')
  }
  return v5(name, namespace.trim())
}
