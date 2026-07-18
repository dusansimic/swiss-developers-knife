import { AlertTriangle, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { parseVotes, type Round, runIRV } from '@/lib/voting'

const EXAMPLE = `alice   pizza  sushi  tacos
bob     sushi  pizza  tacos
carol   tacos  sushi  pizza
dave    pizza  tacos  sushi
erin    sushi  tacos  pizza
frank   tacos  pizza  sushi
grace   pizza  sushi  tacos`

/** A single candidate row with a proportional vote bar. */
function TallyRow({
  candidate,
  votes,
  max,
  state,
}: {
  candidate: string
  votes: number
  max: number
  state: 'winner' | 'eliminated' | 'active'
}) {
  const pct = max > 0 ? (votes / max) * 100 : 0
  const barColor =
    state === 'winner'
      ? 'var(--chart-1)'
      : state === 'eliminated'
        ? 'var(--muted-foreground)'
        : 'var(--chart-2)'
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-32 shrink-0 truncate font-mono text-sm ${
          state === 'eliminated'
            ? 'text-muted-foreground line-through'
            : 'text-foreground'
        }`}
      >
        {candidate}
      </span>
      <div className="relative h-5 flex-1 overflow-hidden rounded bg-muted">
        <div
          className="h-full rounded"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-sm tabular-nums">
        {votes}
      </span>
    </div>
  )
}

function RoundCard({ round }: { round: Round }) {
  const max = round.tallies.reduce((m, t) => Math.max(m, t.votes), 0)
  const eliminatedSet = new Set(round.eliminated)

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Round {round.index}</h3>
        <span className="text-sm text-muted-foreground">
          Majority needs {round.threshold} of {round.continuing} continuing
          {round.exhausted > 0 && ` · ${round.exhausted} exhausted`}
        </span>
      </div>

      <div className="space-y-2">
        {round.tallies.map((tally) => (
          <TallyRow
            key={tally.candidate}
            candidate={tally.candidate}
            votes={tally.votes}
            max={max}
            state={
              round.winner === tally.candidate
                ? 'winner'
                : eliminatedSet.has(tally.candidate)
                  ? 'eliminated'
                  : 'active'
            }
          />
        ))}
      </div>

      {round.winner && (
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <Trophy className="h-4 w-4" />
          {round.winner} wins with a majority
        </p>
      )}
      {round.eliminated.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Eliminated: {round.eliminated.join(', ')}
        </p>
      )}
    </div>
  )
}

export function VotingTool() {
  const [text, setText] = useState('')

  const { parsed, result } = useMemo(() => {
    const parsed = parseVotes(text)
    return { parsed, result: runIRV(parsed) }
  }, [text])

  const hasInput = text.trim() !== ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Preferential Voting
        </h1>
        <p className="text-muted-foreground">
          Instant-runoff voting. One ballot per line: the first token is the
          voter id, the rest are candidates in preference order. Everything is
          lowercased.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="votes">Ballots</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setText(EXAMPLE)}
            disabled={text === EXAMPLE}
          >
            Load example
          </Button>
        </div>
        <Textarea
          id="votes"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'voter1 apple banana cherry\nvoter2 banana cherry apple'}
          spellCheck={false}
          className="min-h-48 font-mono text-sm"
        />
      </div>

      {hasInput && (
        <>
          <Separator />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">Result</h2>
              <span className="text-sm text-muted-foreground">
                {result.ballotCount} ballot{result.ballotCount === 1 ? '' : 's'}{' '}
                · {result.candidateCount} candidate
                {result.candidateCount === 1 ? '' : 's'} ·{' '}
                {result.rounds.length} round
                {result.rounds.length === 1 ? '' : 's'}
              </span>
            </div>

            {result.winner && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-4">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">
                  Winner: <span className="text-primary">{result.winner}</span>
                </span>
              </div>
            )}

            {result.tie.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="font-medium">
                  Tie between: {result.tie.join(', ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  No candidate can reach a majority.
                </p>
              </div>
            )}

            {result.rounds.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No valid ballots to count.
              </p>
            )}

            {parsed.warnings.length > 0 && (
              <div className="space-y-1 rounded-lg border border-border p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {parsed.warnings.length} warning
                  {parsed.warnings.length === 1 ? '' : 's'}
                </p>
                <ul className="space-y-0.5 text-sm text-muted-foreground">
                  {parsed.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              {result.rounds.map((round) => (
                <RoundCard key={round.index} round={round} />
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      <p className="text-sm text-muted-foreground">
        A candidate wins on a strict majority of the continuing ballots. When no
        one has a majority, every candidate tied for the fewest votes is
        eliminated and their ballots flow to the next preference. Ballots with
        no remaining preferences are counted as exhausted.
      </p>
    </div>
  )
}
