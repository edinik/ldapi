# Bootstrap Repository Coding Specs

## Goal

Refresh `.trellis/spec/` so future development sessions receive concise, source-backed guidance for every material LDAPI layer: frontend, backend, testing, and operations.

## Background

- LDAPI is a single-repository Next.js 16 / React 19 / TypeScript application with App Router pages, Route Handlers, server actions, Drizzle services, SQLite migrations, Node tests, and Docker deployment scripts.
- The completed `00-bootstrap-guidelines` task populated six useful frontend guides from the July 13 refactor.
- Those guides currently mix frontend, API, database, and test rules under one `frontend` layer. Trellis therefore reports only `frontend`, even though the repository has distinct server, test, and deployment ownership boundaries.
- GitNexus and ABCoder are not available in this session. Architecture findings are based on manifests, direct source reads, tests, task history, and Git history.

## Confirmed Facts

- `src/app/**/page.tsx` and `src/components/**` own server-rendered composition and interactive UI; reusable visual primitives live in `src/components/forms/` and design tokens/classes in `src/app/globals.css`.
- Route Handlers own HTTP authentication, parsing, status codes, and response shapes, while entity writes live in `src/server/admin/` with an injectable `AppDb`.
- Public-directory reads and record-to-DTO projection live in `src/server/directory/`; pure normalization and domain rules live in `src/lib/`.
- `src/db/schema.ts`, `drizzle/*.sql`, `src/db/index.ts`, and `tests/test-db.ts` form the database and migration contract.
- Authentication separates page redirects (`requireAdmin`) from API 401 responses (`requireAuth`); login orchestration is dependency-injected in `src/lib/auth-login.ts` for behavior testing.
- Optional external integrations use explicit configuration resolution and injected fetchers, as demonstrated by Turnstile and OpenAI-compatible model import helpers.
- Tests use `node:test` plus strict assertions. Pure functions use exact input/output tests; database services run against SQLite; source-text matching is explicitly rejected.
- Production uses Next standalone output, a multi-stage Docker image, a bind-mounted SQLite data directory, and an idempotent bootstrap migration/seed script.

## Requirements

- Preserve useful rules and evidence from the existing frontend specs; do not rewrite them into generic framework advice.
- Keep `frontend` focused on pages, components, client state, forms, styling, accessibility, and browser boundaries.
- Add a `backend` spec layer for Route Handlers/server actions, application services, database/migrations, authentication, configuration, and external integrations.
- Add a `testing` spec layer for Node test structure, pure-boundary tests, injectable dependencies, SQLite integration tests, and required quality commands.
- Add an `operations` spec layer for Docker/standalone builds, environment variables, SQLite persistence, bootstrap migrations, and maintenance scripts.
- Every important rule must cite real source, test, configuration, migration, or project documentation paths.
- Index files must list exactly the final spec files and give future sessions clear routing guidance.
- Remove duplicated cross-layer guidance when a more precise owner exists; replace it with links where appropriate.
- Do not modify product source, tests, migrations, runtime configuration, or deployment behavior.
- Do not introduce GitNexus, ABCoder, dependencies, generated indexes, or platform-specific agent instructions.
- Write all `.trellis/spec/` guidance in Chinese while preserving code identifiers, paths, commands, environment keys, and API/database contract names verbatim.

## Acceptance Criteria

- [x] `.trellis/spec/` contains navigable `frontend`, `backend`, `testing`, `operations`, and existing cross-cutting `guides` indexes.
- [x] Frontend guidance remains source-backed and accurately describes current App Router, component, form, state, type, styling, and accessibility patterns.
- [x] Backend guidance documents current HTTP/service/database/auth/configuration boundaries with concrete paths and anti-patterns.
- [x] Testing guidance documents the repository's actual Node test and SQLite integration patterns plus the sequential quality gate.
- [x] Operations guidance documents the current standalone Docker build, migration bootstrap, environment, persistence, and script constraints.
- [x] All important claims are backed by repository evidence; no placeholder prose, empty headings, or template boilerplate remains.
- [x] All relative links and every `index.md` entry resolve to the final file set.
- [x] Placeholder scans, link/index checks, `git diff --check`, and `npm run check` pass; `npm run build` runs after `npm run check` and passes.
- [x] Git diff contains only `.trellis/tasks/07-15-bootstrap-repository-specs/` and `.trellis/spec/` changes unless the user explicitly expands scope.
- [x] All `.trellis/spec/` prose is written in Chinese; technical identifiers remain unchanged.

## Out of Scope

- Product refactors, bug fixes, schema changes, migration generation, dependency upgrades, or deployment changes.
- Converting historical `docs/superpowers/` design and plan files into Trellis specs.
- Documenting aspirational architecture that is not demonstrated by current code or tests.
- Installing or configuring optional repository-analysis tooling.
