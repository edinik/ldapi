# Quality Guidelines

## Required Commands

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

`npm run check` runs typecheck, tests, and lint in order. Run `npm run build` after `check` completes; do not run the build concurrently with standalone typecheck because Next.js rebuilds `.next/types` and can cause transient missing generated modules.

## Testing Requirements

- New pure boundary function: add a direct unit test with exact input/output assertions.
- Database service: test with the in-memory SQLite helper in `tests/test-db.ts` and real migrations.
- Cross-layer refactor: test normalization, persistence/query behavior, and the final DTO.
- Authentication orchestration: inject fakes and assert authentication happens before data loading.
- Preserve existing external UI, API response, navigation, and database schema behavior during refactors.

## Forbidden Test Pattern

Do not read implementation source and match import order or code text:

```ts
// Wrong: breaks on harmless refactors
assert.match(readFileSync("route.ts", "utf8"), /specific source text/);

// Correct: invoke a policy/orchestrator and assert behavior
const result = await authenticateLogin(input, fakeDependencies);
assert.deepEqual(result, expected);
```

Reading migration SQL in `tests/test-db.ts` is allowed because migrations are the database contract, not an implementation-text assertion.

## Review Checklist

- No direct entity writes remain in Route Handlers when a service owns the entity.
- No duplicate form section, field, submission, or JSON transport implementation was reintroduced.
- No debug logging, `@ts-ignore`, or unexplained lint suppression was added.
- `git diff --check` passes.
- Existing lint warnings are identified separately from new errors.
