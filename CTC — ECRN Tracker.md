# CTC — ECRN Tracker | Full Project Prompt for Gemini CLI Agent

---

## PROJECT IDENTITY

**Application Name:** CTC — ECRN Tracker  
**Full Form:** Chennai Technology Center — Engineering Change Request Notice Tracker  
**Organization:** Emerson (Chennai Technology Center)  
**Deployment:** Localhost first → GitHub → Cloudflare Pages  
**Auth:** Firebase Authentication (Employee ID + Password)  
**Database:** Firestore (Firebase)  
**Hosting (Final):** Cloudflare Pages  

---

## ABSOLUTE CONSTRAINTS — READ BEFORE ANYTHING ELSE

1. **Data integrity is Priority #1.** Every read/write to Firestore must be transactional where applicable. No optimistic UI updates without rollback safety. No silent failures.
2. **Performance is Priority #2.** No loading spinners that last more than 300ms for cached data. Use Firestore real-time listeners. No page reloads. No lag.
3. **UI is Priority #3.** Modern, minimal, soft-tone palette. No brown. No gradients. No heavy shadows. Support both **Dark Mode and Light Mode** with a toggle. Clean sans-serif typography.
4. **Never use CSV exports.** All data exports must be proper `.xlsx` Excel files with formatted tables, charts, and column widths.
5. **No form-style pages with all fields at once.** Use step-by-step wizard UI where specified.
6. **Never skip a phase.** Wait for explicit confirmation before advancing to the next phase.

---

## TECH STACK

- **Frontend:** React (Vite) + TypeScript
- **Styling:** Tailwind CSS (with `dark:` variants for dark mode)
- **State Management:** Zustand
- **Database & Auth:** Firebase v9+ (Firestore + Firebase Auth)
- **Excel Export:** SheetJS (`xlsx` npm package) — formatted tables + embedded charts
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Build Tool:** Vite
- **Deployment Target:** Cloudflare Pages (via GitHub repo)

---

## FIREBASE CONFIGURATION

Use the following Firebase config exactly. Do not modify keys.

```typescript
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD76JURRl4BuRKX3b0rjIOx7GtIw7IAukA",
  authDomain: "ctc-ecrn-tracker.firebaseapp.com",
  projectId: "ctc-ecrn-tracker",
  storageBucket: "ctc-ecrn-tracker.firebasestorage.app",
  messagingSenderId: "1051392678919",
  appId: "1:1051392678919:web:2444482813becdf7e3dea2",
  measurementId: "G-D9NF61S5KM"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

---

## APPLICATION LAYOUT

### Global Header (Persistent — All Pages)
- Left: App name **"CTC — ECRN Tracker"** in medium-weight sans-serif
- Right: **Emerson logo** (SVG or PNG asset — placeholder if asset unavailable)
- Below header: A slim secondary bar with text **"Chennai Technology Center"** in muted small font
- Include a **Dark/Light mode toggle** icon button in the header (top right, next to logo)
- Header background: solid surface color (adapts to dark/light mode), no gradient

### Navigation Tabs (Persistent Below Header)
- Tab 1: **Home**
- Tab 2: **People**
- Tab 3: **ECRN**

---

## WORKFLOW OVERVIEW (BUSINESS LOGIC)

```
Product Engineer (PE) raises ECRN
        ↓
Assigns ECRN number + uploads technical requirements (documents to change)
        ↓
Admin receives ECRN → assigns documents to Design Engineers
        ↓
Design Engineers work on assigned documents (status: WIP)
        ↓
Document moved to Primary Check (Engineer → freed)
        ↓
Primary Check → Secondary Check
        ↓
Secondary Check → With PE (Final Approval)
        ↓
PE approves → ECRN Closed
```

**Document Status Enum:**
`WIP` → `Primary Check` → `Secondary Check` → `With PE` → `Completed`

**ECRN Status Enum:**
`Running` | `Completed` | `With PE` | `Query Hold` | `Pending`

**Engineer Status (derived):**
- `Engaged` — has 1 or more documents in WIP
- `Free` — all assigned documents moved past WIP or no assignments

---

## FIRESTORE DATA SCHEMA

### Collection: `ecrns`
```
ecrns/{ecrnId}
  - ecrnNumber: string (e.g., "ECRN-2024-001")
  - priority: "High" | "Medium" | "Low"
  - deadline: Timestamp | null
  - reasonForChange: string
  - stockAction: string (what to do with stock)
  - productEngineerName: string
  - status: "Running" | "Completed" | "With PE" | "Query Hold" | "Pending"
  - createdAt: Timestamp
  - closedAt: Timestamp | null
  - totalDocuments: number
  - completedDocuments: number (derived/maintained)
```

### Collection: `documents` (subcollection under `ecrns`)
```
ecrns/{ecrnId}/documents/{docId}
  - documentNumber: string
  - assignedEngineerUid: string
  - assignedEngineerName: string
  - estimatedHours: number
  - actualHours: number | null        ← captured when document is marked Completed
  - status: "WIP" | "Primary Check" | "Secondary Check" | "With PE" | "Completed"
  - statusHistory: Array<{ status: string, changedAt: Timestamp, changedBy: string }>
  - createdAt: Timestamp
  - completedAt: Timestamp | null     ← set when status reaches Completed
```

### Collection: `engineers`
```
engineers/{uid}
  - employeeId: string
  - name: string
  - email: string
  - activeDocuments: number (maintained)
  - completedDocuments: number (maintained)
```

### Collection: `users` (for auth mapping)
```
users/{uid}
  - employeeId: string
  - role: "admin" | "engineer"
  - name: string
```

---

## PHASE BREAKDOWN

---

## PHASE 1 — Foundation + Auth + Layout

### Goals
1. Initialize Vite + React + TypeScript project
2. Configure Tailwind CSS with dark mode (`class` strategy)
3. Set up Firebase (Auth + Firestore)
4. Implement Authentication screen
5. Scaffold global layout (Header, Nav Tabs, Route outlets)
6. Set up React Router routes for Home, People, ECRN tabs
7. Dark/Light mode toggle with persistence in localStorage

### Authentication Screen
- Login form: Employee ID field + Password field
- On submit: authenticate against Firebase Auth
- On success: redirect to `/home`
- On failure: show inline error message (not alert popup)
- Style: centered card, soft background, no gradient

### Routing Structure
```
/ → redirect to /login
/login → LoginPage
/home → HomePage (protected)
/people → PeoplePage (protected)
/ecrn → ECRNPage (protected)
```

### Deliverable Checklist
- [ ] Project runs on `localhost:5173` with no errors
- [ ] Login with Employee ID works against Firebase Auth
- [ ] Header shows app name + CTC subtitle + Emerson logo placeholder + dark mode toggle
- [ ] Three tabs navigate to correct blank pages
- [ ] Dark mode toggles correctly with class-based Tailwind

**STOP. Confirm Phase 1 complete before proceeding.**

---

## PHASE 2 — Home Tab + Start ECRN + Close ECRN

### Home Tab Layout

#### Summary Cards Row (top of page)
Display 4 metric cards in a horizontal grid:
- **Running** — count of ECRNs with status `Running`
- **Completed** — count with status `Completed`
- **With PE** — count with status `With PE`
- **Query Hold** — count with status `Query Hold`
Cards should update in real-time via Firestore listeners.

#### Currently Running ECRNs Table
Below the summary cards, show a table of all ECRNs with status `Running`, sorted by:
1. Priority (High → Medium → Low)
2. Deadline (ascending, nulls last)

Table columns:
| ECRN Number | Priority | Deadline | PE Name | Documents | Progress | Status |
- Priority: color-coded badge (High = red, Medium = amber, Low = green)
- Progress: mini progress bar (completedDocuments / totalDocuments)
- Clicking a row opens the ECRN Detail page (Phase 3)

#### Two Action Buttons (top right of Home tab)
1. **"+ Start ECRN"** — opens Start ECRN wizard (modal or full-page)
2. **"Close ECRN"** — opens Close ECRN modal

---

### Start ECRN — Step-by-Step Wizard (2 Steps)

Use a wizard UI with step indicators at top (Step 1 of 2, Step 2 of 2), Previous and Next buttons.

#### Step 1 — ECRN Details
Fields:
- ECRN Number (text input, required, unique validated against Firestore)
- Priority (dropdown: High / Medium / Low, required)
- Deadline (date picker, optional)
- Reason for Change (textarea, required)
- Stock Action (text input: e.g., "Scrap", "Rework", "Use As Is", required)
- Product Engineer Name (text input, required)

Validation: All required fields must be filled. ECRN number must not already exist in Firestore.

**Next** button advances to Step 2. Step 2 is not accessible until Step 1 is valid.

#### Step 2 — Documents Entry
- Show heading: `Documents for {ECRN Number}`
- Input: "Number of Documents" (number input, 1–50)
- On change: dynamically render that many rows in a table with 3 columns per row:
  - Document Number (text input)
  - Assigned Engineer (dropdown populated from `engineers` collection, name + employeeId)
  - Estimated Hours (number input)
- All rows must be filled before submission
- **"Create ECRN"** button at the bottom

On submit:
1. Write ECRN document to `ecrns` collection
2. Write each document as subcollection `ecrns/{ecrnId}/documents`
3. Update `activeDocuments` count for each assigned engineer in `engineers` collection
4. All writes in a Firestore batch write (atomic)
5. Close wizard, show success toast, refresh home tab data

---

### Close ECRN — Confirmation Modal
- Show modal with: "Has the Product Engineer reviewed and approved all documents in this ECRN?"
- Dropdown to select which ECRN to close (filter to only `Running` or `With PE` ECRNs)
- Two buttons: **Cancel** | **Confirm Close**
- On confirm: Update ECRN status to `Completed`, set `closedAt` timestamp

---

### Deliverable Checklist
- [ ] Home tab shows 4 live metric cards
- [ ] Running ECRN table sorted by priority + deadline
- [ ] Start ECRN wizard — Step 1 validates, Step 2 renders dynamic rows
- [ ] Creating ECRN writes to Firestore atomically
- [ ] Close ECRN modal works and updates Firestore status
- [ ] Dark mode works on all new components

**STOP. Confirm Phase 2 complete before proceeding.**

---

## PHASE 3 — ECRN Detail Page + Document Workflow Tracker

### ECRN Detail Page

Route: `/ecrn/{ecrnId}`

Accessible by clicking any ECRN row from the Home tab or ECRN tab.

#### Top Section — ECRN Summary
Display the following in a structured card (same layout as wizard Step 1 data):
- ECRN Number
- Priority (badge)
- Deadline
- Reason for Change
- Stock Action
- Product Engineer Name
- Status (badge)
- Created At
- Progress bar (X of Y documents completed)

#### Documents Table
Below the summary, list all documents in this ECRN:

| Document Number | Assigned Engineer | Est. Hours | Actual Hours | Status | Action |
- Status: color-coded badge per document status
- **Actual Hours** column: shows `—` while in progress, filled in once document reaches Completed
- **Action** column: "Move to next stage" button (context-aware — only shows valid next stage)
- Clicking the **Document Number** opens the Document Status Drawer

#### "All Complete" Prompt
If all documents have status `Completed`:
- Show a prominent banner: **"All documents completed — Ready to close ECRN"**
- Button in banner: **"Close ECRN"** (triggers same modal as Phase 2)

---

### Document Status Drawer / Side Panel

When clicking a Document Number, open a right-side drawer (not a new page, not a blocking modal). The drawer shows:

#### Status Flowchart (Visual)
Render a horizontal step-by-step flow showing 5 stages:
```
[WIP] → [Primary Check] → [Secondary Check] → [With PE] → [Completed]
```
- Current stage is highlighted (filled color)
- Completed stages are checkmarked
- Future stages are muted/gray

#### Status History Log
Below the flowchart, show a timeline log:
```
[Date Time] — Moved to "Primary Check" by [Name]
[Date Time] — Created in WIP by Admin
```

#### Move to Next Stage Button
- Shows: "Move to [Next Stage]" (disabled if already Completed)
- On click: update document status in Firestore, append to `statusHistory` array
- If moving FROM `WIP`: decrement engineer's `activeDocuments`, check if now 0 → mark engineer as Free

#### Actual Hours Capture — Completing a Document (Critical Feature)
When the **next stage is `Completed`** (i.e. the document is currently at `With PE` and being marked done), the "Move to Completed" button must **not** immediately write to Firestore. Instead:

1. Open a small **inline confirmation panel** inside the drawer (do not close the drawer, do not open a separate modal)
2. Show the panel with:
   - Label: `"How many hours did this document actually take?"`
   - Input: number field, minimum 0.5, step 0.5, pre-filled with `estimatedHours` as a starting reference
   - Helper text (muted): `Estimated: {estimatedHours} hrs`
   - Two buttons: **Cancel** | **Mark Complete**
3. **Cancel** dismisses the panel and returns to the normal drawer state — nothing is written
4. **Mark Complete** is only enabled when the hours field has a valid positive number
5. On confirm: write to Firestore in a single batch:
   - Set `status` to `Completed`
   - Set `actualHours` to the entered value
   - Set `completedAt` to current server timestamp
   - Append `{ status: "Completed", changedAt: Timestamp, changedBy: currentUserName }` to `statusHistory`
   - Increment engineer's `completedDocuments` counter
   - Decrement engineer's `activeDocuments` if applicable
6. Show a success toast: `"Document marked complete — {actualHours} hrs logged"`

**Validation rules for actual hours input:**
- Must be a number greater than 0
- Allows decimals in 0.5 increments (e.g., 1.5, 2.0, 3.5)
- Cannot be empty or zero — block submission with inline error: `"Please enter the actual hours worked"`
- No upper limit enforced (edge cases exist where a document takes far longer than estimated)

---

### Deliverable Checklist
- [ ] ECRN Detail page shows all metadata cleanly
- [ ] Document table shows Est. Hours and Actual Hours columns (actual shows `—` until completed)
- [ ] Clicking document opens right-side drawer
- [ ] Flowchart in drawer shows current position correctly
- [ ] Status history log shows all transitions with timestamps
- [ ] Moving stage updates Firestore and engineer status
- [ ] Marking document Completed triggers inline actual hours panel inside drawer
- [ ] Actual hours panel pre-fills with estimated hours as reference
- [ ] Submission blocked if actual hours is empty or zero
- [ ] Firestore batch write saves actualHours + completedAt + statusHistory atomically
- [ ] "All complete" banner prompts ECRN closure

**STOP. Confirm Phase 3 complete before proceeding.**

---

## PHASE 4 — People Tab + ECRN Tab + Search

### People Tab

#### Engineer List
Two sections:

**Free Engineers** (card grid or table)
- Name, Employee ID, Completed Documents count
- Green "Free" status badge

**Engaged Engineers** (card grid or table)
- Name, Employee ID, Active Documents count, Completed Documents count
- Amber "Engaged" status badge

Clicking any engineer card/row opens **Engineer Detail Panel** (right drawer or modal):
- Engineer name, ID
- List of **currently active documents** (Document Number + ECRN Number + Status badge + Estimated Hours)
- List of **completed documents** (Document Number + ECRN Number + Est. Hours + Actual Hours + Completed timestamp)
- Total completed count
- Total estimated hours vs total actual hours (summary line at bottom of completed list)

#### Search Bar (Universal Search)
Place a prominent search input at top of People tab.
Support the following search modes, auto-detected:

| User Types | Result Shown |
|---|---|
| ECRN number (e.g. "ECRN-2024-001") | All engineers working on that ECRN |
| Document number | Engineer currently assigned to that document + status |
| Person name or Employee ID | That engineer's profile + current assignments |

Search should be real-time (filter from already-fetched Firestore data, no re-query on each keystroke).

---

### ECRN Tab

#### Four Sub-Tabs / Sections (toggle buttons or pill tabs):
1. **Running**
2. **Completed**
3. **With PE**
4. **Query Hold / Pending**

Each section shows a table of ECRNs in that category.
Table columns: ECRN Number | Priority | Deadline | PE Name | Progress | Created At | Actions

#### Status Switch Feature
In the `Actions` column, provide a **"Move to..."** dropdown button allowing the admin to switch an ECRN between categories:
- Running → Query Hold
- Query Hold → Running
- Running → With PE
- With PE → Completed (triggers confirmation)

All status changes write to Firestore immediately.

Clicking ECRN number in any list navigates to ECRN Detail page (Phase 3).

---

### Deliverable Checklist
- [ ] People tab shows Free and Engaged engineer sections with live data
- [ ] Engineer detail drawer shows active + completed documents
- [ ] Universal search works for ECRN number, document number, and person name
- [ ] ECRN tab has 4 filterable sections
- [ ] Status switch dropdown works and writes to Firestore
- [ ] Dark mode on all new components

**STOP. Confirm Phase 4 complete before proceeding.**

---

## PHASE 5 — Excel Export + Polish + Deployment Prep

### Excel Export Feature

Add an **"Export to Excel"** button on:
- Home tab (exports all running ECRN summary)
- ECRN tab (exports current filtered view)
- People tab (exports engineer workload summary)
- ECRN Detail page (exports that ECRN's full document list)

Use the **SheetJS (`xlsx`)** library. Do NOT generate CSV.

Requirements for each export:

#### ECRN Summary Export (from Home / ECRN tab)
- Sheet 1: "Summary" — Table with columns: ECRN Number | Priority | Deadline | PE Name | Status | Total Docs | Completed Docs | Progress %
- Sheet 2: "Status Chart Data" — Data formatted to power a bar chart (ECRN count by status)
- Column widths auto-fitted to content
- Header row: bold, background fill, frozen row

#### Engineer Workload Export (from People tab)
- Sheet 1: "Engineers" — Name | Employee ID | Status | Active Docs | Completed Docs | Total Est. Hours (completed) | Total Actual Hours (completed) | Efficiency %
  - Efficiency % = (Total Est. Hours / Total Actual Hours) × 100, formatted as percentage
- Sheet 2: "Workload Chart" — Data for bar chart of active docs per engineer
- Sheet 3: "Hours Comparison" — Data for grouped bar chart: estimated vs actual hours per engineer (completed documents only)

#### ECRN Detail Export (from ECRN Detail page)
- Sheet 1: "ECRN Info" — All ECRN metadata fields as key-value table
- Sheet 2: "Documents" — Document Number | Assigned Engineer | Est. Hours | Actual Hours | Variance (Actual − Est.) | Status | Completed At
  - Variance column: color-coded cell fill — green if actual ≤ estimated, amber if up to 20% over, red if more than 20% over
  - Summary row at bottom: Total Est. Hours | Total Actual Hours | Overall Variance
- Sheet 3: "Status History" — Per-document status transition log
- Sheet 4: "Hours Chart Data" — Two-column bar chart data comparing estimated vs actual hours per document number

All sheets must open clean in Microsoft Excel and Google Sheets.

---

### Final Polish Checklist
- [ ] All Tailwind classes reviewed for dark mode correctness
- [ ] No hardcoded color values — all use Tailwind classes or CSS variables
- [ ] All Firestore listeners properly unsubscribed on component unmount
- [ ] Loading states on all async operations (skeleton loaders, not spinners where possible)
- [ ] Error boundaries on major route components
- [ ] Toast notification system for: ECRN created, document stage moved, document completed with hours logged, ECRN closed, export downloaded
- [ ] All buttons have disabled states during async operations
- [ ] Empty states for all list/table views (e.g., "No running ECRNs" with a subtle icon)

### Deployment Prep
- [ ] `.env` file with `VITE_FIREBASE_*` variables for all Firebase config values
- [ ] `firebaseConfig` reads from `import.meta.env.*` — no hardcoded keys in source
- [ ] `.gitignore` includes `.env`
- [ ] `public/_redirects` file for Cloudflare Pages SPA routing:
  ```
  /* /index.html 200
  ```
- [ ] `vite.config.ts` build output to `dist/`
- [ ] README with: project setup, env variable list, Firebase rules note, deploy steps

**STOP. Confirm Phase 5 complete. Full application is done.**

---

## ADDITIONAL BEHAVIORAL RULES FOR THE AI AGENT

1. **Ask before assuming** — If any requirement is ambiguous, stop and ask. Do not guess and build wrong.
2. **Modular file structure** — Separate files for each component, page, hook, util, and Firebase service. Do not dump everything in `App.tsx`.
3. **Suggested folder structure:**
   ```
   src/
     components/       # Reusable UI components
     pages/            # Route-level page components
     hooks/            # Custom React hooks (useECRNs, useEngineers, etc.)
     services/         # Firebase read/write functions
     store/            # Zustand stores
     types/            # TypeScript interfaces
     utils/            # Excel export, date formatting, etc.
     firebase.ts       # Firebase initialization
   ```
4. **TypeScript strict mode** — All Firestore documents must have matching TypeScript interfaces. No `any` types.
5. **Real-time data only** — Use `onSnapshot` listeners for all live views (Home metrics, ECRN lists, document statuses). Use `getDocs` only for one-time lookups (e.g., populating engineer dropdown in wizard).
6. **No page refreshes** — All data updates must reflect in UI instantly via Firestore listeners.
7. **Batch writes for multi-document operations** — Creating an ECRN with its documents must be a single Firestore batch.
8. **Git commit after each phase** — Before asking for phase confirmation, provide the git commit message to use.

---

## START INSTRUCTION

Begin with **Phase 1 only**.

Set up the Vite + React + TypeScript + Tailwind project, configure Firebase, implement the login screen with Employee ID + password auth, scaffold the global layout with header and three navigation tabs, and implement dark/light mode toggle.

Run on `localhost:5173`. Once all Phase 1 checklist items are verified, stop and wait for confirmation to proceed to Phase 2.