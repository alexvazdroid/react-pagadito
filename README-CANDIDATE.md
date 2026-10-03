# PayTest — Mobile Payment Client (Technical Assessment)

Welcome. This is a React Native / Expo client for a simulated payment gateway. You'll spend the
next **~2.5 hours** building account onboarding, fixing real bugs in an existing feature, and
building a payments feature from scratch — the same way you'd do it on any team: by reading code
that isn't yours, understanding an API contract, and shipping something that works.

## You are allowed to use AI

ChatGPT, Claude, Copilot, Cursor, Stack Overflow, docs — whatever you normally use. We're not
evaluating whether you can type code from memory. We're evaluating whether you can **understand,
verify, and integrate** it correctly, and whether you understand *why* the code you ship is
correct. Explaining a decision you can't defend in the follow-up conversation is a bigger problem
than not finishing.

## Setup

No local backend, no Docker, no database. The API is already deployed and running:

```
EXPO_PUBLIC_API_URL=https://api-assessment.pagadito.dev
```

This is already the default in `lib/env.ts` — you don't need to configure anything. If you want to
override it (e.g. to point at your own instance), copy `.env.example` to `.env`.

**API reference:** https://api-assessment.pagadito.dev/docs (interactive Swagger UI) or
https://api-assessment.pagadito.dev/openapi.json (raw spec, importable into
Postman/Insomnia). This is your source of truth for request/response shapes — you don't have
access to the backend source, the same way you wouldn't when integrating a real payment gateway.
Every endpoint except signup/login requires a bearer token — see Part 0.

```bash
npm install
npm run start        # then press i (iOS simulator) or a (Android emulator)
```

**Use a simulator or emulator, not a physical device.** The app talks to a public HTTPS URL, so
this isn't a networking requirement — it's just what we've verified against.

The app already compiles and runs — but "runs" currently means it lands on a Log in screen that
says "not implemented yet," because it does not do anything yet. That's expected, not a bug: the
whole app is gated behind login, and login is the first thing you'll build (Part 0). If it doesn't
compile on your machine at all, that's worth mentioning in `DECISIONS-TEMPLATE.md` — a legitimate
finding, not something to hide.

The API is a **shared, live instance** — other candidates use the same one. Every account you
create, and everything you do inside it, is scoped to that account — you won't see other
candidates' cards or transactions, and they won't see yours. Nothing about the exercise requires
exclusive access to the backend.

## What's already here

- **Cards** (Add, List, Retrieve) is a working feature end-to-end, once you're logged in. It has
  bugs. Some are obvious, some aren't.
- **Auth** (`app/(auth)/login.tsx`, `signup.tsx`) and **Account** (`app/(tabs)/account/index.tsx`)
  are stubs — placeholder screens. You build this.
- **Transactions** (`app/(tabs)/transactions/`) is a stub — two screens that render a placeholder
  message and nothing else. You build this too.
- Shared infrastructure every feature depends on: `lib/api.ts`, `lib/session.ts`, `lib/money.ts`,
  `lib/storage.ts`, `lib/theme.ts`, and the components in `components/`. `lib/api.ts`'s `apiFetch`
  already attaches a bearer token automatically to every request, *if* `lib/session.ts` has one —
  setting it (and clearing it) is your job.

Look at how the Cards feature is structured before you start building — the patterns it uses
(loading/error/empty states, navigation, form handling) are the ones we expect you to follow, not
reinvent.

## Part 0 — Build account onboarding (~20–25 min)

Nothing in the app is reachable without an account. Build:

- **Sign up** (`app/(auth)/signup.tsx`) — email + password, calls `POST /auth/signup`, which
  returns a token and logs you in immediately (no separate login step needed right after).
- **Log in** (`app/(auth)/login.tsx`) — calls `POST /auth/login`.
- **Log out** and **delete account**, both in the Account tab (`app/(tabs)/account/index.tsx`) —
  log out should just clear the session; delete account is destructive and permanent (it also
  deletes your transactions), so it should confirm before doing it.

Requirements:

1. On success, store the token (`setSessionToken` from `lib/session.ts`) so `apiFetch` starts
   attaching it automatically, and get the user into the app.
2. Staying logged in across an app restart is up to you — `lib/session.ts` is in-memory only by
   design. If you want that, decide where and how to persist the token and rehydrate it on launch.
3. Logging out or deleting the account must actually clear the session (`setSessionToken(null)`)
   — not just navigate away.
4. Show the logged-in user somewhere in the Account tab (`GET /me`).

You do not need password reset, email verification, or remember-me. A working create → use → log
out → log back in → delete loop is the deliverable.

## Part 1 — Fix the Cards feature (~45–50 min)

The Cards feature works, but it shouldn't pass a real code review. We've left intentional issues
across security, state management, and error handling. Some are in screens, some are in shared
code — a bug in shared code affects Transactions too, so fixing it early pays off twice.

We won't tell you how many there are or what they are. Finding them is part of the assessment.
Categories to guide your review, not a checklist to blindly match against:

- Sensitive data handling (what happens to card data — and now account data — after it's
  submitted, and what gets logged or persisted client-side)
- React state correctness (effects, stale closures, screens that don't refresh when they should)
- Error and loading states that don't recover properly

## Part 2 — Build the Transactions feature (~60–70 min)

Implement the two stub screens:

- **List** (`app/(tabs)/transactions/index.tsx`) — consume `GET /transactions`. Same
  loading/error/empty/refresh contract as the Cards list. Returns only your own transactions.
- **New transaction** (`app/(tabs)/transactions/authorize.tsx`) — a form (description, amount,
  card picker) that calls `POST /transactions/authorize`.

Functional requirements:

1. **Distinguish transport success from payment status.** A `200 OK` does not mean the payment was
   approved. The response body's `status` field can be `AUTHORIZED`, `DECLINED`, or `PENDING` —
   your UI must handle all three distinctly. The gateway can also return non-2xx errors (invalid
   card, inactive card, expired card, validation errors) — those are a different failure mode from
   a business decline and should be presented differently to the user.
2. **Prevent double submission.** Rapid double-taps or slow network responses must not create two
   transactions for one user action.
3. **Idempotency.** Generate a unique idempotency key per authorization attempt and send it as the
   `Idempotency-Key` header. If you retry the *same* attempt (e.g. after a timeout or a "try
   again"), reuse the same key rather than generating a new one — the backend deduplicates on it
   and will return the original transaction instead of creating a second one. Generating a new key
   on every keystroke or re-render defeats the point.
4. **Card picker must respect expiration.** A card whose expiration date is already in the past
   must be visibly flagged and must not be selectable in the picker.
5. **Amounts are entered by the user as decimal currency** (e.g. "10.00") and must be converted to
   integer minor units before hitting the API (`amount: 1000`, not `10.00` or `"10.00"`). Check
   `lib/money.ts` before writing your own conversion — and verify it actually does what you expect
   across more than one input.
6. **Stay responsive during slow responses.** Some transactions take a few seconds to resolve on
   the backend. The UI must show that something is happening and must not let the user submit
   again while it waits.

You do not need to build a full transaction detail screen. A list + a working authorize flow that
correctly branches on status is the core deliverable.

## Test amounts

Transaction outcomes are **deterministic**, based on the amount you enter. This lets you reproduce
every state on demand instead of guessing:

| You enter | Sent as (minor units) | Result                                |
| --------- | ---------------------: | -------------------------------------- |
| $10.00    |                   1000 | `AUTHORIZED`                           |
| $10.01    |                   1001 | `DECLINED`                             |
| $10.02    |                   1002 | `PENDING`                              |
| $10.05    |                   1005 | `AUTHORIZED`, after ~5s delay          |

Other endings may also produce documented error responses — part of the exercise is discovering
how your app behaves when the backend returns something other than a clean success. Try a few
amounts you weren't told about.

Seeded cards you can authorize against are visible in the Cards tab once you're logged in. One of
them is inactive and one is expired — useful for exercising your error handling and the
expiration rule above.

## Testing

Write **at least two meaningful automated tests** (Jest is already configured — `npm run test`).
Good candidates: money conversion, the business-status branching (`AUTHORIZED` /`DECLINED`
/`PENDING`), duplicate-submission prevention, or form validation. Tests that just assert a
component renders don't count.

## Ambiguity is normal — don't guess silently

Somewhere in this brief you'll hit a point that isn't fully specified. That's not a flaw in the
brief, it's normal — the same thing happens on a real team. Don't just quietly pick something and
move on: document the ambiguity you hit, the judgment call you made, and why, in
`DECISIONS-TEMPLATE.md`. Be ready to walk through it and defend the alternative you *didn't* pick
in the follow-up conversation.

## Before you submit

- `npm run typecheck` and `npm run test` should both pass.
- Record a short screen capture (30–60s — a phone screen-recording or a simulator recording is
  fine, no editing needed) of the Transactions flow actually running: authorize at least two
  different test amounts that land in *different* outcomes (e.g. one `AUTHORIZED`, one `DECLINED`
  or `PENDING`) and show the app branching correctly on each. Any common format (mp4/mov/gif)
  works. Link or attach it where `DECISIONS-TEMPLATE.md` asks for it.
- Fill in `DECISIONS-TEMPLATE.md`. This is not a formality — it's a significant part of how you're
  evaluated, especially given AI usage is allowed. Be specific and be honest about what you didn't
  get to.
- If you're done early: multi-currency formatting, offline detection before allowing a submit, a
  card-brand icon, persisting the session securely across restarts (if you haven't already), or a
  test that mocks the API to assert AUTHORIZED/DECLINED/PENDING UI branching without hitting the
  network are all fair game — but only after the core requirements above are solid. A polished
  bonus feature does not offset an unfixed core bug.

Good luck.
