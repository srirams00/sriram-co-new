# Forgot Password Account Existence Verification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent password reset dispatch for non-registered emails by verifying account existence in the database, returning a clear error with a registration link when no account exists, and only sending password reset tokens to registered accounts.

**Architecture:** Update `POST /api/auth/forgot-password` in `server/src/routes/authRoutes.ts` to return HTTP 404 with an actionable message when `User.findOne` returns null. Update `client/src/app/forgot-password/page.tsx` to handle this error state with clear user feedback and a direct registration CTA.

**Tech Stack:** Node.js, Express, Mongoose, Zod, Next.js 15, TypeScript.

---

## Global Constraints
- Preserve `CONSTRAINTS.md` floors: Server tests $\ge 125$, Client tests $\ge 57$.
- Zero `@ts-ignore` or suppressed type checks.
- Keep rate limiting via `authLimiter` active on the forgot-password route to prevent brute-force abuse.

## Review Focus
1. Non-existent email: must return HTTP 404 with `{ success: false, message: 'No account found with this email address. Please check your email or create a new account.' }`.
2. Existing registered email: must return HTTP 200 with `{ success: true, message: 'Password reset link dispatched...' }` and dispatch email.
3. Case-insensitivity: Email normalization with `.toLowerCase().trim()` must match accounts regardless of letter casing.
4. Client UI: Must show error banner and link to `/register` when 404 is received.
5. Client UI: Must not display "Reset Link Sent" for non-existent accounts.

---

### Task 1: Update Backend Forgot-Password Account Check & Tests

**Files:**
- Modify: `server/src/routes/authRoutes.ts:265-285`
- Modify: `server/src/tests/passwordReset.test.ts:40-53`

- [x] **Step 1.1**: Update `server/src/routes/authRoutes.ts` so that if `!user`, return `res.status(404).json({ success: false, message: 'No account found with this email address. Please check your email or register for a new account.' })`.
- [x] **Step 1.2**: Update `server/src/tests/passwordReset.test.ts` to test account existence validation and error response for non-existent accounts.
- [x] **Step 1.3**: Run `npm test --prefix server` and verify all tests pass ($\ge 125$).
- [x] **Step 1.4**: Run `npm run build --prefix server` to verify `tsc` compiles with 0 errors.

---

### Task 2: Enhance Forgot-Password Frontend UI with Registration CTA

**Files:**
- Modify: `client/src/app/forgot-password/page.tsx:48-62, 102-120`
- Modify: `client/src/lib/apiError.test.ts`

- [x] **Step 2.1**: Update `handleSubmit` in `client/src/app/forgot-password/page.tsx` to catch 404 errors and display clear, styled error banner with a link to `/register`.
- [x] **Step 2.2**: Ensure success state only activates when `res.success === true` and `res.encryptedRelay` or server dispatch succeeds.
- [x] **Step 2.3**: Run `npm test --prefix client` and verify all tests pass ($\ge 57$).

---

### Task 3: Final Verification & Deployment

- [x] **Step 3.1**: Run full server verification suite (`npm test --prefix server` - 131 passed).
- [x] **Step 3.2**: Run full client verification suite (`npm test --prefix client` - 59 passed).
- [ ] **Step 3.3**: Commit changes with clean commit message.
- [ ] **Step 3.4**: Push to `origin/main` to trigger automated deployment.
