---
name: python-development
description: Build, refactor, debug, test, or review Python application code. Use when working on Python services, CLIs, scripts, libraries, data workflows, async code, packaging, typing, testing, dependency management, or Python performance.
---

# Python Development

## Workflow

1. Discover the Python version, package manager, environment files, and test framework.
2. Follow existing module layout, naming, typing, error-handling, and dependency patterns.
3. Keep changes scoped and idiomatic.
4. Add or update tests for changed behavior.
5. Run the most relevant local checks.

## Implementation Guidance

- Prefer standard-library features unless an existing dependency is clearly appropriate.
- Keep functions small, named clearly, and easy to test.
- Use type hints consistently with the surrounding codebase.
- Validate inputs at boundaries and raise actionable errors.
- Preserve public APIs unless a breaking change is requested.
- Avoid import-time side effects when code may be used as a library.
- Keep scripts safe for repeated execution and clear about file-system effects.

## Verification

- Look for commands in docs, `pyproject.toml`, `setup.cfg`, `tox.ini`, `noxfile.py`, `Makefile`, task files, or CI.
- Prefer existing checks such as formatter, linter, type checker, unit tests, integration tests, and package build.
- If no test framework exists, run syntax/import checks and explain the limitation.
