---
source_key: engineering-troubleshooting-guide
title: Backend Troubleshooting Guide
category: troubleshooting
audience: backend engineers and on-call responders
---

# Backend Troubleshooting Guide

## A disciplined debugging loop
First make the failure observable and reproducible. Capture the exact request, relevant identifiers, timestamp, expected result, actual result, and recent changes. Form one falsifiable hypothesis at a time, collect evidence, then change the smallest variable needed to test it.

Do not begin with a broad rewrite or random dependency upgrade. Preserve logs and error payloads before restarting services. A workaround can restore service, but still record root cause and the verification needed to close the incident.

## HTTP and API failures
For 4xx responses, inspect route matching, authentication, authorization, request schema, content type, and resource ownership. For 5xx responses, find the server-side exception using the request or task identifier, then identify the failing boundary: validation, business rule, query, queue, provider, or response serialization.

Verify timeout settings on both sides of every call. A client timeout can leave a server operation running, so writes must be idempotent or deduplicated by a request key.

## PostgreSQL diagnostics
Confirm the connection string, host, database, SSL requirements, credentials, and pool saturation. Check extension availability with `SELECT extname, extversion FROM pg_extension`. For query problems, use `EXPLAIN (ANALYZE, BUFFERS)` in a safe environment and inspect missing indexes, row estimates, locks, and sequential scans.

For migration failures, check migration history and transaction boundaries. Never manually mark a migration complete unless the database state has been verified. Repair forward with an explicit migration rather than editing an already-applied migration.

## pgvector retrieval issues
Ensure the installed extension is `vector`, the embedding column dimension matches the model output, and query embeddings use the same model and version as indexed chunks. Cosine search requires normalized embeddings for predictable scoring.

When results are irrelevant, inspect the raw retrieved chunks, scores, chunk boundaries, source metadata, and query text before changing prompts. Tune chunk size, overlap, threshold, and top-k using a fixed evaluation set. Re-index when the embedding model, corpus, or chunking logic changes.

## Docker and local service failures
Inspect container status, logs, exposed ports, network DNS names, mounted source directories, and environment values inside the container. `localhost` means the current container, not another Compose service; use the service name such as `postgres` or `backend` for internal traffic.

After changing an image or dependency file, rebuild the affected service. Persist database data in a named volume and avoid deleting volumes until backups and the exact target are confirmed.

## Environment and secrets problems
Confirm which `.env` file is loaded by each process and whether Docker Compose overrides it. Do not print complete connection strings or API keys. Validate required startup settings explicitly and fail fast with a remediation message when a secret or URL is missing.

Keep local, staging, and production configuration separate. A successful local request does not prove that a production network policy, DNS record, or provider credential is valid.

## AI provider failures
Classify failures as authentication, quota, rate limit, invalid request, timeout, unavailable model, malformed response, or content rejection. Retry only rate limits and transient network/provider errors. Set token budgets and parse structured provider output defensively.

If generation fails, persist an honest failed state and useful diagnostic summary. Do not emit a completed report with placeholder content as though it were trustworthy.

## Performance and incident response
Start with a baseline: request volume, latency percentile, error rate, resource usage, queue depth, and database activity. Identify the limiting resource before optimizing. Cache only data with a clear invalidation strategy and protect shared resources with limits.

During an incident, stabilize first: reduce load, disable a nonessential feature behind a flag, roll back a known bad release, or scale a proven dependency. Communicate impact, owner, mitigation, and next update time. Follow up with a timeline, root cause, corrective actions, and tests or monitors that prevent recurrence.
