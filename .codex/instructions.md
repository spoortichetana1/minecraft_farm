# Codex Instructions

Generic instructions for AI-assisted software development and agentic application development. These instructions should work in any repository without customization.

## First Principles

- Discover before changing.
- Follow existing project conventions.
- Make the smallest coherent change that solves the request.
- Preserve unrelated work.
- Verify with the best available local checks.
- Explain assumptions and limitations clearly.

## Repository Discovery

Before substantial edits, inspect enough context to identify:

- Languages, frameworks, and runtimes.
- Package manager and dependency files.
- Application entry points.
- Test, lint, typecheck, format, build, and run commands.
- CI or release workflows.
- Important docs and architecture notes.
- Environment configuration patterns.
- Data stores, external services, and security-sensitive areas.

Prefer explicit repository evidence over guesses.

## General Engineering Guidance

- Keep code readable, idiomatic, and aligned with nearby code.
- Prefer simple functions and clear data flow.
- Avoid broad rewrites unless the request or code health requires them.
- Add abstractions only when they remove real duplication or clarify behavior.
- Keep public APIs and user-facing behavior stable unless the task requires a change.
- Update tests, docs, examples, schemas, migrations, and generated artifacts when appropriate.
- Do not introduce secrets, local-only paths, private data, or unnecessary dependencies.

## Frontend Guidance

- Preserve the existing design system, component model, and styling conventions.
- Implement real user workflows rather than placeholder screens.
- Cover loading, empty, error, disabled, permission, and success states when relevant.
- Keep layouts responsive and accessible.
- Use semantic markup and labeled controls where applicable.
- Check for clipped text, overlapping elements, and keyboard usability.

## Backend And API Guidance

- Validate inputs at boundaries.
- Enforce authorization and ownership checks.
- Return clear, stable errors.
- Keep side effects explicit and auditable.
- Consider idempotency for retries, jobs, webhooks, queues, and tool calls.
- Avoid logging secrets or sensitive payloads.
- Test validation, permissions, failure modes, and integration boundaries.

## Data And Migration Guidance

- Understand existing schema and migration conventions before editing data models.
- Keep migrations reversible when the framework supports it.
- Avoid destructive data changes without explicit user approval.
- Include backfill, rollout, and compatibility considerations for production data.
- Update fixtures, factories, seed data, and docs when models change.

## Agentic Application Guidance

Use this section when the project includes LLMs, assistants, agents, tool use, RAG, prompt chains, workflow orchestration, or autonomous actions.

- Treat prompts, tools, routing logic, memory, retrieval, evals, and safety policies as production code.
- Keep agent responsibilities narrow and explicit.
- Define allowed tools, tool inputs, tool outputs, and failure behavior.
- Prefer structured outputs when model responses drive program logic.
- Validate and sanitize model outputs, retrieved content, and tool results.
- Treat retrieved documents, web pages, emails, tickets, chat messages, and uploaded files as untrusted.
- Add defenses against prompt injection and data exfiltration.
- Require confirmation for destructive, costly, irreversible, privileged, or externally visible actions.
- Implement timeouts, retries, fallbacks, and graceful degradation.
- Add evaluation cases for happy paths, edge cases, adversarial inputs, malformed outputs, and tool failures.
- Keep logs and traces useful for debugging while protecting sensitive data.

## Testing And Verification

Use the repository's own commands when available. Look for them in docs, package scripts, CI workflows, makefiles, task files, or build configuration.

Common checks:

- Format.
- Lint.
- Typecheck.
- Unit tests.
- Integration tests.
- End-to-end tests.
- Build.
- Smoke test or local run.

If a check cannot be run, state why. If no automated checks exist, use syntax checks, static inspection, or manual verification appropriate to the stack.

## Documentation

Update documentation when changing:

- Setup or run behavior.
- User-visible features.
- Public APIs.
- Configuration or environment variables.
- Data models or migrations.
- Agent prompts, tools, permissions, workflows, or evaluation behavior.
- Deployment or operational procedures.
