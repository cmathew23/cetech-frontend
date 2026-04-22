# DB_SAFETY_RULES.md

## Purpose

Protect all CETECH databases (development, test, and production-like environments) from unintended data loss or mutation during development, testing, or AI-assisted workflows.

This file defines **non-negotiable rules** that must be followed by all developers, tools, and AI agents (including Codex and Cursor).

---

## Core Principle

> **All databases are persistent and protected by default.**

No operation should modify database state unless it is:

1. Explicitly required
2. Clearly understood
3. Manually approved in the current session

---

## ABSOLUTE PROHIBITIONS

The following actions are **strictly forbidden** unless explicitly approved:

* Resetting the database
* Dropping schemas or tables
* Truncating tables
* Deleting records (bulk or targeted)
* Running seed scripts
* Running destructive migrations
* Overwriting or recreating demo/test users
* Running test scripts that mutate database state
* Executing any script that writes to `DATABASE_URL` or `DATABASE_URL_TEST`

---

## Forbidden Commands (Examples)

These must **never be executed without explicit approval**:

```bash
npx prisma migrate reset
npx prisma db push --force-reset
npx prisma db seed
```

```sql
DELETE FROM ...
TRUNCATE TABLE ...
DROP TABLE ...
DROP SCHEMA ...
```

Also includes:

* custom reset/bootstrap scripts
* test utilities that seed or wipe data
* any script with unclear DB impact

---

## DEFAULT OPERATING MODE

All contributors (human or AI) must operate in **DATA SAFETY MODE**:

* Assume all DBs are live and valuable
* Prefer **read-only investigation**
* Prefer **code fixes over data changes**
* Prefer **mocking/stubbing for tests**
* Do not rely on reseeding as a solution

---

## REQUIRED BEHAVIOR BEFORE ANY DB ACTION

Before running any command that could affect data:

1. Classify the command:

   * Read-only ✅
   * Mutating ❌
   * Unclear → treat as mutating ❌

2. If mutating or unclear:

   * DO NOT execute
   * Explain the risk
   * Ask for explicit approval

---

## AI AGENT RULES (CRITICAL)

All AI agents (Codex, Cursor, etc.) must:

* Never execute DB-mutating commands autonomously
* Never "fix" issues by altering DB data
* Never run seed/reset scripts during debugging
* Never assume test DB is safe to wipe
* Always ask before performing any data mutation

At the start of execution, AI agents must assume:

> **DATA SAFETY MODE ACTIVE**

---

## TESTING POLICY

* Tests must not mutate the runtime database (`DATABASE_URL`)
* Tests must isolate or mock DB interactions where possible
* If test data is required:

  * use controlled test DB (`DATABASE_URL_TEST`)
  * do not reset or wipe without approval
* Avoid shared-state dependency between tests

---

## DEMO / TEST USERS POLICY

* Demo users must be treated as persistent fixtures
* They must NOT be deleted, replaced, or overwritten
* If missing:

  * recreate via approved flow
  * do not mass reset DB

---

## ENVIRONMENT SAFETY

* Always verify active DB before running commands
* Confirm:

  * `DATABASE_URL`
  * `DATABASE_URL_TEST`
* Never assume environment is safe

---

## ENFORCEMENT

If any rule is violated:

* Stop execution immediately
* Do not attempt silent recovery
* Report the action and impact clearly

---

## SUMMARY

* No DB mutation without approval
* No reset, seed, or delete operations
* Always treat DB as critical asset
* Prefer investigation over destruction

---

## FINAL RULE

> **If you are not 100% sure a command is safe, DO NOT RUN IT.**
