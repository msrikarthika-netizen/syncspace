---
source_key: engineering-project-planning
title: Engineering Project Planning Guide
category: planning
audience: technical leads and project contributors
---

# Engineering Project Planning Guide

## Define the problem before the solution
Write a concise problem statement describing who is affected, what fails today, the desired outcome, and measurable success criteria. Separate facts, assumptions, constraints, and open questions. Explicitly name non-goals so the team can prevent scope creep.

Examples of measurable criteria include response latency, completion rate, reduced manual steps, a supported user flow, security requirements, or an acceptance test that demonstrates the outcome.

## Discovery and requirements
Identify users, owners, downstream systems, data classifications, operational constraints, and compatibility needs. Turn requirements into scenarios with preconditions, actions, expected results, and failure handling. Ask who authorizes the action, who sees its output, and what happens when a dependency is unavailable.

Document decisions in an architecture decision record when alternatives have material trade-offs. Include context, options, decision, consequences, and revisit conditions.

## Decompose work by deliverable
Break work into independently verifiable slices: schema and migration, core domain logic, API contract, user experience, integration, observability, documentation, and rollout. Each task should have an owner, dependency, clear done condition, and a small enough scope to review safely.

Sequence foundational work before dependent work. Run independent investigation, design, and implementation tasks in parallel only when their shared assumptions are explicit.

## Estimation and uncertainty
Estimate using ranges and state the uncertainty driver: unfamiliar system, external dependency, data migration, design decision, or performance risk. Do not disguise discovery work as a fixed implementation estimate. Time-box research spikes and convert the result into a decision or revised plan.

Maintain a risk register with likelihood, impact, early signal, owner, mitigation, and contingency. High-impact unknowns should be tested early, not deferred to final integration.

## Delivery milestones
A practical milestone sequence is: confirm requirements; prove the technical path; implement the smallest usable vertical slice; add validation and observability; test integration and failure paths; pilot behind a flag; release gradually; review outcomes.

Each milestone should have entry criteria, exit criteria, dependencies, and a demonstration. Avoid milestones defined only by activity, such as “work on API”; define them by an observable result, such as “authorized users can create and retrieve a validated task through the API.”

## Rollout and rollback
Use feature flags for behavior that may need rapid disablement. For database changes, deploy in compatible stages: add new structures, deploy readers/writers, backfill, verify, then remove obsolete paths in a later release. Define who can trigger rollback and which data changes are reversible.

Monitor leading indicators during rollout: error rate, latency, task completion, provider failures, retrieval relevance, and support reports. Stop or roll back when predefined guardrails are exceeded.

## Definition of done
Work is done when the acceptance criteria pass, authorization and validation are implemented, tests cover important paths, migration and rollback are understood, logs and metrics are usable, documentation is updated, and the release owner has verified the deployed behavior.

A plan is not complete merely because code compiles. Include operations, data lifecycle, user communication, and ownership after release.
