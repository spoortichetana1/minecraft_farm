# Tasks

Generic task structure for software projects and agentic applications. This file works without customization; add project-specific tasks below as they become known.

## Active Work

- Review the user's latest request.
- Discover the relevant project context.
- Make the smallest coherent change.
- Verify with available checks.
- Report results and limitations.

## General Backlog

- Improve automated test coverage around critical behavior.
- Reduce duplicated or confusing logic in high-change areas.
- Improve error handling and observability.
- Keep setup, run, and deployment documentation current.
- Remove dead code and obsolete configuration.
- Review dependency health and security posture.
- Improve performance where evidence shows a bottleneck.

## Product And UX Backlog

- Clarify primary user journeys.
- Improve loading, empty, error, disabled, and permission states.
- Review accessibility and keyboard navigation.
- Validate responsive behavior across target devices.
- Improve user-facing copy and error messages.

## Backend And Operations Backlog

- Validate inputs and authorization at service boundaries.
- Improve logging, tracing, metrics, and alerting.
- Review retry, timeout, and idempotency behavior.
- Document environment variables and operational procedures.
- Review backup, restore, migration, and rollback paths where applicable.

## Agentic Application Backlog

- Document agent roles, allowed tools, and safety boundaries.
- Version prompts, tool schemas, and workflow definitions.
- Add structured output validation.
- Add tests for malformed model output and tool failure.
- Add evals for normal, edge, and adversarial tasks.
- Review prompt-injection defenses and data-exfiltration risks.
- Improve traceability of model decisions and tool calls without exposing sensitive data.

## Release Checklist

- Relevant tests pass.
- Build or packaging checks pass.
- Lint, format, and type checks pass when available.
- Documentation is updated for behavior changes.
- Security and privacy risks are reviewed for affected areas.
- Critical user flows are manually verified when appropriate.
- Rollback or recovery plan exists for risky changes.

## Notes

- Add project-specific notes only when they are stable and useful across future tasks.
