# Document Verification App — Plan

## Context
Repurpose the existing Credit Score Management POC (React 19 + TypeScript + Tailwind CSS 3 + Vite) into a Document Verification app. The new app has two pages: a task list (homepage) and a task detail view with side-by-side document comparison. All data is mocked; no backend.

---

## Architecture

### Routing
Simple `useState`-based routing in `App.tsx` — no React Router needed:
```typescript
type View = { page: 'home' } | { page: 'detail'; taskId: string };
```
- `tasks` array lives in `App.tsx` as mutable state (for Approve/Reject)
- After Approve/Reject: mutate task status → navigate home

### Data Model
```typescript
type CanonicalField = 'Full Name' | 'ID Number' | 'Date of Birth' | 'Address' | 'Phone Number' | 'Email';

interface KYCDocument {
  id: string;
  type: string;                                  // "National ID", "Bank Statement", "Employment Letter"
  fieldMapping: Record<CanonicalField, string>;  // canonical → original field name in this doc
  values: Record<string, string>;                // original field name → actual value
}

type TaskStatus = 'Pending' | 'Needs Attention' | 'All Match' | 'Approved' | 'Rejected';

interface Task {
  id: string;
  applicantName: string;
  submittedDate: string;
  documents: [KYCDocument, KYCDocument, KYCDocument];  // always exactly 3
  correctValues: Record<CanonicalField, string>;        // ground-truth system values
  status: TaskStatus;
}
```

### Field Name Variation (the core design challenge)
Each of 3 document types uses different field names for the same data:
- **National ID**: `full_name`, `ic_no`, `dob`, `home_address`, `mobile_no`, `email_address`
- **Bank Statement**: `account_holder`, `nric`, `birth_date`, `residential_address`, `contact_number`, `email`
- **Employment Letter**: `employee_name`, `id_number`, `date_of_birth`, `address`, `phone`, `work_email`

`fieldMapping` bridges canonical → original; `values` stores actual data by original key.

---

## Mock Data
8 tasks with Malaysian KYC data, mixing all statuses:
- T001 — All fields match → `All Match`
- T002 — Bank Statement NRIC typo → `Needs Attention`
- T003 — Employment Letter name mismatch → `Needs Attention`
- T004 — Multiple mismatches (Address + Phone) → `Needs Attention`
- T005 — All match, already reviewed → `Approved`
- T006 — Had mismatches, reviewer rejected → `Rejected`
- T007 — All match, not yet reviewed → `Pending`
- T008 — Single email mismatch → `Needs Attention`

---

## Components

| File | Purpose |
|------|---------|
| `src/data/mockData.ts` | Full replacement — types + 8 tasks |
| `src/utils/comparison.ts` | `buildComparisonRows()` pure function |
| `src/components/StatusBadge.tsx` | Shared badge (all 5 statuses) |
| `src/components/Navbar.tsx` | Modified — "Document Verification" title |
| `src/components/TaskFilterBar.tsx` | Search + status filter |
| `src/components/TaskTable.tsx` | Homepage task list |
| `src/components/ComparisonTable.tsx` | Side-by-side doc comparison grid |
| `src/components/ActionBar.tsx` | Approve/Reject buttons |
| `src/components/TaskDetailPage.tsx` | Full detail view |
| `src/App.tsx` | useState routing + task state |

---

## Page Designs

### Homepage
Columns: Task ID | Applicant Name | Submitted Date | Documents (3 type pills) | Status | ›

### Task Detail
```
[← Back to Tasks]    T002 — Siti Nabilah    [Needs Attention]

┌─ Task Info (Task ID | Submitted | Document types) ──────────┐

┌─ Document Field Comparison ─────────────────────────────────┐
│ Field    │ Correct Value │ National ID │ Bank Stmt │ Emp Ltr │ Status  │
│ Full Name│ Siti Nabilah  │ ✓ green     │ ✓ green   │ ✓ green │ Match   │
│ ID Number│ 950618-10-2234│ ✓ green     │ ✗ orange  │ ✓ green │ Mismatch│
└─────────────────────────────────────────────────────────────┘

┌─ Action Bar: [Reject] [Approve] ────────────────────────────┐
```

### Comparison Cell Colors
- Match: `bg-[#ebf7ed]` (green)
- Mismatch: `bg-[#fef5e5]` (orange)
- Each cell shows: original field name (small gray) + value (bold)
