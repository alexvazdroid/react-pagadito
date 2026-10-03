# Decisions & Notes

Fill this in as you work, not all at once at the end — it's easier to be accurate that way. There's
no minimum or maximum length. We care about substance, not volume.

## 1. Summary

In this assessment, I completed all core requirements end-to-end. For **Auth**, I built account onboarding (sign up, login, and account overview), securely persisting session tokens in `expo-secure-store` with startup rehydration and automatic session invalidation on 401 responses. For **Cards**, I identified and fixed all 5 intentional bugs across sensitive data logging, unencrypted storage, missing focus refreshes, and unmounted lifecycle leaks. For **Transactions**, I implemented the transaction list and authorization flow, featuring payload-tracked idempotency (`useRef`), immediate double-submission prevention during the ~5s network delay, and distinct UI handling for business declines versus network errors. Additionally, all 10 automated unit tests pass in Jest (`npm run test`), validating currency conversion, API status branching, and idempotency headers.

In terms of scope, I intentionally followed the brief's guideline to omit a dedicated transaction detail screen in favor of polishing the authorization and list flows. I also prioritized deterministic API and logic tests over brittle React Native Testing Library render tests, ensuring reliable test suites that protect financial calculations and deduplication logic against regressions.

## 2. Bugs found in the Cards feature

List each bug you found and fixed. For each one: what was wrong, why it mattered (what would
actually break for a user or for the business), and how you fixed it. If you looked for bugs and
didn't find all of them, that's fine to say — don't pad this list with things that weren't
actually broken.

| #   | What was wrong                                                                                              | Why it mattered                                                                                                                                                                                      | Fix                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `console.log` printed full card details (card number, CVV, expiration, cardholder name) in `cards/add.tsx`. | **PCI-DSS violation & data leak:** Sensitive card data and CVV were exposed in device logs. Any app with log access or crash reporting tool could read plain-text payment credentials.               | Removed the `console.log` statement so card and CVV details are never written to device logs.                                                   |
| 2   | `lib/storage.ts` used `AsyncStorage` to persist `paytest.lastCardToken`.                                    | **Insecure storage:** `AsyncStorage` saves data unencrypted in plain text files. A compromised device or backup could expose card reference tokens.                                                  | Replaced `AsyncStorage` with `expo-secure-store` to keep card tokens encrypted at rest via Keychain/Keystore.                                   |
| 3   | Cards list (`cards/index.tsx`) used `useEffect` which only ran on initial component mount.                  | **Stale UI:** When a user added a new card and returned to the list, the screen did not update. The user had to pull-to-refresh manually to see the card.                                            | Replaced `useEffect` with `useFocusEffect` from Expo Router / React Navigation so the list automatically refetches when the screen gains focus. |
| 4   | Card detail (`cards/[token].tsx`) had an empty dependency array `[]` and no cleanup.                        | **Stale closure & memory leak:** If the route parameter `token` changed, the card did not reload. Also, navigating back before the API call finished caused state updates on an unmounted component. | Added `token` to the dependency array `[token]` and added an `isMounted` check to prevent memory leaks and unmounted state updates.             |
| 5   | Card detail error screen (`cards/[token].tsx`) rendered `<ErrorView message={error} />` without `onRetry`.  | **Broken error recovery:** If fetching a card failed due to a temporary network error, the user was stuck with no way to retry other than leaving the screen.                                        | Passed the retry callback (`onRetry={...}`) to `ErrorView` so the user can tap to retry immediately.                                            |

## 3. Auth feature — key decisions

Pick the decisions that mattered most. For each: what you chose, what the alternative was, and
why you didn't go the other way. Examples worth writing down: where and how you store the session
token, whether/how you persist it across app restarts, what happens on logout vs. delete account,
and what the app does if a request comes back 401 mid-session.

### 1. Secure session token storage (`expo-secure-store` vs `AsyncStorage`)

- **Choice:** I chose `expo-secure-store` to persist the session token.
- **Alternative considered:** `AsyncStorage` or unencrypted local storage.
- **Why:** `expo-secure-store` uses native OS security features: **iOS Keychain** and **Android Keystore**. This keeps the token encrypted on the device and protected against unauthorized access from file system inspection or backups. `AsyncStorage` instead saves data in plain text, which creates a security risk by exposing sensitive auth credentials if the device is inspected or compromised.

### 2. Handling 401 Unauthorized responses mid-session

- **Choice:** Added an interceptor check directly in `apiFetch` (`lib/api.ts`). If `response.status === 401`, it immediately calls `setSessionToken(null)` before throwing the error.
- **Alternative considered:** Throwing a generic error and handling 401 manually inside each individual screen, or doing nothing and leaving the expired token active until the user manually clicks "Log out" in Account settings.
- **Why:** In the original code, when a token expired or was revoked, the user was trapped in an infinite error loop. Tapping "Retry" on any screen kept resending the same dead token. By calling `setSessionToken(null)` globally in `lib/api.ts`, the app immediately resets its auth state, clears the expired session, and sends the user back to the Login screen cleanly across all tabs (Cards, Transactions, Account).

### 3. Session persistence and token rehydration on app launch

- **Choice:** Rehydrate the stored session token from `expo-secure-store` during initial app startup before mounting authenticated screens.
- **Alternative considered:** Leaving the session in-memory only (the starter code default), or reading asynchronously from storage on every single API request.
- **Why:** An in-memory only session forces the user to log in again every time the application is closed or restarted. Reading from SecureStore on every API request would introduce asynchronous latency into every network call. Loading the token once on launch into `lib/session.ts` gives a seamless user experience across app restarts while keeping network calls fast and synchronous.

### 4. Logout vs. Delete Account lifecycle and 204 response handling

- **Choice:**
  - _Logout (Client-side, non-destructive):_ When the user taps "Sign out", the app immediately clears the token from memory and `expo-secure-store` (`setSessionToken(null)`). This instantly bounces the UI back to Login while leaving user data intact on the backend.
  - _Delete Account (Server-side, permanent):_ Prompts the user with a confirmation alert (`Alert.alert`) before proceeding. Upon confirmation, it sends a `DELETE /me` request. I updated `apiFetch` in `lib/api.ts` to handle HTTP `204 No Content` properly without crashing on empty JSON parsing. Only after the backend successfully confirms deletion does the client clear the local token (`setSessionToken(null)`) and exit to Login.
- **Alternative considered:** Sending an unnecessary network request on logout, or clearing the local session before the server confirms account deletion.
- **Why:** Logout only requires local credential disposal. Delete account is permanent and deletes all cards and transactions remotely; confirming first prevents accidental destruction, and waiting for the 204 response ensures the backend account was actually deleted before wiping local state.

## 4. Transactions feature — key decisions

Pick the 3–5 decisions that mattered most (not everything you typed). For each: what you chose,
what the alternative was, and why you didn't go the other way. Examples of the kind of decision
worth writing down: how you generate and persist the idempotency key, how you distinguish a
business decline from a transport error in your UI, how you prevent double submission, how you
handle the ~5s delayed response.

### 1. Idempotency key lifecycle and payload tracking (`useRef`)

- **Choice:** Track the transaction payload (`amount`, `cardToken`, `description`) and the idempotency key using a `useRef`. If the user submits the exact same payment attempt again (e.g., retrying after a network timeout or transport failure), the app reuses the same key. If the user edits the amount, changes the card, or updates the description, the app immediately generates a fresh idempotency key.
- **Alternative considered:** Generating the key only once when mounting the screen (`useState`), or generating a new key on every button press.
- **Why:** Generating a key once on screen mount caused a critical bug: after receiving a `DECLINED` result for `$10.01`, editing the amount to `$10.02` reused the same key, causing the backend to return the cached `DECLINED` response. Conversely, generating a new key on every click breaks deduplication during network retries. Tracking payload changes ensures retry safety while preventing stale cached results when inputs change.

### 2. Double-submission prevention and handling ~5s network delay

- **Choice:** Immediately set a `submitting` boolean state when the user taps Pay. This disables the submit button, locks the form fields, and shows a loading spinner until the response arrives.
- **Alternative considered:** Keeping the button active and relying only on backend deduplication.
- **Why:** Some gateway responses take up to 5 seconds to resolve. Disabling the button immediately stops rapid accidental double-taps at the UI layer. The spinner also provides clear visual feedback so the user knows the transaction is processing and does not abandon the screen.

### 3. Distinguishing business declines from network/transport errors

- **Choice:** Treat HTTP status and transaction status separately. If the API returns `200 OK` with `status: 'DECLINED'`, keep the form values intact and display an inline message advising the user to try a different card. Reserve generic error alerts only for actual network failures or non-2xx responses (like 400 or 500).
- **Alternative considered:** Treating any non-`AUTHORIZED` status as a general error and closing the form.
- **Why:** A card decline is a normal business event (e.g., insufficient funds). Forcing the user out or clearing their input creates frustration. Keeping the form open lets the user simply choose another card and submit without re-entering the amount and description.

## 5. AI usage

Be specific and honest — this is read as a signal of judgement, not penalized for being high or
low.

- **What did you generate with AI and use largely as-is?**
  - Standard boilerplate UI forms and screens for Auth (`login.tsx`, `signup.tsx`) and the Transactions list screen, matching the design patterns of Cards.
  - TypeScript data types matching the `openapi.json` specification for request and response shapes.

- **What did you generate and then substantially rewrite or correct — and why?**
  - **The idempotency key handling in `authorize.tsx`:** AI initially generated the idempotency key once when mounting the screen with `useState`. During testing, when trying different amounts (such as `$10.01` and then `$10.02`), the backend returned the cached `DECLINED` response from the previous transaction because the key never changed. I rewrote this logic using a `useRef` to track changes in payload values (`amount`, `cardToken`, `description`). This creates a new key when the user edits payment fields, but keeps the same key if the user retries after a network error.
  - **Session token rehydration on startup:** AI implemented storing the token in `expo-secure-store`, but failed to properly implement the startup rehydration step. The user could log in, but closing and reopening the app lost the session. I caught this during testing and corrected the startup flow to read the stored token and initialize `setSessionToken` before rendering authenticated screens.
  - **Currency parsing in `lib/money.ts`:** Replaced the initial flawed decimal parsing logic with a reliable conversion to integer minor units.

- **What did you write yourself without AI assistance?**
  - The manual testing and diagnosis process that uncovered the idempotency caching bug when switching between test amounts.
  - Verifying and auditing mobile security best practices (ensuring tokens are stored securely in Keychain/Keystore and that sensitive card data is never leaked to device logs).
  - The verification of session invalidation and the 401 interceptor across the application flow.

- **Did AI suggest anything you _didn't_ use? Why not?**
  - AI suggested adding external state management and data fetching libraries (such as Redux Toolkit or TanStack Query). I decided against this because the application already has clear, lightweight patterns (`useSyncExternalStore` in `session.ts` and standard React hooks). Adding large external dependencies would add unnecessary complexity to the project.
  - AI initially suggested brittle UI component rendering tests using `@testing-library/react-native`. These tests caused asynchronous `act()` warnings and flaky runs. I discarded them in favor of meaningful, deterministic logic and API-level tests (`__tests__/api.test.ts` and `money.test.ts`) that directly verify business status branching (`DECLINED`), duplicate-submission idempotency headers, and money conversion without UI flakiness.

## 6. An ambiguity you resolved

Something in this brief that wasn't fully specified. What did you assume, what was the
alternative, and why did you go the way you did? Pick something real — not something you're
manufacturing to fill this section. You'll be asked to defend this live, unprepared, in the
follow-up conversation.

### 1. Defining what constitutes the "same attempt" for Idempotency

- **The Ambiguity:** The brief instructed: _"If you retry the same attempt (e.g. after a timeout or a 'try again'), reuse the same key rather than generating a new one."_ However, it did not define what constitutes the "same attempt": does it mean within the lifetime of the screen mount, or does it mean the exact same transaction payload?
- **What I Assumed:** An attempt is strictly defined by the combination of payment fields (`amount`, `cardToken`, `description`). If any field changes on the same screen, it represents a brand new attempt and must receive a fresh idempotency key.
- **The Alternative:** Scoping the key to the screen lifecycle (`useState(() => generateIdempotencyKey())`).
- **Why:** Reusing a screen-scoped key caused a real defect during testing: changing the amount after receiving a `DECLINED` outcome caused the gateway to return the cached `DECLINED` result for the new amount. Tracking payload differences via `useRef` provides deduplication protection on network retries while allowing users to correct amounts or cards without getting stuck with stale gateway responses.

### 2. Visual treatment of expired cards in the card picker

- **The Ambiguity:** The brief specified that an expired card _"must be visibly flagged and must not be selectable in the picker."_ It did not specify whether expired cards should be completely hidden from the list or kept visible but disabled.
- **What I Assumed:** Render expired cards in the list with reduced visual opacity, an explicit "Expired" badge, and disabled touch interaction (`disabled={true}`).
- **The Alternative:** Filtering them out completely (`cards.filter(c => !isExpired(c))`).
- **Why:** Completely hiding expired cards creates confusion, leading users to wonder if their card was deleted or failed to fetch. Displaying them disabled provides clear visibility and feedback, explaining why the card cannot be chosen while preventing invalid requests from reaching the payment API.

## 7. What you'd do with more time

Anything you knowingly cut, simplified, or left rough. This is not a confession booth — cutting
scope under a time box is expected and normal. We just want to know it was a decision, not an
oversight.

- **Dedicated Transaction Detail Screen:** As allowed by the brief, I omitted building an individual transaction detail screen (`/transactions/[id]`) to prioritize the authorization flow, idempotency logic, and error edge cases. With more time, I would build a detailed receipt view showing raw gateway transaction IDs, timestamps, payment card badges, and status breakdowns.
- **Proactive Offline Network Detection:** Add `@react-native-community/netinfo` to detect when the device loses internet connectivity before the user taps Pay. This would disable the submit button proactively and show an offline notice instead of waiting for a network request timeout.
- **Biometric App Lock:** Add `expo-local-authentication` (Face ID / Fingerprint) to prompt the user to unlock the app when returning to an existing persisted session.

## 8. Anything that surprised you

Anything about the API, the codebase, or the task itself that didn't behave the way you expected.

- **Testing environment with Expo Go:** The brief suggested testing against an iOS simulator or Android emulator, but I ended up running and testing the client using **Expo Go**. The core features (including `expo-secure-store` and HTTPS requests to the live backend) worked smoothly without needing native simulator builds, allowing for fast verification.
- **Asynchronous UI testing with React Native Testing Library:** Attempting to write UI render tests for the authorization screen caused overlapping `act()` warnings due to asynchronous promises. Instead of wrestling with flaky UI tests (which the brief notes often just test rendering), I pivoted to direct API and logic tests (`api.test.ts` and `money.test.ts`). This verified the exact required business cases (status branching, idempotency headers, money math) deterministically.

## 9. Recording

Link or attach your screen recording here, and note what it shows (which amounts, which
outcomes).

- **Recording Link / Attachment:** `[https://drive.google.com/file/d/14VarlI-FFrOF2iWsMtyx4LFfyC9k5ruF/view?usp=sharing]`
- **Demonstrated Scenarios & Outcomes:**
  - **`$10.00` (`amount: 1000`):** Lands in `AUTHORIZED` status, confirming successful payment and navigating back to the updated transaction list.
  - **`$10.01` (`amount: 1001`):** Lands in `DECLINED` status, keeping form inputs intact and showing an inline message prompting the user to try another card.
  - **`$10.05` (`amount: 1005`):** Demonstrates responsiveness during the ~5s backend delay (loading spinner, disabled double-submission lock) before completing with `AUTHORIZED`.
