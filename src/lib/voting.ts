/**
 * Instant-runoff (preferential / ranked-choice) voting.
 *
 * Input is one ballot per line: the first whitespace-separated token is the
 * voter id, the rest are that voter's candidates in preference order. Everything
 * is lowercased. Each round every ballot counts towards its highest-ranked
 * candidate that is still in the race; a candidate with a strict majority of the
 * continuing (non-exhausted) ballots wins. Otherwise the candidate(s) tied for
 * the fewest votes are eliminated and the ballots redistributed.
 */

export interface Ballot {
  voter: string
  /** Candidates in preference order, de-duplicated. */
  preferences: string[]
}

export interface ParsedVotes {
  ballots: Ballot[]
  candidates: string[]
  warnings: string[]
}

/** Parse the raw textarea contents into ballots and the candidate set. */
export function parseVotes(text: string): ParsedVotes {
  const warnings: string[] = []
  const ballots: Ballot[] = []
  const candidates = new Set<string>()
  const seenVoters = new Set<string>()

  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed === '') continue

    const tokens = trimmed.toLowerCase().split(/\s+/)
    const voter = tokens[0]
    const rawPrefs = tokens.slice(1)

    if (rawPrefs.length === 0) {
      warnings.push(
        `Line ${i + 1}: voter "${voter}" has no preferences — skipped.`,
      )
      continue
    }

    const seen = new Set<string>()
    const preferences: string[] = []
    for (const pref of rawPrefs) {
      if (seen.has(pref)) {
        warnings.push(
          `Line ${i + 1}: duplicate preference "${pref}" for "${voter}" — ignored.`,
        )
        continue
      }
      seen.add(pref)
      preferences.push(pref)
      candidates.add(pref)
    }

    if (seenVoters.has(voter)) {
      warnings.push(
        `Voter id "${voter}" appears more than once — counted as separate ballots.`,
      )
    }
    seenVoters.add(voter)
    ballots.push({ voter, preferences })
  }

  return {
    ballots,
    candidates: [...candidates].sort((a, b) => a.localeCompare(b)),
    warnings,
  }
}

export interface RoundTally {
  candidate: string
  votes: number
}

export interface Round {
  /** 1-based round number. */
  index: number
  /** Active candidates this round, sorted by votes desc then name. */
  tallies: RoundTally[]
  /** Ballots whose preferences are all eliminated. */
  exhausted: number
  /** Non-exhausted ballots — the base for the majority threshold. */
  continuing: number
  /** Votes needed for a strict majority of the continuing ballots. */
  threshold: number
  /** Candidate(s) eliminated at the end of this round. */
  eliminated: string[]
  /** Set when this round produces a winner. */
  winner: string | null
}

export interface IRVResult {
  rounds: Round[]
  winner: string | null
  /** Candidates left tied when no majority can be reached. */
  tie: string[]
  ballotCount: number
  candidateCount: number
}

/** Run instant-runoff voting over parsed ballots. */
export function runIRV(parsed: ParsedVotes): IRVResult {
  const { ballots, candidates } = parsed
  const base: Omit<IRVResult, 'rounds' | 'winner' | 'tie'> = {
    ballotCount: ballots.length,
    candidateCount: candidates.length,
  }

  if (ballots.length === 0 || candidates.length === 0) {
    return { rounds: [], winner: null, tie: [], ...base }
  }

  const eliminated = new Set<string>()
  const rounds: Round[] = []

  // At most one elimination step per candidate, plus a safety margin.
  for (let index = 1; index <= candidates.length + 1; index++) {
    const active = candidates.filter((c) => !eliminated.has(c))

    const counts = new Map<string, number>(active.map((c) => [c, 0]))
    let exhausted = 0
    for (const ballot of ballots) {
      const choice = ballot.preferences.find((p) => !eliminated.has(p))
      if (choice === undefined) exhausted++
      else counts.set(choice, (counts.get(choice) ?? 0) + 1)
    }

    const continuing = ballots.length - exhausted
    const threshold = Math.floor(continuing / 2) + 1
    const tallies: RoundTally[] = active
      .map((candidate) => ({ candidate, votes: counts.get(candidate) ?? 0 }))
      .sort(
        (a, b) => b.votes - a.votes || a.candidate.localeCompare(b.candidate),
      )

    const top = tallies[0]

    // Outright winner: only one candidate left, or a strict majority.
    if (
      active.length === 1 ||
      (top && continuing > 0 && top.votes >= threshold)
    ) {
      const winner = active.length === 1 ? active[0] : top.candidate
      rounds.push({
        index,
        tallies,
        exhausted,
        continuing,
        threshold,
        eliminated: [],
        winner,
      })
      return { rounds, winner, tie: [], ...base }
    }

    // Eliminate everyone tied for the fewest votes.
    const min = Math.min(...tallies.map((t) => t.votes))
    const losers = tallies
      .filter((t) => t.votes === min)
      .map((t) => t.candidate)

    // If that would remove every remaining candidate, it's an unbreakable tie.
    if (losers.length === active.length) {
      rounds.push({
        index,
        tallies,
        exhausted,
        continuing,
        threshold,
        eliminated: [],
        winner: null,
      })
      return { rounds, winner: null, tie: active, ...base }
    }

    for (const loser of losers) eliminated.add(loser)
    rounds.push({
      index,
      tallies,
      exhausted,
      continuing,
      threshold,
      eliminated: losers,
      winner: null,
    })
  }

  return { rounds, winner: null, tie: [], ...base }
}
