# Approved w/ Condition Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `'Approved with condition'` verification status, reachable only for the Custom Formality tab, so approving a `'Match with condition'` CF record (manually or via auto-approve) produces "Approved w/ Condition" instead of plain "Approved", with matching UI everywhere the status is shown, filtered, or locked.

**Architecture:** Extend the existing `VerificationStatus` union in `src/data/mockData.ts` with one new value. The approve-action logic in `src/App.tsx` becomes condition-aware for the `customFormality` tab only. Every place in the codebase that currently branches on `status === 'Approved'` (locking, filtering, styling, auto-approve eligibility) is updated to also recognize the new value alongside `'Approved'`.

**Tech Stack:** React 19 + TypeScript, Vite. No test runner is configured in this repo (`package.json` has no `test` script and there are no `*.test.*`/`*.spec.*` files) — verification is `tsc -b` (type-check) plus manual exercise of the running app in the browser, consistent with how this codebase is currently developed.

## Global Constraints

- New status internal value: `'Approved with condition'`. Display label everywhere: **"Approved w/ Condition"** (matches the existing `'Match with condition'` → "Match w/ Condition" spacing convention).
- Badge color: same blue as `'Approved'` — `bg-[#e8f0fb] text-[#0056b8]`.
- Scoped to the `customFormality` tab only. Do not touch `insurance`, `draftBL`, or `blDate` behavior.
- In the Custom Formality filter dropdown (landing page), the new option must appear directly after `'Approved'`.
- Dev server for manual verification: `cd Documents/dvr && npm run dev` (Vite will pick 5173 or the next free port — check the terminal output for the actual URL).

---

### Task 1: Extend the status type and overall-status rollup

**Files:**
- Modify: `src/data/mockData.ts:8-22` (`VerificationStatus` union), `src/data/mockData.ts:50-58` (`deriveOverallStatus`)

**Interfaces:**
- Produces: `VerificationStatus` now includes `'Approved with condition'` as a member — every later task's `Record<VerificationStatus, ...>` map must account for it or `tsc -b` will fail with a "Property … is missing" error naming the exact map.

- [ ] **Step 1: Add the new union member**

In `src/data/mockData.ts`, change:

```ts
export type VerificationStatus =
  | 'Pending Verification'
  | 'Attention'
  | 'Rejected'
  | 'Match'
  | 'Match with condition'
  | 'Approved'
  | 'Incomplete';
```

to:

```ts
export type VerificationStatus =
  | 'Pending Verification'
  | 'Attention'
  | 'Rejected'
  | 'Match'
  | 'Match with condition'
  | 'Approved'
  | 'Approved with condition'
  | 'Incomplete';
```

- [ ] **Step 2: Widen the overall-status rollup**

In the same file, change:

```ts
export function deriveOverallStatus(v: Verifications): TaskStatus {
  const statuses = Object.values(v) as VerificationStatus[];
  if (statuses.includes('Rejected')) return 'Rejected';
  if (statuses.includes('Incomplete')) return 'Attention';
  if (statuses.includes('Attention')) return 'Attention';
  if (statuses.includes('Pending Verification')) return 'Pending';
  if (statuses.every(s => s === 'Approved')) return 'Approved';
  return 'Match';
}
```

to:

```ts
export function deriveOverallStatus(v: Verifications): TaskStatus {
  const statuses = Object.values(v) as VerificationStatus[];
  if (statuses.includes('Rejected')) return 'Rejected';
  if (statuses.includes('Incomplete')) return 'Attention';
  if (statuses.includes('Attention')) return 'Attention';
  if (statuses.includes('Pending Verification')) return 'Pending';
  if (statuses.every(s => s === 'Approved' || s === 'Approved with condition')) return 'Approved';
  return 'Match';
}
```

- [ ] **Step 3: Run the type-checker and confirm it fails in the expected places**

Run: `cd Documents/dvr && npx tsc -b`
Expected: FAIL. The errors must be exactly "Property 'Approved with condition' is missing" (or equivalent "type is not assignable") pointing at these three files — this confirms Step 1 was wired into the shared type correctly and pinpoints exactly what Task 2 must update:
- `src/components/CiOverviewPage.tsx` (`STATUS_CONFIG`, `STATUS_LABEL`)
- `src/components/TaskFilterBar.tsx` (`VERIFICATION_STATUS_LABEL`)
- `src/components/TaskTable.tsx` (`STATUS_STYLE`, `STATUS_SHORT`)

If any other file errors, note it — it means another `Record<VerificationStatus, …>` exists that this plan hasn't accounted for, and it must be added to Task 2.

- [ ] **Step 4: Commit**

```bash
git add src/data/mockData.ts
git commit -m "feat: add Approved with condition verification status"
```

---

### Task 2: Wire the new status into every status label/color/filter map

**Files:**
- Modify: `src/components/CiOverviewPage.tsx:49-67` (`STATUS_CONFIG`, `STATUS_LABEL`)
- Modify: `src/components/TaskFilterBar.tsx:9-28` (`NO_PENDING_DOC_STATUSES`, `VERIFICATION_STATUS_LABEL`)
- Modify: `src/components/TaskTable.tsx:31-50` (`STATUS_STYLE`, `STATUS_SHORT`)

**Interfaces:**
- Consumes: `VerificationStatus` from Task 1 (already includes `'Approved with condition'`).
- Produces: nothing new consumed by later tasks — this is purely presentational wiring.

- [ ] **Step 1: `CiOverviewPage.tsx` — add color and label**

Change:

```ts
const STATUS_CONFIG: Record<VerificationStatus, { bg: string; text: string }> = {
  'Pending Verification': { bg: 'bg-gray-100', text: 'text-gray-500' },
  'Attention': { bg: 'bg-[#fef5e5]', text: 'text-[#ac6f00]' },
  'Rejected': { bg: 'bg-[#faeaea]', text: 'text-[#8c1d1d]' },
  'Match': { bg: 'bg-[#ebf7ed]', text: 'text-[#267d36]' },
  'Match with condition': { bg: 'bg-[#e0f5f5]', text: 'text-[#0e7c7c]' },
  'Approved': { bg: 'bg-[#e8f0fb]', text: 'text-[#0056b8]' },
  'Incomplete': { bg: 'bg-[#faeaea]', text: 'text-[#8c1d1d]' },
};

const STATUS_LABEL: Record<VerificationStatus, string> = {
  'Match': 'Match',
  'Match with condition': 'Match w/ Condition',
  'Approved': 'Approved',
  'Attention': 'Attention',
  'Rejected': 'Rejected',
  'Pending Verification': 'Pending',
  'Incomplete': 'Incomplete',
};
```

to:

```ts
const STATUS_CONFIG: Record<VerificationStatus, { bg: string; text: string }> = {
  'Pending Verification': { bg: 'bg-gray-100', text: 'text-gray-500' },
  'Attention': { bg: 'bg-[#fef5e5]', text: 'text-[#ac6f00]' },
  'Rejected': { bg: 'bg-[#faeaea]', text: 'text-[#8c1d1d]' },
  'Match': { bg: 'bg-[#ebf7ed]', text: 'text-[#267d36]' },
  'Match with condition': { bg: 'bg-[#e0f5f5]', text: 'text-[#0e7c7c]' },
  'Approved': { bg: 'bg-[#e8f0fb]', text: 'text-[#0056b8]' },
  'Approved with condition': { bg: 'bg-[#e8f0fb]', text: 'text-[#0056b8]' },
  'Incomplete': { bg: 'bg-[#faeaea]', text: 'text-[#8c1d1d]' },
};

const STATUS_LABEL: Record<VerificationStatus, string> = {
  'Match': 'Match',
  'Match with condition': 'Match w/ Condition',
  'Approved': 'Approved',
  'Approved with condition': 'Approved w/ Condition',
  'Attention': 'Attention',
  'Rejected': 'Rejected',
  'Pending Verification': 'Pending',
  'Incomplete': 'Incomplete',
};
```

- [ ] **Step 2: `TaskFilterBar.tsx` — add to the CF filter option list and label map**

Change:

```ts
const NO_PENDING_DOC_STATUSES: VerificationStatus[] = [
  'Attention', 'Match', 'Match with condition', 'Approved', 'Rejected', 'Incomplete',
];
```

to:

```ts
const NO_PENDING_DOC_STATUSES: VerificationStatus[] = [
  'Attention', 'Match', 'Match with condition', 'Approved', 'Approved with condition', 'Rejected', 'Incomplete',
];
```

Change:

```ts
const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  'Match': 'Match',
  'Match with condition': 'Match w/ Condition',
  'Approved': 'Approved',
  'Attention': 'Attention',
  'Rejected': 'Rejected',
  'Pending Verification': 'Pending',
  'Incomplete': 'Incomplete',
};
```

to:

```ts
const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  'Match': 'Match',
  'Match with condition': 'Match w/ Condition',
  'Approved': 'Approved',
  'Approved with condition': 'Approved w/ Condition',
  'Attention': 'Attention',
  'Rejected': 'Rejected',
  'Pending Verification': 'Pending',
  'Incomplete': 'Incomplete',
};
```

- [ ] **Step 3: `TaskTable.tsx` — add color and label for the landing-page CF column badge**

Change:

```ts
const STATUS_STYLE: Record<VerificationStatus, string> = {
  'Match': 'bg-[#ebf7ed] text-[#267d36]',
  'Match with condition': 'bg-[#e0f5f5] text-[#0e7c7c]',
  'Approved': 'bg-[#e8f0fb] text-[#0056b8]',
  'Attention': 'bg-[#fef5e5] text-[#ac6f00]',
  'Rejected': 'bg-[#faeaea] text-[#8c1d1d]',
  'Pending Verification': 'bg-gray-100 text-gray-500',
  'Incomplete': 'bg-[#faeaea] text-[#8c1d1d]',
};


const STATUS_SHORT: Record<VerificationStatus, string> = {
  'Match': 'Match',
  'Match with condition': 'Match w/ Condition',
  'Approved': 'Approved',
  'Attention': 'Attention',
  'Rejected': 'Rejected',
  'Pending Verification': 'Pending',
  'Incomplete': 'Incomplete',
};
```

to:

```ts
const STATUS_STYLE: Record<VerificationStatus, string> = {
  'Match': 'bg-[#ebf7ed] text-[#267d36]',
  'Match with condition': 'bg-[#e0f5f5] text-[#0e7c7c]',
  'Approved': 'bg-[#e8f0fb] text-[#0056b8]',
  'Approved with condition': 'bg-[#e8f0fb] text-[#0056b8]',
  'Attention': 'bg-[#fef5e5] text-[#ac6f00]',
  'Rejected': 'bg-[#faeaea] text-[#8c1d1d]',
  'Pending Verification': 'bg-gray-100 text-gray-500',
  'Incomplete': 'bg-[#faeaea] text-[#8c1d1d]',
};


const STATUS_SHORT: Record<VerificationStatus, string> = {
  'Match': 'Match',
  'Match with condition': 'Match w/ Condition',
  'Approved': 'Approved',
  'Approved with condition': 'Approved w/ Condition',
  'Attention': 'Attention',
  'Rejected': 'Rejected',
  'Pending Verification': 'Pending',
  'Incomplete': 'Incomplete',
};
```

- [ ] **Step 4: Run the type-checker and confirm it now passes**

Run: `cd Documents/dvr && npx tsc -b`
Expected: PASS (no output, exit code 0). If any of the errors from Task 1 Step 3 remain, or a new one appears, fix the corresponding map before continuing.

- [ ] **Step 5: Manual verification — dropdown shows the new option in the right place**

Run: `cd Documents/dvr && npm run dev` (note the printed local URL)
In the browser:
1. Open the landing page.
2. Open the "Custom Formality" filter dropdown in the filter bar.
3. Confirm the option list reads, top to bottom: Attention, Match, Match w/ Condition, Approved, **Approved w/ Condition**, Rejected, Incomplete.
Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 6: Commit**

```bash
git add src/components/CiOverviewPage.tsx src/components/TaskFilterBar.tsx src/components/TaskTable.tsx
git commit -m "feat: add Approved w/ Condition label, color, and filter option"
```

---

### Task 3: Make manual approve condition-aware for Custom Formality

**Files:**
- Modify: `src/App.tsx:440-451` (`handleApproveVerification`)

**Interfaces:**
- Consumes: `VerificationStatus` (Task 1), `deriveOverallStatus` (Task 1, already status-aware).
- Produces: `handleApproveVerification(taskId, verificationType, reason?, remark?)` — unchanged signature, but now sets the `customFormality` tab to `'Approved with condition'` instead of `'Approved'` when its prior status was `'Match with condition'`.

- [ ] **Step 1: Make the target status conditional**

In `src/App.tsx`, change:

```ts
  function handleApproveVerification(taskId: string, verificationType: VerificationType, reason?: string, remark?: string) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const verifications = { ...t.verifications, [verificationType]: 'Approved' as VerificationStatus };
    const effective = getEffectiveVerifications({ ...t, verifications });
    updateTaskOverride(taskId, { verifications, status: deriveOverallStatus(effective) });

    setActionLogs(prev => ({
      ...prev,
      [taskId]: { ...(prev[taskId] ?? {}), [verificationType]: { action: 'approve', timestamp: new Date().toISOString(), by: CURRENT_USER, reason, remark } },
    }));
  }
```

to:

```ts
  function handleApproveVerification(taskId: string, verificationType: VerificationType, reason?: string, remark?: string) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const targetStatus: VerificationStatus =
      verificationType === 'customFormality' && t.verifications[verificationType] === 'Match with condition'
        ? 'Approved with condition'
        : 'Approved';
    const verifications = { ...t.verifications, [verificationType]: targetStatus };
    const effective = getEffectiveVerifications({ ...t, verifications });
    updateTaskOverride(taskId, { verifications, status: deriveOverallStatus(effective) });

    setActionLogs(prev => ({
      ...prev,
      [taskId]: { ...(prev[taskId] ?? {}), [verificationType]: { action: 'approve', timestamp: new Date().toISOString(), by: CURRENT_USER, reason, remark } },
    }));
  }
```

- [ ] **Step 2: Run the type-checker**

Run: `cd Documents/dvr && npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Manual verification — approving a conditioned CF record**

Run: `cd Documents/dvr && npm run dev`
In the browser:
1. Open any task's Custom Formality tab that has a Shipping Instruction document loaded (the comparison table's Status column shows a dropdown, not just a static badge, for rows where an SI document applies).
2. In the comparison table, change at least one field's row status dropdown to "Matched w/Condition".
3. Confirm the Custom Formality tab badge now reads "Match w/ Condition".
4. Click **Approve**, confirm in the dialog.
5. Confirm the tab badge now reads **"Approved w/ Condition"** (not "Approved").
6. As a control: open a different task's Custom Formality tab that is at plain `'Match'` (no condition applied) and approve it — confirm it still becomes plain **"Approved"**.
Stop the dev server once confirmed.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: approve Match w/ Condition CF records as Approved w/ Condition"
```

---

### Task 4: Lock "Approved w/ Condition" the same way "Approved" is locked

**Files:**
- Modify: `src/components/CiOverviewPage.tsx:380` (`wasActioned` in `handleReUploadAfterAction`)
- Modify: `src/components/CiOverviewPage.tsx:491` (`isTabActioned`)
- Modify: `src/components/CiOverviewPage.tsx:803-806` (Approve/Reject button `onClick`/`disabled`/`title`/className guards)
- Modify: `src/App.tsx:146` (merge-recompute exclusion in the `tasks` memo)

**Interfaces:**
- Consumes: `'Approved with condition'` (Task 1), produced by `handleApproveVerification` (Task 3).
- Produces: nothing new consumed elsewhere — this task only makes existing terminal-state checks recognize the new value.

- [ ] **Step 1: `App.tsx` — stop recomputation from overwriting an approved-with-condition tab**

In the `tasks` memo, change:

```ts
      for (const tab of tabs) {
        if (newVerifications[tab] !== 'Approved' && newVerifications[tab] !== 'Rejected') {
          const computed = computeVerificationStatus(overrides as Task, tab);
          if (computed) {
            newVerifications[tab] = computed;
          }
        }
      }
```

to:

```ts
      for (const tab of tabs) {
        if (newVerifications[tab] !== 'Approved' && newVerifications[tab] !== 'Approved with condition' && newVerifications[tab] !== 'Rejected') {
          const computed = computeVerificationStatus(overrides as Task, tab);
          if (computed) {
            newVerifications[tab] = computed;
          }
        }
      }
```

- [ ] **Step 2: `CiOverviewPage.tsx` — treat it as actioned for re-upload tracking**

Change:

```ts
    const wasActioned = task.verifications[activeTab] === 'Approved' || task.verifications[activeTab] === 'Rejected';
```

to:

```ts
    const wasActioned = task.verifications[activeTab] === 'Approved' || task.verifications[activeTab] === 'Approved with condition' || task.verifications[activeTab] === 'Rejected';
```

- [ ] **Step 3: `CiOverviewPage.tsx` — treat it as actioned for button locking**

Change:

```ts
  const isTabActioned = activeTabStatus === 'Approved' || activeTabStatus === 'Rejected';
```

to:

```ts
  const isTabActioned = activeTabStatus === 'Approved' || activeTabStatus === 'Approved with condition' || activeTabStatus === 'Rejected';
```

(`isTabActioned` already gates the Approve/Reject `onClick`, `disabled`, and `className` expressions at lines 795-806, and the `displayActionLog` banner check at line 815 keys off `displayActionLog.action`, not the status directly — no further change needed there.)

- [ ] **Step 4: Run the type-checker**

Run: `cd Documents/dvr && npx tsc -b`
Expected: PASS.

- [ ] **Step 5: Manual verification — buttons stay locked**

Run: `cd Documents/dvr && npm run dev`
In the browser, repeat Task 3 Step 3's flow (get a CF tab to "Approved w/ Condition"), then:
1. Confirm the **Approve** and **Reject** buttons are both disabled (grayed out).
2. Switch to a different tab and back to Custom Formality — confirm the badge still reads "Approved w/ Condition" (it must not revert to "Match w/ Condition").
3. Reload the page — confirm the status persists as "Approved w/ Condition".
Stop the dev server once confirmed.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/CiOverviewPage.tsx
git commit -m "fix: lock Approved w/ Condition CF tabs like Approved"
```

---

### Task 5: Extend auto-approve to cover Match w/ Condition for Custom Formality

**Files:**
- Modify: `src/components/CiOverviewPage.tsx:493-514` (auto-approve `useEffect`)

**Interfaces:**
- Consumes: `handleApproveVerification` (Task 3) via the existing `onApproveVerification` prop — no signature change.
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Widen the auto-approve trigger condition for the CF tab**

Change:

```ts
  useEffect(() => {
    if (!autoApprove || task.assignedTo !== currentUser) return;
    const tabs: VerificationType[] = ['customFormality', 'insurance', 'draftBL', 'blDate'];
    for (const tab of tabs) {
      if (effectiveVerifications[tab] !== 'Match') continue;
      if (autoApproveExcluded.has(`${task.id}:${tab}`)) continue;
      if (manuallyEditedTabs.has(tab)) continue;
      onApproveVerification(tab, 'Auto Approved', 'Auto Approved is enabled in Settings');
    }
  }, [
```

to:

```ts
  useEffect(() => {
    if (!autoApprove || task.assignedTo !== currentUser) return;
    const tabs: VerificationType[] = ['customFormality', 'insurance', 'draftBL', 'blDate'];
    for (const tab of tabs) {
      const eligible = tab === 'customFormality'
        ? effectiveVerifications[tab] === 'Match' || effectiveVerifications[tab] === 'Match with condition'
        : effectiveVerifications[tab] === 'Match';
      if (!eligible) continue;
      if (autoApproveExcluded.has(`${task.id}:${tab}`)) continue;
      if (manuallyEditedTabs.has(tab)) continue;
      onApproveVerification(tab, 'Auto Approved', 'Auto Approved is enabled in Settings');
    }
  }, [
```

- [ ] **Step 2: Run the type-checker**

Run: `cd Documents/dvr && npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Manual verification — auto-approve produces the conditioned status**

Run: `cd Documents/dvr && npm run dev`
In the browser:
1. Open Settings and enable "Auto Approve" (note the exact toggle label in `SettingsPage.tsx` if it differs).
2. Open a task assigned to the current user whose Custom Formality tab is not yet actioned.
3. In the comparison table, set at least one field's row status to "Matched w/Condition" so the tab computes to "Match w/ Condition".
4. Without clicking Approve, confirm the tab auto-transitions to **"Approved w/ Condition"** on its own (per the existing auto-approve UX, e.g. shortly after the status settles).
5. As a control: repeat with a different task where CF has no condition applied (plain "Match") — confirm it still auto-transitions to plain "Approved".
Stop the dev server once confirmed. Turn Auto Approve back off in Settings if that's not the app's default.

- [ ] **Step 4: Commit**

```bash
git add src/components/CiOverviewPage.tsx
git commit -m "feat: auto-approve Match w/ Condition Custom Formality records"
```

---

### Task 6: Fix the status banner to show the real status text

**Files:**
- Modify: `src/components/CiOverviewPage.tsx:815-820` (post-action status banner)

**Interfaces:**
- Consumes: `activeTabStatus` (existing local, already computed at line 485-490), `STATUS_LABEL` (Task 2).
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Show the actual status label instead of a hardcoded string**

Change:

```tsx
          {displayActionLog && (displayActionLog.action === 'approve' || displayActionLog.action === 'reject') && (
            <div className={`px-6 py-3 border-b border-gray-200 shrink-0 text-xs ${displayActionLog.action === 'approve' ? 'bg-[#ebf7ed]' : 'bg-[#faeaea]'}`}>
              <span className="font-semibold text-gray-700">Status: </span>
              <span className={`font-medium ${displayActionLog.action === 'approve' ? 'text-[#267d36]' : 'text-[#8c1d1d]'}`}>
                {displayActionLog.action === 'approve' ? 'Approved' : 'Rejected'}
              </span>
```

to:

```tsx
          {displayActionLog && (displayActionLog.action === 'approve' || displayActionLog.action === 'reject') && (
            <div className={`px-6 py-3 border-b border-gray-200 shrink-0 text-xs ${displayActionLog.action === 'approve' ? 'bg-[#ebf7ed]' : 'bg-[#faeaea]'}`}>
              <span className="font-semibold text-gray-700">Status: </span>
              <span className={`font-medium ${displayActionLog.action === 'approve' ? 'text-[#267d36]' : 'text-[#8c1d1d]'}`}>
                {displayActionLog.action === 'approve' ? STATUS_LABEL[activeTabStatus] : 'Rejected'}
              </span>
```

(`activeTabStatus` is already in scope in this component at the point this banner renders — no new variable needed. `STATUS_LABEL` is the map from Task 2, already defined in this file.)

- [ ] **Step 2: Run the type-checker**

Run: `cd Documents/dvr && npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Manual verification — banner text matches the badge**

Run: `cd Documents/dvr && npm run dev`
In the browser, repeat Task 3 Step 3's flow to approve a conditioned CF record, then:
1. Confirm the "Status: …" banner below the tab header reads **"Status: Approved w/ Condition"**.
2. As a control, approve a plain-Match CF record on a different task and confirm the banner still reads "Status: Approved".
3. As a second control, reject a record and confirm the banner still reads "Status: Rejected".
Stop the dev server once confirmed.

- [ ] **Step 4: Commit**

```bash
git add src/components/CiOverviewPage.tsx
git commit -m "fix: show real status label in the post-approval status banner"
```

---

## Final check

- [ ] Run `cd Documents/dvr && npx tsc -b` one more time from a clean state — expect PASS with no errors.
- [ ] Run through the full flow once end-to-end in the browser: filter the landing page by "Approved w/ Condition" (should be empty until you create one), open a task, mark a CF field "Matched w/Condition", approve it, confirm the landing-page CF column badge and the filter both now show/find it correctly, confirm the task still counts as fully "Approved" overall if every other tab is plain Approved.
