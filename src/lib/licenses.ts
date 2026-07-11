/**
 * Bundled full-text open source licenses with placeholder filling.
 *
 * Texts are imported verbatim (`?raw`) so their line breaks match the canonical
 * files: GNU GPL/LGPL as published by the FSF, BSD wrapped to 80 columns like a
 * typical GitHub LICENSE file. Placeholders for the copyright holder and year
 * are filled in; an empty name falls back to `<name>`.
 */

import bsd2 from '@/lib/licenses/bsd-2-clause.txt?raw'
import bsd3 from '@/lib/licenses/bsd-3-clause.txt?raw'
import gpl2 from '@/lib/licenses/gpl-2.0.txt?raw'
import lgpl21 from '@/lib/licenses/lgpl-2.1.txt?raw'

export interface License {
  id: string
  name: string
  text: string
}

export const LICENSES: License[] = [
  { id: 'bsd-2-clause', name: 'BSD 2-Clause', text: bsd2 },
  { id: 'bsd-3-clause', name: 'BSD 3-Clause', text: bsd3 },
  { id: 'gpl-2.0', name: 'GPL 2.0', text: gpl2 },
  { id: 'lgpl-2.1', name: 'LGPL 2.1', text: lgpl21 },
]

const NAME_PLACEHOLDER = '<name>'

/**
 * Fill copyright-holder and year placeholders. An empty name leaves the literal
 * `<name>` placeholder in place.
 */
export function fillLicense(text: string, name: string, year: number): string {
  const owner = name.trim() || NAME_PLACEHOLDER
  return text
    .replaceAll('<owner>', owner)
    .replaceAll('<name of author>', owner)
    .replaceAll('<year>', String(year))
}
