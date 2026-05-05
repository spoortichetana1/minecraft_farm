---
name: frontend-development
description: Build, refactor, debug, or review frontend application code across web UI stacks. Use when working on components, pages, routing, state, styling, accessibility, responsiveness, browser behavior, client-side performance, design systems, or frontend tests.
---

# Frontend Development

## Workflow

1. Discover the stack from repository files before editing.
2. Identify the existing component, styling, state, routing, and test patterns.
3. Build the actual user-facing workflow, not placeholder UI.
4. Preserve established design-system conventions.
5. Verify responsive behavior, accessibility basics, and affected interactions.

## Implementation Guidance

- Keep UI state explicit: loading, empty, error, disabled, permission, and success states.
- Prefer semantic HTML and labeled controls.
- Use existing components, hooks, utilities, tokens, and icons before adding new ones.
- Keep layout stable across common viewport sizes.
- Avoid clipped text, overlapping controls, and content that shifts unexpectedly.
- Keep user-facing copy concise and action-oriented.
- Add or update component, unit, integration, or end-to-end tests based on risk.

## Verification

- Run the repository's frontend checks when available: format, lint, typecheck, tests, and build.
- Manually test changed flows in a browser when UI behavior changes.
- Inspect mobile and desktop widths for layout problems.
- Check keyboard navigation and visible focus for interactive controls.
