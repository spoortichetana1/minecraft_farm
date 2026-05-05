# Codex Directory

This directory contains reusable guidance for AI coding agents. It is intentionally generic and can be copied into any software repository without project-specific edits.

## Files

- `instructions.md`: default engineering and agentic-application instructions.
- `tasks.md`: generic task-tracking structure that works across projects.
- `config.toml`: generic operating preferences for repository discovery and verification.
- `skills/`: optional reusable Codex skills for common development workflows.

## Usage

Agents should use these files as standing guidance, then discover project-specific details from the repository itself:

- Source files.
- README and docs.
- Package or build configuration.
- CI workflows.
- Tests.
- Environment examples.
- Existing scripts and task runners.

Project-specific instructions may be added later, but these files should remain useful without edits.

## Included Skills

- `frontend-development`: frontend application development and verification.
- `python-development`: Python implementation, testing, packaging, and debugging.
- `code-review`: correctness, regression, security, and test coverage review.
- `ux-design`: product UX, workflow design, accessibility, and agentic UX.

## Maintenance

- Keep guidance broadly applicable.
- Avoid hard-coded project names, stack assumptions, or command placeholders.
- Prefer discovery rules over project-specific facts.
- Keep instructions concise enough for agents to read before working.
