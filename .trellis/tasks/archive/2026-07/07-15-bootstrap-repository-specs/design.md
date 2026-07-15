# Repository Spec Bootstrap Design

## Design Goals

- Make spec loading precise enough that frontend, backend, test, and deployment work receive the right local contracts.
- Keep the file set small enough to scan before development.
- Separate ownership boundaries without pretending the single Next.js application is a monorepo.
- Preserve the July 13 frontend guidance while moving cross-layer rules to clearer owners.

## Target Spec Map

```text
.trellis/spec/
  frontend/
    index.md
    directory-structure.md
    component-guidelines.md
    hook-guidelines.md
    state-management.md
    styling-and-accessibility.md
    type-safety.md
  backend/
    index.md
    request-and-service-boundaries.md
    database-and-migrations.md
    authentication-and-integrations.md
  testing/
    index.md
    test-patterns.md
  operations/
    index.md
    deployment-and-scripts.md
  guides/
    index.md
    code-reuse-thinking-guide.md
    cross-layer-thinking-guide.md
```

`frontend/quality-guidelines.md` will be replaced by the repository-wide testing guide. Frontend-specific review checks will remain in the frontend index or relevant topic guide. The existing generic thinking guides remain because they already contain project-relevant boundary and review triggers.

## Evidence Routing

### Frontend

- Structure and server/client composition: `src/app/page.tsx`, `src/app/admin/**/page.tsx`, `src/components/HomeTabs.tsx`.
- Shared versus domain UI: `src/components/forms/*.tsx`, `SiteForm.tsx`, `ModelForm.tsx`, `ResourceForm.tsx`.
- Client state and transport: directory components, `src/lib/admin/use-json-mutation.ts`, `src/lib/admin/json-mutation.ts`.
- Styling/accessibility: `src/app/globals.css`, `FilterSelect.tsx`, form primitives, `src/app/layout.tsx`.
- Type boundaries: form serializers, display DTOs, projections, and payload parsers.

### Backend

- Request boundaries: `src/app/api/**/route.ts`, `src/app/admin/security/actions.ts`.
- Service boundaries: `src/server/admin/*.ts`, `src/server/directory/*.ts`.
- Database contract: `src/db/*.ts`, `drizzle/*.sql`, `tests/test-db.ts`.
- Authentication/security: `src/lib/session.ts`, `auth*.ts`, `password.ts`, `totp.ts`, `turnstile.ts`.
- Integrations/configuration: `ai-settings*.ts`, `model-import-ai.ts`, model import Route Handlers.

### Testing

- Pure normalization/projection tests: payload, display, filter, pricing, TOTP, and AI settings suites.
- Dependency-injected orchestration tests: login, logout, page auth, and fetch-based integrations.
- SQLite service tests: `tests/admin-services.test.ts`, `directory-data.test.ts`, `test-db.ts`.
- Commands: `package.json`, `eslint.config.mjs`, and the existing frontend quality guide's sequential-build warning.

### Operations

- `next.config.ts`, `Dockerfile`, `docker-compose.yml`, `.env.example`.
- `scripts/docker-entrypoint.sh`, `scripts/docker-bootstrap.mjs`, `scripts/seed.ts`, `scripts/reset-password.ts`.
- `README.md`, `docs/DEPLOYMENT.md`, and `docs/TURNSTILE.md`, using source/config as authority when prose is stale.

## Content Rules

- Each guide explains when it applies, the current local pattern, evidence paths, common mistakes, and reliable verification steps.
- Short code snippets are used only for stable contracts such as injectable `AppDb` or route/service separation.
- A single implementation is not promoted to a universal rule unless supported by tests, design history, or repeated use.
- Known inconsistencies are described as current constraints only when future edits could otherwise break behavior; they are not silently normalized in documentation.
- Relative links are used for navigation within `.trellis/spec/`; repository paths remain plain code paths so they are stable across worktrees.
- Spec prose is written in Chinese. File names and technical identifiers remain unchanged to preserve stable references and searchable contracts.

## Compatibility and Risks

- Moving quality guidance can break task manifests that reference `frontend/quality-guidelines.md`. Before deleting it, search active and archived task manifests. If durable references exist outside archives, keep a short compatibility guide that points to `testing/test-patterns.md`.
- Operations documentation contains historical statements that may differ from current source. The Dockerfile, Compose file, entrypoint, and scripts take precedence.
- Splitting layers can duplicate type-boundary rules. The frontend guide owns browser/form/DTO consumption; backend owns request/database normalization; testing owns verification.
- Existing specs were committed as useful project knowledge. Edits should be incremental and traceable, not a wholesale style rewrite.

## Rollback

- The work is documentation-only. Reverting the spec commit restores the previous six-file frontend layout.
- No runtime, database, migration, or deployment rollback is required.
