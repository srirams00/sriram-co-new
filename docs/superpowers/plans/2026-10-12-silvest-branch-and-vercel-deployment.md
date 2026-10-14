# Plan: Create `silvest` Branch & Deploy Collaborator Commits to Vercel

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## 1. Problem Context & Root Cause Analysis

### The Vercel Hobby Limitation
On **Vercel Hobby (Free Personal Accounts)** with **Private GitHub Repositories**:
- Vercel strictly ignores/blocks automated production deployments triggered by **outside collaborators / non-team contributors**.
- Commits `114a72c` and `5865cf7` were pushed directly to `origin/main` by collaborator account `Silvest AJ`.
- Even though GitHub `origin/main` received the commits, Vercel silently dropped the webhook because the commit author is not the Vercel project owner (`srirams00`).

### Git Current State
- `origin/main` currently sits at `5865cf7` (including both `114a72c` and `5865cf7`).
- If we create a `silvest` branch from `main` and try to open a Pull Request into `main` without adjusting `main`, GitHub will report:
  > *"There isn't anything to compare. `main` and `silvest` are entirely identical."*

Therefore, we have two pathways:
1. **Direct Vercel Dashboard Trigger (Fastest, zero Git alteration)**: The owner clicks "Redeploy" on Vercel Dashboard for `5865cf7`.
2. **Proper Pull Request Workflow (Clean Git flow)**: 
   - Branch `silvest` is created at `5865cf7` and pushed to GitHub (`origin/silvest`).
   - If a formal PR is desired, `origin/main` can be pointed back to the owner's last commit `edab923`, allowing a PR from `silvest` -> `main`.
   - When the owner merges the PR, GitHub creates a merge commit authored by the repository owner, which Vercel immediately deploys.

---

## 2. Step-by-Step Execution Plan

### Task 1: Create and Push the `silvest` Branch
- [ ] Check out a new branch named `silvest` containing all latest code:
  ```powershell
  git checkout -b silvest
  ```
- [ ] Push branch `silvest` to GitHub remote:
  ```powershell
  git push -u origin silvest
  ```
- [ ] Confirm remote tracking branch exists:
  ```powershell
  git branch -vv
  ```

---

### Task 2: Address the Vercel Hobby Deployment Block

#### Option A: One-Click Vercel Dashboard Redeploy (Instant, Zero Git Risk)
If `main` remains at `5865cf7`:
- [ ] Repository owner (`srirams00`) visits **[vercel.com/dashboard](https://vercel.com/dashboard)**.
- [ ] Selects the `sriram-and-co` project.
- [ ] Goes to **Deployments** tab.
- [ ] Clicks the three dots `...` on the latest deployment (or clicks **Create Deployment**), selects branch `main`, and clicks **Deploy / Redeploy**.
- [ ] *Result*: Vercel builds commit `5865cf7` with owner credentials without needing any git resets.

#### Option B: Reset `main` & Create Clean Pull Request for Owner to Merge
If the user prefers the full PR merge flow:
- [ ] Ensure `silvest` branch is pushed safely to `origin/silvest`.
- [ ] Switch back to `main`:
  ```powershell
  git checkout main
  ```
- [ ] Reset `main` back to owner commit `edab923` ("products added"):
  ```powershell
  git reset --hard edab923
  git push --force origin main
  ```
- [ ] Open GitHub Pull Request:
  - PR URL: `https://github.com/srirams00/sriram-co-new/compare/main...silvest?expand=1`
  - Title: `feat: security hardening, admin login, and category fixes`
  - Base: `main` <- Compare: `silvest`
- [ ] Repo owner (`srirams00`) clicks **"Merge Pull Request"**.
- [ ] *Result*: GitHub creates a merge commit authored by `srirams00`. Vercel automatically deploys it!

---

### Task 3: Verification
- [ ] Verify `origin/silvest` contains commits `114a72c` and `5865cf7`.
- [ ] Verify the Pull Request link is generated and accessible to the repo owner.
- [ ] Confirm successful build status in Vercel dashboard.
