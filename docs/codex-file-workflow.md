# Working with the Cliqstr Repo in Codex Sessions

This guide explains how the previous auth recovery changes altered the repository and how you can keep track of them while you continue pushing `main` directly for Vercel production deploys.

## What Was Updated Already

The last Codex pass touched both documentation and the API routes involved in the child-invite approval flow:

- `docs/auth-recovery-plan.md` documents the live test plan and the exact auth fixes that were applied.
- `docs/vercel-deployment.md` records the push-to-Vercel checklist you asked for.
- `src/app/api/parent-approval/check/route.ts`, `src/app/api/parent-approval/plan/route.ts`, `src/app/api/parent-approval/signup/route.ts`, and `src/app/api/parent/children/route.ts` contain the Convex-backed fixes that unblocked Smart Router and Parents HQ.

If you want to verify those edits locally, run `git log --stat` or open each file in your editor—everything lives in your existing folder structure under `docs/` and `src/app/api/...`.

## How to See What Changed in Your Current Session

1. Run `git status -sb` at any time to see which files are modified.
2. Use `git diff <file>` (for example, `git diff src/app/api/parent-approval/check/route.ts`) to inspect the exact line edits Codex produced.
3. Once you are satisfied, stage the files with `git add .` and create a commit (for example, `git commit -m "Describe the change"`).
4. Push straight to `main` with `git push origin main`—your Vercel production deployment will start automatically.

Because you are deploying directly from `main`, make sure the working tree is clean (`git status` reports "nothing to commit") before you run `pnpm build` or push upstream.

## Recommended Local Loop Before Each Push

- `pnpm install` (only if the lockfile changed).
- `pnpm lint` and `pnpm build` to catch TypeScript or ESLint issues.
- `pnpm test` or targeted smoke tests when you add new coverage.

This mirrors the steps in Vercel’s build pipeline, so catching failures locally saves another live production redeploy.

## Need a Fresh Start?

If you ever want to discard Codex’s edits before committing, run `git reset --hard HEAD` to reset the working tree to the last commit. That way you can keep experimenting without worrying about stale files.