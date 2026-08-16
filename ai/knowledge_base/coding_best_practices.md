---
source_key: engineering-coding-best-practices
title: Coding Best Practices Playbook
category: coding
audience: backend engineers and delivery teams
---

# Coding Best Practices Playbook

## Start with a narrow, testable change
State the observable outcome before changing code. Identify the request boundary, inputs, outputs, authorization rules, failure modes, and acceptance criteria. Avoid unrelated refactors in the same change because they make review, rollback, and incident diagnosis harder.

Checklist: write a short implementation note; name affected modules; list success and failure paths; identify migration and rollout needs; decide how the result will be tested.

## Design module boundaries
Keep transport, business logic, persistence, and infrastructure concerns separate. Controllers and routes should validate and translate HTTP concerns. Services should own business rules. Repositories should contain parameterized SQL and mapping. Configuration should be read once and injected rather than scattered through application code.

Prefer small functions with explicit inputs and outputs. A function that combines authorization, database writes, retries, remote API calls, and response formatting is difficult to test and difficult to recover safely.

## Input validation and error contracts
Validate untrusted input at every system boundary: HTTP requests, webhooks, queue payloads, environment values, and imported files. Reject unknown or malformed values early. Return stable public error messages; log diagnostic details without passwords, tokens, or personal data.

Do not use string interpolation to construct SQL. Use parameterized statements, validate identifiers against allow-lists, and use least-privilege database accounts. Treat a client-provided identifier as data, not an authorization decision.

## Async and remote work
Set explicit timeouts for every remote call. Retry only transient, idempotent operations with bounded exponential backoff and jitter. Record a correlation identifier, preserve the original failure, and do not mark a workflow successful until its required durable write succeeds.

For parallel work, define the cancellation and partial-failure policy before implementation. Gather independent work concurrently, but protect shared state and make final status reflect all required work.

## Database changes
Use forward-only, ordered migrations. Migrations must be safe to re-run where possible and must avoid assumptions that break an existing populated database. Add constraints and indexes deliberately; test query plans for frequently used access paths.

For data changes, make the operation resumable and observable. Backfill in batches, deploy compatible application code before dropping old columns, and document a rollback that does not rely on irreversible data loss.

## API design
Use resource-oriented paths and predictable status codes. Validate ownership before reading or mutating a resource. Make write endpoints idempotent when clients, job runners, or webhooks may retry. Paginate list endpoints and enforce bounded request sizes.

Document request shape, response shape, errors, authorization, and side effects. Version deliberately when a compatibility break is unavoidable.

## Testing pyramid
Unit-test branching business rules, validation, mapping, retry policy, and prompt construction. Add repository integration tests against a real PostgreSQL instance for SQL, migrations, constraints, and vector search. Add a small number of end-to-end tests for critical user workflows.

Tests should be deterministic: freeze time when necessary, inject remote clients, avoid live provider calls, and assert outcomes rather than incidental implementation details. Every bug fix should include a regression test where practical.

## Observability and security
Emit structured logs with request or task identifiers, elapsed time, operation name, and safe status information. Track errors, queue lag, database latency, retrieval quality, and AI-provider failures. Alert on sustained symptoms, not isolated expected retries.

Keep secrets in environment or a secrets manager, never in source control, logs, exceptions, or client responses. Apply authorization checks server-side. Minimize data retained in AI prompts and store source attribution for generated recommendations.

## Code review and Git hygiene
Keep commits focused and explain why a non-obvious decision was made. Reviewers should check correctness, authorization, failure handling, test coverage, migration safety, logs, performance, and user-visible behavior. Require formatting and linting before merge.

Never overwrite unrelated working-tree changes. Resolve conflicts by understanding both intents. Prefer a reversible deployment and a clearly documented rollback path over a large untested release.
