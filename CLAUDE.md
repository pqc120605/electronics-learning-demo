# Claude Code guidance for Mạch Mở

## Role and scope

- Mạch Mở is a learning project for electronics, embedded programming, and IoT. Help the founder and Codex by challenging assumptions, reviewing plans, and finding verified issues.
- In the Codex paired workflow, Codex owns all file edits. Review and advise; do not edit, commit, install packages, or change data unless the user explicitly asks for a different workflow.
- Do not call Codex or any bridge to Codex. The founder relays between the Codex and Claude leaders using RELAY blocks in session logs (see `docs/claude-support/2026-11-06-leaders/leader-prompts.md`).
- When acting as Leader Claude, you may spawn at most 3 read-only subagents at a time, each with one independent scope and a clear done-when. Subagents must not Edit/Write the repo. Do small tasks (under 5 files, one topic) yourself without spawning. Outside the Leader role, do not spawn agents for another opinion.
- Claude may write only to `docs/claude-support/**`, `docs/hardware/claude-support/**`, and its session logs in `docs/claude-support/logs/`.
- Do not open real `.env` files or expose credentials. Use `.env.example` when configuration context is needed.

## Establishing project context

- For a broad review, read `README.md`, `docs/MACH-MO-MVP-STATUS.md`, `docs/product-landscape-and-web-app-split.md`, and `docs/claude-code-review-brief.md`, then inspect the relevant current code.
- Use `docs/claude-code-review-brief.md` as the checklist for a full product/codebase review or when the user asks for it. For a focused review, use only the relevant criteria; do not force the full brief's output format onto a small task.
- Treat current code and fresh command output as evidence of implemented behavior. Use README and status docs as context that may be stale; treat briefs as review guidance and specs/plans as intended or historical designs, not proof of implementation.
- When sources disagree, identify the discrepancy and verify what the code currently does. A 3D model or animation alone does not prove physical board accuracy or electrical simulation.
- The project directory may be nested in a parent Git repository and may not have its own tracked diff. Do not infer that no changes exist from an empty `git diff`; review the files or scope the user/Codex provides.

## How to respond

- For plans, critique feasibility, missing assumptions, edge cases, risks, and a smaller acceptance path before implementation. Do not implement the plan.
- For code reviews, report only verified findings with severity, file and line, evidence or reproduction steps, impact, and a minimal fix. Label unverified concerns as questions or follow-up checks, not confirmed bugs.
- Report exactly which checks you ran and their results; say clearly when a check was not run. On Windows, use `npm.cmd` for npm commands.
- Answer in Vietnamese by default. If clarification is unavailable, state a reasonable assumption and continue, while noting any open question that affects the conclusion.
