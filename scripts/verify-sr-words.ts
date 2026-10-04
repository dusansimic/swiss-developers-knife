/**
 * Dev-only check of the Serbian adjective + animal word lists against the
 * srLex 1.3 inflectional lexicon (CC BY-SA 4.0, CLARIN.SI,
 * http://hdl.handle.net/11356/1233). Not part of the app build.
 *
 * Usage:
 *   node scripts/verify-sr-words.ts /tmp/srLex_v1.3.gz
 *   node scripts/verify-sr-words.ts /tmp/srLex_v1.3.gz --suggest brzi lisica
 *
 * Default mode verifies `src/lib/adjective-animal-sr.ts` and exits non-zero on
 * errors. `--suggest` prints srLex forms/genders for the given words, to help
 * write new list entries.
 *
 * srLex rows are tab-separated: form, lemma, MSD (MULTEXT-East v6), MSD
 * features, UPOS, UD features, frequency, per-million frequency.
 */
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { createGunzip } from 'node:zlib'
import {
  type Gender,
  SR_ADJECTIVES,
  SR_ANIMALS,
} from '../src/lib/adjective-animal-sr.ts'

/** Below this corpus frequency a word is flagged as rare. */
const RARE_COUNT = 10

/** Latin spellings where a digraph would span a morpheme boundary. */
const BOUNDARY_DIGRAPHS = /(nad|pod|od|pred)ž|injek|konjunk/

interface Lexicon {
  /** Definite masc. nom. sg. adjective form → its lemmas. */
  mascLemmas: Map<string, Set<string>>
  /** Adjective lemma → definite fem./neut. nom. sg. forms. */
  forms: Map<string, { f: Set<string>; n: Set<string> }>
  /** Noun lemma → gender → corpus frequency of the nom. sg. form. */
  nouns: Map<string, Map<Gender, number>>
  /** Corpus frequency of definite masc. nom. sg. adjective forms. */
  adjFreq: Map<string, number>
}

async function loadLexicon(path: string, words: Set<string>): Promise<Lexicon> {
  const lex: Lexicon = {
    mascLemmas: new Map(),
    forms: new Map(),
    nouns: new Map(),
    adjFreq: new Map(),
  }
  const lines = createInterface({
    input: createReadStream(path).pipe(createGunzip()),
    crlfDelay: Number.POSITIVE_INFINITY,
  })

  for await (const line of lines) {
    const [form, lemma, msd, , , , count] = line.split('\t')
    if (!form || !lemma || !msd) continue
    const freq = Number(count) || 0

    if (msd === 'Agpmsny') {
      if (!words.has(form)) continue
      const lemmas = lex.mascLemmas.get(form) ?? new Set()
      lemmas.add(lemma)
      lex.mascLemmas.set(form, lemmas)
      lex.adjFreq.set(form, (lex.adjFreq.get(form) ?? 0) + freq)
    } else if (msd === 'Agpfsny' || msd === 'Agpnsny') {
      const entry = lex.forms.get(lemma) ?? { f: new Set(), n: new Set() }
      entry[msd === 'Agpfsny' ? 'f' : 'n'].add(form)
      lex.forms.set(lemma, entry)
    } else if (form === lemma && words.has(form)) {
      const match = /^Nc([mfn])sn/.exec(msd)
      if (!match) continue
      const genders = lex.nouns.get(form) ?? new Map<Gender, number>()
      const gender = match[1] as Gender
      genders.set(gender, (genders.get(gender) ?? 0) + freq)
      lex.nouns.set(form, genders)
    }
  }
  return lex
}

/** Expected fem./neut. forms for a masc. adjective form, per srLex. */
function expectedForms(lex: Lexicon, masc: string) {
  const f = new Set<string>()
  const n = new Set<string>()
  for (const lemma of lex.mascLemmas.get(masc) ?? []) {
    const entry = lex.forms.get(lemma)
    for (const form of entry?.f ?? []) f.add(form)
    for (const form of entry?.n ?? []) n.add(form)
  }
  return { f, n }
}

function fmt(set: Set<string>): string {
  return set.size ? [...set].join(' / ') : '(none)'
}

function suggest(lex: Lexicon, words: string[]) {
  for (const word of words) {
    const { f, n } = expectedForms(lex, word)
    if (f.size || n.size) {
      const freq = lex.adjFreq.get(word) ?? 0
      console.log(`adj  ${word}  f: ${fmt(f)}  n: ${fmt(n)}  (freq ${freq})`)
    }
    const genders = lex.nouns.get(word)
    if (genders) {
      const list = [...genders]
        .map(([g, freq]) => `${g} (freq ${freq})`)
        .join(', ')
      console.log(`noun ${word}  ${list}`)
    }
    if (!f.size && !n.size && !genders) console.log(`???  ${word}  not found`)
  }
}

function verify(lex: Lexicon): number {
  let errors = 0
  let warnings = 0
  const error = (msg: string) => {
    errors++
    console.log(`error  ${msg}`)
  }
  const warn = (msg: string) => {
    warnings++
    console.log(`warn   ${msg}`)
  }

  const seen = new Set<string>()
  const checkWord = (word: string, where: string) => {
    if (!/^[a-zčćšžđ]+$/.test(word)) error(`${where}: "${word}" bad characters`)
    if (BOUNDARY_DIGRAPHS.test(word)) {
      warn(`${where}: "${word}" may transliterate wrongly to Cyrillic`)
    }
  }

  for (const adj of SR_ADJECTIVES) {
    const where = `adjective ${adj.m}`
    if (seen.has(`a:${adj.m}`)) error(`${where}: duplicate`)
    seen.add(`a:${adj.m}`)
    for (const form of [adj.m, adj.f, adj.n]) checkWord(form, where)

    if (!lex.mascLemmas.has(adj.m)) {
      error(`${where}: not a definite masc. nom. sg. adjective in srLex`)
      continue
    }
    const { f, n } = expectedForms(lex, adj.m)
    if (!f.has(adj.f)) error(`${where}: f "${adj.f}", srLex has ${fmt(f)}`)
    if (!n.has(adj.n)) error(`${where}: n "${adj.n}", srLex has ${fmt(n)}`)
    const freq = lex.adjFreq.get(adj.m) ?? 0
    if (freq < RARE_COUNT) warn(`${where}: rare (freq ${freq})`)
  }

  for (const animal of SR_ANIMALS) {
    const where = `animal ${animal.word}`
    if (seen.has(`n:${animal.word}`)) error(`${where}: duplicate`)
    seen.add(`n:${animal.word}`)
    checkWord(animal.word, where)

    const genders = lex.nouns.get(animal.word)
    if (!genders) {
      error(`${where}: not a common noun (nom. sg.) in srLex`)
      continue
    }
    if (!genders.has(animal.gender)) {
      error(
        `${where}: gender ${animal.gender}, srLex has ${[...genders.keys()]}`,
      )
    } else if (genders.size > 1) {
      warn(`${where}: srLex lists several genders ${[...genders.keys()]}`)
    }
    const freq = genders.get(animal.gender) ?? 0
    if (freq < RARE_COUNT) warn(`${where}: rare (freq ${freq})`)
  }

  const byGender = { m: 0, f: 0, n: 0 }
  for (const animal of SR_ANIMALS) byGender[animal.gender]++
  console.log(
    `\n${SR_ADJECTIVES.length} adjectives, ${SR_ANIMALS.length} animals ` +
      `(m ${byGender.m}, f ${byGender.f}, n ${byGender.n})`,
  )
  console.log(`${errors} errors, ${warnings} warnings`)
  return errors
}

async function main() {
  const args = process.argv.slice(2)
  const path = args[0]
  if (!path) {
    console.error('usage: verify-sr-words.ts <srLex_v1.3.gz> [--suggest w…]')
    process.exit(2)
  }

  if (args[1] === '--suggest') {
    const words = args.slice(2)
    suggest(await loadLexicon(path, new Set(words)), words)
    return
  }

  const words = new Set<string>()
  for (const adj of SR_ADJECTIVES) words.add(adj.m)
  for (const animal of SR_ANIMALS) words.add(animal.word)
  const errors = verify(await loadLexicon(path, words))
  process.exit(errors ? 1 : 0)
}

await main()
