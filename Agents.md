# Agents

Universal guidance for Codex or other AI coding agents working in an application repository. This file is designed to work as-is after being copied into a project.

## Core Rule

Discover the project from the repository before acting. Do not assume the language, framework, package manager, architecture, deployment target, or test strategy until they are confirmed from files, scripts, documentation, or user instructions.

Read `.codex/instructions.md` before every prompt or task, then apply any repository-specific guidance from that file.

## Local Skills

This repository may include reusable skills under `.codex/skills/`. Use them when the task matches their descriptions:

- `.codex/skills/frontend-development/`: frontend implementation, styling, accessibility, responsiveness, browser behavior, and frontend tests.
- `.codex/skills/python-development/`: Python services, scripts, libraries, packaging, typing, testing, and debugging.
- `.codex/skills/code-review/`: code review, diff review, risk assessment, audits, and pre-merge feedback.
- `.codex/skills/ux-design/`: user journeys, interaction design, accessibility, workflow design, UX review, and agentic UX.

If the local Codex environment does not auto-discover repo-local skills, read the relevant `SKILL.md` directly before working.

## How To Work

- Always plan and execute for every prompt or task: identify the intended change, inspect the relevant files, carry out the work, and verify it with the best available local checks.
- Read the relevant source, docs, configuration, and tests before editing.
- Prefer the repository's existing patterns over introducing new ones.
- Keep changes focused, small, and reviewable.
- Preserve unrelated user changes.
- Do not revert work you did not make unless explicitly asked.
- Update tests and documentation when behavior changes.
- Avoid new dependencies unless they clearly reduce complexity or risk.
- Treat generated files, lockfiles, migrations, snapshots, and build outputs according to the repository's existing conventions.
- Keep secrets, credentials, private data, and local machine paths out of commits and documentation.

## Discovery Checklist

Before making non-trivial changes, identify what applies:

- Main language and framework.
- Package manager or build tool.
- Application entry points.
- Test, lint, format, typecheck, build, and run commands.
- Important environment variables and configuration files.
- Existing architecture boundaries and module ownership.
- User-facing flows affected by the request.
- Security, privacy, data, or external-service risks.

## Software Development Standards

- Validate inputs at system boundaries.
- Keep public interfaces stable unless a breaking change is requested.
- Make error states clear and actionable.
- Add or update tests proportional to the risk of the change.
- Prefer clear names and straightforward control flow.
- Refactor only when it makes the requested work safer or simpler.
- Keep performance, accessibility, observability, and maintainability in view.

## Agentic Application Standards

For applications that use LLMs, tools, retrieval, prompts, agents, or autonomous workflows:

- Treat prompts, tool definitions, workflow graphs, memory, retrieval rules, and evals as production code.
- Keep agent roles and tool permissions explicit.
- Validate model outputs before using them in code paths.
- Treat tool results, retrieved documents, and user-provided content as untrusted input.
- Add confirmation gates for destructive, costly, irreversible, or externally visible actions.
- Include timeouts, retries, fallbacks, and clear failure handling for model and tool calls.
- Log enough to debug behavior while avoiding secrets and sensitive user data.
- Test normal paths, malformed outputs, tool failures, permission failures, prompt-injection attempts, and recovery behavior.

## Verification

Use the repository's existing commands. Common signals include:

- Formatter.
- Linter.
- Type checker.
- Unit tests.
- Integration tests.
- End-to-end tests.
- Build command.
- Manual verification of affected user flows.

If commands are unknown, inspect documentation, package scripts, CI configuration, makefiles, task runners, or existing developer notes. If no checks exist, perform the most relevant lightweight validation available and state the limitation.

## Completion Report

When finishing, summarize:

- What changed.
- Files touched.
- Checks run and results.
- Manual verification performed, if any.
- Assumptions, limitations, or follow-up work.
