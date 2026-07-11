/**
 * Build a vCard 3.0 document from a name (required) plus optional phone/email.
 */

export interface VcardInput {
  name: string
  phone?: string
  email?: string
}

/** Escape a value for a vCard property per RFC 6350 (backslash, comma, ...). */
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

/** Build a vCard string. Returns '' when the name is empty. */
export function buildVcard({ name, phone, email }: VcardInput): string {
  const fullName = name.trim()
  if (fullName === '') return ''

  const parts = fullName.split(/\s+/)
  const given = parts[0] ?? ''
  const family = parts.slice(1).join(' ')

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeValue(family)};${escapeValue(given)};;;`,
    `FN:${escapeValue(fullName)}`,
  ]
  if (phone?.trim()) lines.push(`TEL;TYPE=CELL:${escapeValue(phone.trim())}`)
  if (email?.trim())
    lines.push(`EMAIL;TYPE=INTERNET:${escapeValue(email.trim())}`)
  lines.push('END:VCARD')

  // vCard lines are CRLF-terminated.
  return `${lines.join('\r\n')}\r\n`
}

/** A safe `.vcf` filename derived from the contact name. */
export function vcardFilename(name: string): string {
  const base = name
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `${base || 'contact'}.vcf`
}
