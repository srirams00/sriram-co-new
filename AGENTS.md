# Agent Guidelines for Sri Ram & Co

Read `CONSTRAINTS.md` before writing code. Do not weaken it to make a change pass.

## Core Rules:
1. **Never Lower Constraints**: Never edit numbers down in `CONSTRAINTS.md` or delete tests to get to green.
2. **Fail-Closed on Regressions**: If a test or type check fails, fix the code, do not suppress the error (`@ts-ignore`, `eslint-disable`).
3. **Run Verification Commands**:
   - Fast loop (< 30s): `npx tsx --test <path_to_test_file>`
   - Final gate: `npm test --prefix server` (must pass ≥ 125 tests) and `npm test --prefix client` (must pass ≥ 57 tests).
