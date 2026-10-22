# Sri Ram & Co Quality Constraints Contract

Last reviewed: 2026-10-22 by @silvest
Enforcement Mode: Block on Floor (Fail-closed)

---

## 1. The Quality Floor (Always Enforced, No Exceptions)

* **No Suppression Bypasses**: No new `@ts-ignore`, `@ts-nocheck`, or `eslint-disable` comments.
* **No Unimplemented Stubs**: No empty `catch {}` blocks, unhandled promise rejections, or dummy `throw new Error('Not implemented')`.
* **Test Preservation**: No skipped (`it.skip`), disabled, or deleted tests. Tests only increase.
* **Zero Secrets in Source**: No API keys, database credentials, Zoho passwords, or Razorpay secrets committed to git.
* **Non-Degradation Contract**: This file does not get weakened, deleted, or threshold-lowered to make a broken change pass.

---

## 2. Enforced Standards with Verifiable Commands

| Dimension | Rule & Threshold | Command | Runs At |
|---|---|---|---|
| **Server Types** | Zero compile errors (TypeScript 5.7 strict) | `npm run build --prefix server` | Every task completion |
| **Server Test Suite** | **≥ 125 passing tests**, 0 failures, 0 skipped | `npm test --prefix server` | Every task completion |
| **Client Test Suite** | **≥ 57 passing tests**, 0 failures, 0 skipped | `npm test --prefix client` | Every task completion |
| **Client Production Build** | Zero build errors across all 37 pages | `npm run build --prefix client` | Milestone completion |
| **Dependency Security** | Zero high or critical vulnerabilities | `npm audit --prefix server` | Every release |
| **Static Code Security (SAST)**| 0 security rule violations | `npx tsx --test server/src/tests/sastCompliance.test.ts` | Every security change |
| **Email Security** | Zero CRLF header injection vectors | `npx tsx --test server/src/tests/securityHardening.test.ts` | Every email edit |
| **Origin Shielding** | Constant-time timing-safe token validation | `npx tsx --test server/src/tests/securityHardening.test.ts` | Every auth/route edit |

> **Note**: Every row above names the exact executable command that produces the verdict. If a metric cannot be mechanically checked by a command, it is not a constraint.

---

## 3. Ratchet Baseline (Today's Measured Baseline)

A ratchet only turns forward. Metrics must never fall below these numbers:

| Metric | Measured Baseline (2026-10-22) | Minimum Allowed Direction |
|---|:---:|---|
| Server Automated Tests | 125 | Strictly non-decreasing (≥ 125) |
| Client Automated Tests | 57 | Strictly non-decreasing (≥ 57) |
| Server Audit Vulnerabilities | 0 | Must stay 0 |
| Next.js Static & Dynamic Routes | 37 | Must compile without errors |
| Client First Load JS (Shared) | 104 kB | Must not exceed 165 kB |

---

## 4. Execution Time & Verification Budget

* **Intermediate Edit Loop**: Must complete in **under 30 seconds** (run focused test file via `npx tsx --test <file>`).
* **Final Delivery & PR Gate**: Full suite verification (`npm test --prefix server` + `npm test --prefix client`). Full Next.js production build (`npm run build --prefix client`) is required prior to claiming completion.

---

## 5. Exceptions Log

| ID | Rule | Scope | Justification | Expiration | Owner |
|---|---|---|---|---|---|
| *None* | — | — | No active exceptions. System is 100% compliant. | — | @silvest |
