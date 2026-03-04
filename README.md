# Withdraw App

Production-grade withdrawal UI built with **Next.js 15**, **TypeScript**, **Feature-Sliced Design (FSD)**, **Zustand**, and **shadcn/ui**.

## Getting Started

```bash
git clone https://github.com/palveeen22/withdraw-app.git
cd withdraw-app
```

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/withdraw`.

### Tests

```bash
pnpm test              # run all tests
pnpm test:watch        # watch mode
pnpm test:coverage     # with coverage report
```

---

## Architecture: Feature-Sliced Design (FSD)

```
src/
├── app/                         # Next.js App Router
│   ├── api/v1/withdrawals/
│   │   ├── _store.ts            # Shared singleton (POST + GET use same Map)
│   │   ├── route.ts             # POST /v1/withdrawals
│   │   └── [id]/route.ts        # GET /v1/withdrawals/:id (+ status progression)
│   ├── error.tsx                # Global React error boundary
│   ├── not-found.tsx
│   └── withdraw/page.tsx
│
├── widgets/withdraw-page/       # Page assembly widget
│
├── features/withdraw-form/      # User-facing feature
│   ├── model/
│   │   ├── schema.ts            # Zod validation
│   │   ├── withdrawStore.ts     # Zustand state machine (form + polling)
│   │   └── useWithdrawSubmit.ts # Submit logic + polling effect
│   └── ui/WithdrawForm.tsx
│
├── entities/withdrawal/         # Domain: types, API calls, StatusBadge, WithdrawalCard
└── shared/                      # fetch utility, config, sessionStorage cache, shadcn/ui
```

---

## Key Engineering Decisions

### 1. Idempotency Keys
UUID generated once per attempt and stored in Zustand. On network error, the same key is reused on retry — prevents duplicate charges regardless of how many times the user retries.

### 2. Double-Submit Protection — two independent layers
- **UI layer**: submit button `disabled` + `aria-busy=true` during loading
- **Hook layer**: `isSubmittingRef` (useRef) blocks concurrent calls before React re-renders

Both are necessary: the button alone can be bypassed if two submits fire before the first re-render.

### 3. State Machine
```
idle ──submit──▶ loading ──success──▶ success ──reset──▶ idle
                         └──error──▶  error   ──retry──▶ loading
                                               └─cancel─▶ idle
```
Polling runs as a parallel concern on top of the form state:
```
idle ──startPolling──▶ polling ──terminal status──▶ done
                               └──max attempts───▶ timeout
```

### 4. GET /v1/withdrawals/:id — Status Polling
After a successful POST, the app polls `GET /v1/withdrawals/:id` every 3 seconds (max 10 attempts = 30s). The WithdrawalCard shows a live spinner while polling and transitions to a confirmed state when status reaches `completed` or `failed`. This reflects how real async blockchain confirmations work.

```
POST → pending
  ↓ poll (3s)  → processing
  ↓ poll (8s)  → completed ✓
```

### 5. Shared In-Memory Store (Mock)
Both API routes (`POST` and `GET /[id]`) import from `_store.ts`, which exports module-level `Map` singletons. This means `GET /[id]` can actually find what `POST` created — a real bug in many test assignments.

### 6. Error Handling

| Error         | Behavior                                              |
|---------------|-------------------------------------------------------|
| 409 Conflict  | "A duplicate withdrawal request was detected"         |
| NetworkError  | "Network error — form preserved, retry safely"        |
| Other API     | `Request failed: <message>`                           |
| Polling error | Non-fatal — increments attempt counter, retries next tick |

Form values are **never cleared on error**.

### 7. Auth Token Storage (Production Approach)
This demo uses mock auth (no token). In production:
- Access tokens live in **`httpOnly`, `Secure`, `SameSite=Strict` cookies** — never `localStorage`
- The Next.js BFF (API routes) reads the cookie server-side and attaches the `Authorization` header before forwarding to the upstream service
- The client-side JS never has access to the raw token value
- CSRF protection comes from `SameSite=Strict` + `Origin` validation on the API

### 8. Session Restore (Optional Feature)
After success, the withdrawal is stored in `sessionStorage` (not `localStorage`) with a 5-minute TTL. On reload within that window, the last withdrawal is restored. `sessionStorage` was chosen because it is tab-scoped and cleared when the tab is closed — appropriate for short-lived UI state, not sensitive credentials.

### 9. Error Boundary
`app/error.tsx` catches any unhandled runtime errors in the React tree and renders a recovery UI. In production this hook should report to an error tracking service (Sentry, Datadog, etc.) via the `useEffect`.

### 10. No `dangerouslySetInnerHTML`
All text rendered via React's safe interpolation. No raw HTML injection anywhere.

---

## Tests (20 total)

| File | Cases |
|------|-------|
| `WithdrawForm.test.tsx` | Happy path, error display, retry UX, double-submit (3 cases), validation (2 cases) |
| `useWithdrawSubmit.test.ts` | Success + polling starts, correct payload, poll tick, terminal stops polling, poll timeout, 409, network error, idempotency key on retry, double-submit (2 cases) |

---

## Mock API

### `POST /api/v1/withdrawals`
```
Headers: Idempotency-Key: <uuid>
Body:    { amount: number, destination: string, currency: string }

201 → Withdrawal object (status: "pending")
409 → { message: "Withdrawal already exists with ID ..." }
422 → Validation error
```

### `GET /api/v1/withdrawals/:id`
```
200 → Withdrawal (status auto-progresses: pending → processing → completed)
404 → { message: "Withdrawal :id not found" }
```

Status progression in mock:
- `0–3s` → `pending`
- `3–8s` → `processing`
- `>8s`  → `completed`
# withdraw-app
