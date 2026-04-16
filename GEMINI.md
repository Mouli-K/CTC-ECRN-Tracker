# PROJECT MANDATES — CTC — ECRN Tracker

## PRIORITIES
- There are only **2 priorities**: `High` and `Normal`.
- `High`: Red badge (`bg-red-100 text-red-700`).
- `Normal`: Blue badge (`bg-blue-100 text-blue-700`).

## UI/UX STANDARDS
- **Modern & Sleek:** High whitespace, rounded corners (up to `3xl` or `40px` for cards), and soft-toned backgrounds.
- **De-cluttered Layouts:** Metadata should be horizontal where possible. Avoid vertical stacking of too many cards.
- **Micro-interactions:** Subtle hover effects, smooth transitions (300ms-500ms), and scaled-down active states.
- **Dark Mode:** Must be consistent using Tailwind's `dark:` variant and class-based selector.

## DATA INTEGRITY
- Use **Firestore real-time listeners** (`onSnapshot`) for dashboard and detail views.
- **Batch writes** must be used for multi-document operations (e.g., creating ECRN with its documents).
- **TypeScript strict mode**: Interfaces must be followed for all Firestore documents.

## STATUS ENUMS
- **ECRN Status:** `Running` | `Completed` | `With PE` | `Query Hold` | `Pending`
- **Document Status:** `WIP` → `Primary Check` → `Secondary Check` → `With PE` → `Completed`

## RECENT CHANGES
- Redesigned ECRN Detail Page to use a more compact horizontal header and integrated progress.
- Reduced Priority options from 3 to 2 (`High`, `Normal`).
- Implemented Document Workflow Drawer with activity logs and hours capture.
