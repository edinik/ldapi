# Type Safety

## Boundary Normalization

External or form input starts as `unknown` / `FormData` and is normalized once at the owning boundary:

- API payload parsers: `src/lib/model-payload.ts`, `resource-payload.ts`, `site-model-payload.ts`
- Admin form serializers: `src/lib/admin/forms/*.ts`
- Database-to-view projections: `src/server/directory/projections.ts`

Consumers use the normalized result instead of repeating casts.

## Database Types

Use the shared Drizzle database type:

```ts
import type { AppDb } from "@/db/types";

export async function createResource(database: AppDb, data: ResourceWrite) {
  // ...
}
```

- Derive write and row types with `typeof table.$inferInsert` and `typeof table.$inferSelect`.
- Accept `AppDb` as a parameter in services so production uses `db` and tests use in-memory SQLite.
- Do not define duplicate `BetterSQLite3Database<typeof schema>` aliases in individual modules.

## DTO Contracts

- Client components receive explicit DTOs such as `SiteDirectoryItem`, `ModelDisplayItem`, and `DirectoryResource`.
- Projection functions own conversions such as stored strings to arrays, nullable overrides, and pricing labels.
- Pages must not cast raw query results directly to display types.

## Validation Cases

| Boundary | Base case | Invalid/empty case |
|---|---|---|
| Nullable string | trimmed non-empty string | `null` |
| Checkbox | `"on"` / boolean `true` | `false` |
| Numeric payload | finite number or numeric string | `null` |
| Stored tag/reasoning list | parsed normalized array | empty array |

## Avoid

- Avoid `any`; use `unknown` until the boundary normalizer has validated the value.
- Avoid `as unknown as` to force cross-layer compatibility.
- Avoid broad `Record<string, unknown>` after a typed parser or projection already exists.
