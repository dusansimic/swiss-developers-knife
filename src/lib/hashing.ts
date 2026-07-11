/**
 * Text and file hashing across MD5, SHA-1, the SHA-2 family and SHA-3.
 *
 * Uses hash-wasm: one-shot functions for text, and streaming hashers for files
 * so a single pass over the bytes feeds every algorithm at once (large files
 * never need to be held in memory whole).
 */

import {
  createMD5,
  createSHA1,
  createSHA3,
  createSHA224,
  createSHA256,
  createSHA384,
  createSHA512,
  type IHasher,
  md5,
  sha1,
  sha3,
  sha224,
  sha256,
  sha384,
  sha512,
} from 'hash-wasm'

export interface HashAlgorithm {
  id: string
  name: string
  /** One-shot hash of a UTF-8 string → lowercase hex. */
  hashText: (text: string) => Promise<string>
  /** Fresh streaming hasher for file input. */
  createHasher: () => Promise<IHasher>
}

export const HASH_ALGORITHMS: HashAlgorithm[] = [
  { id: 'md5', name: 'MD5', hashText: (t) => md5(t), createHasher: createMD5 },
  {
    id: 'sha1',
    name: 'SHA-1',
    hashText: (t) => sha1(t),
    createHasher: createSHA1,
  },
  {
    id: 'sha224',
    name: 'SHA-224',
    hashText: (t) => sha224(t),
    createHasher: createSHA224,
  },
  {
    id: 'sha256',
    name: 'SHA-256',
    hashText: (t) => sha256(t),
    createHasher: createSHA256,
  },
  {
    id: 'sha384',
    name: 'SHA-384',
    hashText: (t) => sha384(t),
    createHasher: createSHA384,
  },
  {
    id: 'sha512',
    name: 'SHA-512',
    hashText: (t) => sha512(t),
    createHasher: createSHA512,
  },
  {
    id: 'sha3-256',
    name: 'SHA3-256',
    hashText: (t) => sha3(t, 256),
    createHasher: () => createSHA3(256),
  },
  {
    id: 'sha3-512',
    name: 'SHA3-512',
    hashText: (t) => sha3(t, 512),
    createHasher: () => createSHA3(512),
  },
]

export type HashResults = Record<string, string>

export const OUTPUT_FORMATS = [
  { id: 'hex', name: 'Hex (lowercase)' },
  { id: 'HEX', name: 'Hex (uppercase)' },
  { id: 'base64', name: 'Base64' },
] as const

export type OutputFormat = (typeof OUTPUT_FORMATS)[number]['id']

/** Convert a lowercase hex digest to the chosen output format. */
export function formatDigest(hex: string, format: OutputFormat): string {
  if (format === 'HEX') return hex.toUpperCase()
  if (format === 'hex') return hex
  const bytes = hex.match(/../g) ?? []
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(Number.parseInt(byte, 16))
  }
  return btoa(binary)
}

/** Hash a UTF-8 string with every algorithm → { id: hex }. */
export async function hashText(text: string): Promise<HashResults> {
  const entries = await Promise.all(
    HASH_ALGORITHMS.map(
      async (algo) => [algo.id, await algo.hashText(text)] as const,
    ),
  )
  return Object.fromEntries(entries)
}

const CHUNK_SIZE = 8 * 1024 * 1024

/** Hash a file with every algorithm in a single streaming pass → { id: hex }. */
export async function hashFile(file: File): Promise<HashResults> {
  const hashers = await Promise.all(
    HASH_ALGORITHMS.map((algo) => algo.createHasher()),
  )
  for (const hasher of hashers) hasher.init()

  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    const chunk = new Uint8Array(
      await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer(),
    )
    for (const hasher of hashers) hasher.update(chunk)
  }

  const results: HashResults = {}
  HASH_ALGORITHMS.forEach((algo, i) => {
    results[algo.id] = (hashers[i] as IHasher).digest('hex')
  })
  return results
}
