# Design: "Approved w/ Condition" status for Custom Formality

## Context

Custom Formality verification can already reach a `'Match with condition'` state
(displayed "Match w/ Condition") when one or more compared fields are manually
marked `match-with-condition` in the comparison table. Today, approving *any*
tab — via the manual Approve button or auto-approve — always sets it to plain
`'Approved'`, regardless of what state it was in before. There is no way to
tell, after the fact, that an approved Custom Formality record had a condition
attached.

This is scoped to the **Custom Formality** tab only. The other tabs (Draft
Insurance, Draft B/L, Original B/L) never reach `'Match with condition'`, so
they are unaffected.

## Behavior

1. **Manual approve**: in `handleApproveVerification` (`src/App.tsx`), when
   `verificationType === 'customFormality'` and the tab's current status is
   `'Match with condition'`, the approve action sets it to a new status,
   `'Approved with condition'` (displayed **"Approved w/ Condition"**), instead
   of `'Approved'`. All other tabs/statuses keep today's behavior of setting
   `'Approved'`.

2. **Auto-approve**: the auto-approve effect in `CiOverviewPage.tsx` currently
   only fires when a tab's computed status is exactly `'Match'` — it silently
   skips `'Match with condition'` today. This is extended so that, for the
   `customFormality` tab specifically, `'Match with condition'` also qualifies
   for auto-approve. It calls the same `onApproveVerification` path as manual
   approve, so it naturally produces `'Approved with condition'` per rule 1 —
   no separate status-selection logic is needed in the auto-approve effect
   itself.

3. **Overall task status**: `deriveOverallStatus` (`src/data/mockData.ts`)
   currently requires every tab to be exactly `'Approved'` to roll the task up
   to overall `'Approved'`. This is widened so `'Approved with condition'`
   also satisfies that check — a task with Custom Formality approved-with-
   condition and every other tab plain `'Approved'` still counts as fully
   Approved overall (consistent with how `'Match with condition'` already
   counts as `'Match'` overall today, not a separate bucket).

4. **Terminal/lock behavior**: `'Approved with condition'` is a terminal state,
   identical to `'Approved'` — Approve/Reject buttons disable, the tab is
   excluded from status recomputation on re-render, and only a document
   re-upload can reopen it. Every existing check of the form
   `status === 'Approved' || status === 'Rejected'` gets `'Approved with
   condition'` added alongside `'Approved'`. This includes:
   - `isTabActioned` and the Approve/Reject button disabled/onClick guards in
     `CiOverviewPage.tsx`
   - `wasActioned` in the re-upload handler in `CiOverviewPage.tsx`
   - the merge-recompute exclusion in `App.tsx` (`tasks` memo) that currently
     reads `newVerifications[tab] !== 'Approved' && newVerifications[tab] !==
     'Rejected'` — without this, the derived-status recompute would stomp an
     approved-with-condition tab back down to `'Match with condition'` on the
     next render.

5. **Status banner text**: the "Status: Approved" banner shown after approving
   (`CiOverviewPage.tsx`, ~line 818) currently hardcodes the text `"Approved"`
   based on the log action type, not the actual verification status. It's
   changed to read the actual status label, so it correctly shows "Approved
   w/ Condition" when applicable.

## Labels & styling

New status value `'Approved with condition'` is added to the `VerificationStatus`
union in `src/data/mockData.ts`, displayed everywhere as **"Approved w/
Condition"**, styled with the same blue used for `'Approved'`
(`bg-[#e8f0fb] text-[#0056b8]`) — signalling it's still an approved state.

This requires adding the new value + label + color to the three places that
currently duplicate these per-status maps:

- `CiOverviewPage.tsx`: `STATUS_CONFIG` (color), `STATUS_LABEL` (text)
- `TaskFilterBar.tsx`: `NO_PENDING_DOC_STATUSES` (the option list used by the
  Custom Formality column filter dropdown on the landing page — new value
  inserted directly after `'Approved'`), `VERIFICATION_STATUS_LABEL` (text)
- `TaskTable.tsx`: `STATUS_STYLE` (color), `STATUS_SHORT` (text) — drives the
  Custom Formality column badge on the landing page table

## Out of scope

- No change to the `TaskStatus` type (overall task status enum) itself — only
  `deriveOverallStatus`'s internal check is widened, per rule 3.
- No change to Draft Insurance / Draft B/L / Original B/L tabs — they cannot
  reach `'Match with condition'` today, so this status is unreachable for
  them.
- No change to the `ComparisonTable.tsx` row-level `match-with-condition`
  toggle UI itself — that's the existing mechanism that produces `'Match with
  condition'` in the first place and is untouched.
