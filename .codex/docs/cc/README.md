# Claude Code (CC) – Local Guide

This folder contains a concise, offline-friendly reference for working with Claude Code (CC) in this repo, including a planning model, usage workflow, prompt templates, QA checklists, and verified links. Use this to drive CC without re-checking the web.

## Key Links (Verified)
- Agents overview: https://docs.anthropic.com/en/docs/agents
- Claude Code: https://docs.anthropic.com/en/docs/agents/claude-code
- Use cases: https://docs.anthropic.com/en/docs/use-cases/claude-code
- Projects: https://docs.anthropic.com/en/docs/agents/projects
- Using Claude Code: https://docs.anthropic.com/en/docs/using-claude/claude-code
- Anthropic News index: https://www.anthropic.com/news

## Planning Model (TL;DR)
- Plans: Keep 3–7 steps; each step shippable with explicit acceptance criteria and a validation method.
- Scope: Constrain file paths, APIs, tools; request diffs before apply; require run/test instructions after changes.
- Checkpoints: Pause after planning, after diff preview, and after proposing validation/commands.
- Safety: Approve installs, network, and destructive ops; prefer reversible changes.
- Iteration: If validation fails, request minimal, tightly scoped diffs to fix.

## Workflow With CC
1) Provide Objective, Scope, Constraints, and Acceptance Criteria (see prompt templates).
2) Ask CC to propose a short plan and stop.
3) Approve plan or ask for edits; then request diffs preview and stop.
4) Approve apply; then request run/test instructions and a manual QA checklist; stop again.
5) Validate locally; if issues arise, ask CC for minimal targeted fixes.

## Files Here
- `prompt-template-day1-entity-foundation.md`: Ready-to-paste prompt for Day 1 gameplay foundation.
- `qa-checklist.md`: Quick pass criteria for build, gameplay, overlays, and regressions.
- `links.md`: Canonical URLs (with short descriptions).
- `raw/`: Offline HTML mirrors of core docs (optional; update as needed).

## Notes
- Prefer these summaries/templates during day-to-day iteration; open `raw/*.html` for deeper reference while offline.
- Update these docs as your workflow or constraints evolve.

