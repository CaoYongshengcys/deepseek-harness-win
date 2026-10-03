# Agent Note: Headless run token summary

Status: implemented

English | [中文](2026-09-08-headless-run-token-summary.zh.md)

## Problem

`dsh --profile headless` printed the final assistant text and exited, and nothing told the operator what the run cost. token-meter already folds whole-log provider usage into the `tokenUsage` session projection and the Web chat stats line reads it, but the one-shot surface — the one scripts and CI actually use — had no read of it, so answering "how many tokens did this run use?" meant opening the persisted session log by hand.

## Decision

**The runner writes one stderr summary line before requesting exit:** `dsh: tokens: input N, output N, cache read N, cache write N, total N`. It reads token-meter's whole-log `tokenUsage` projection through the optional `ctx.sessionProjections` registry, so stdout stays the answer alone and piping or `$(...)` capture is unchanged.

**The four buckets are printed as the projection carries them, never re-folded in the bundle.** The projection owns the last-sample-replacing rule that keeps a step's early usage chunk and its finalized assistant message from counting twice; a second fold here would duplicate that rule and could drift from it.

**No summary when there is nothing to bill.** A composition without the projection seam, or a run whose provider never reported usage — a turn that failed before any usage sample landed — prints no line instead of four zeros, so a failure's own stderr message stays the last word.

## Alternatives considered

**Print the summary on stdout after the answer.** Rejected: the profile's contract is format-pure stdout, and every consumer that captures the answer would have to strip a trailing line it did not ask for.

**Gate the line behind a `--tokens` flag or a runner config field.** Rejected: stderr is already this app's diagnostic channel, so the summary cannot corrupt captured output, and no current consumer needs it suppressed. A knob with nobody asking for silence is configuration for its own sake.

**Fold usage from `agent.session.events` inside the runner.** Rejected: see the double-counting rule above; token-meter is the one home of that fold.

**Report `contextPressure` occupancy alongside the totals.** Rejected: the run is over when the line prints, so the occupancy of a finished one-shot answers nothing the four billed buckets do not.

## Consequences

Every headless run whose provider reported usage now writes one stderr line, so the tests that pinned empty stderr for a real run assert the summary instead: the `headless-profile` keyless snapshot in `examples/headless-agent` and the headless case of the `apps/cli` built-bin e2e. The bundle gains type-only peer dependencies on `dsh-session-projection` and `dsh-token-meter` for the registry Context merge and the projection key declaration. Because an unbilled run stays silent, the line's presence is not evidence that the run succeeded, and its absence is not evidence that the composition lacks token-meter.
