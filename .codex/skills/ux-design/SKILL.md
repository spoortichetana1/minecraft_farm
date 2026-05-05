---
name: ux-design
description: Design, evaluate, or improve user experience for applications and agentic workflows. Use when working on information architecture, user journeys, interaction design, accessibility, content clarity, onboarding, error states, forms, dashboards, workflows, or product usability.
---

# UX Design

## Workflow

1. Identify the target user, primary goal, and context of use from the product or request.
2. Map the core user journey and decision points.
3. Design for the real workflow, including empty, loading, error, permission, and recovery states.
4. Reduce cognitive load and unnecessary choices.
5. Verify the experience against accessibility, responsiveness, and task-completion needs.

## Design Guidance

- Make primary actions obvious and secondary actions available without competing.
- Prefer clear labels over clever copy.
- Keep navigation predictable and state visible.
- Use progressive disclosure for complex flows.
- Design forms with validation, helpful errors, and safe defaults.
- Keep destructive actions deliberate and recoverable where possible.
- Match density and visual tone to the product domain.

## Agentic UX Guidance

- Show what the agent can do, what it is doing, and what it needs from the user.
- Require confirmation for destructive, costly, privileged, or externally visible actions.
- Make tool failures and model uncertainty understandable.
- Provide clear escape hatches, undo paths, and human handoff where appropriate.
- Avoid exposing raw internal reasoning or sensitive trace data.

## Verification

- Walk through the critical path from the user's perspective.
- Check keyboard access, focus order, labels, and readable contrast where applicable.
- Review mobile and desktop layouts.
- Validate that errors explain what happened and how to proceed.
