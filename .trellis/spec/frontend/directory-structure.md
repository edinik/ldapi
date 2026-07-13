# Directory Structure

## Layout

```text
src/
  app/                     Next.js pages and Route Handlers
  components/              Product components shared by pages
    forms/                 Stable, domain-neutral form primitives
  db/                      Drizzle schema, connection, and AppDb type
  lib/                     Pure domain helpers and client-side boundary utilities
    admin/forms/           FormData -> API payload serializers
  server/                  Server-only application services
    admin/                 Entity write services
    directory/             Homepage queries, projections, and DTOs
tests/                     Node test runner suites and shared test database helper
```

## Ownership Rules

- `src/app/**/page.tsx` composes data loading and rendering. It must not own large database-to-view transformations.
- `src/app/api/**/route.ts` owns HTTP concerns: authentication, request parsing, status codes, and response shape.
- `src/server/admin/*.ts` owns Drizzle write operations. Route Handlers call these services instead of embedding query chains.
- `src/server/directory/` owns homepage queries and database-record-to-DTO projections.
- `src/lib/**` contains pure normalization, formatting, filtering, and client transport helpers that do not require a server runtime.
- `src/components/forms/` is for primitives used by multiple domain forms. Domain editors remain with their owning form.

## Examples

- Thin page: `src/app/page.tsx` calls `getHomePageData()` and renders `HomeTabs`.
- Query boundary: `src/server/directory/get-home-directory-data.ts` owns active filters and sort order.
- Projection boundary: `src/server/directory/projections.ts` owns model, site, and resource DTO conversion.
- Write boundary: `src/server/admin/models.ts` owns model CRUD and import persistence.

## Avoid

- Do not create a generic CRUD repository when entity delete, relation, or validation behavior differs.
- Do not put database imports in client components.
- Do not duplicate untyped payload extraction across components or routes; give the contract one owner.
