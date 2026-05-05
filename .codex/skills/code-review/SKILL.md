---
name: code-review
description: Review code, diffs, pull requests, or proposed changes for correctness, regressions, security, maintainability, missing tests, and operational risk. Use when the user asks for a review, audit, second opinion, risk assessment, or pre-merge feedback.
---

# Code Review

## Review Stance

Prioritize findings over summaries. Focus on bugs, regressions, security issues, data loss, broken user flows, missing tests, and maintainability risks.

## Workflow

1. Identify the change scope from the diff, files, tests, and request.
2. Understand relevant existing behavior before judging the change.
3. Look for concrete failure modes and user impact.
4. Check tests for meaningful coverage of changed behavior.
5. Report findings in severity order with file and line references where possible.

## Finding Criteria

Raise an issue when it is:

- A likely bug or regression.
- A security, privacy, data integrity, or authorization risk.
- A broken edge case or failure mode.
- A missing test for risky changed behavior.
- A maintainability issue that will likely cause defects.

Avoid blocking on style preferences unless they affect correctness, consistency, or long-term maintainability.

## Output Format

- Start with findings ordered by severity.
- Include file and line references when available.
- Explain impact and a concrete fix direction.
- Then list open questions or assumptions.
- End with a brief summary only after findings.

If no issues are found, say that clearly and mention residual risk or unrun checks.
