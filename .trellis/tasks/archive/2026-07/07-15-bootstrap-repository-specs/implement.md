# Repository Spec Bootstrap Implementation Plan

## Execution Order

1. Reconfirm the task is active and load `trellis-before-dev` plus the current spec indexes.
2. Search task manifests and project files for references to the existing frontend spec filenames.
3. Refine the frontend guides:
   - keep source-backed directory, component, hook, state, and type guidance;
   - add `styling-and-accessibility.md` from current CSS/components;
   - move repository-wide test/quality material to the testing layer;
   - update `frontend/index.md` to the final file set.
4. Create the backend layer:
   - request/response versus service ownership;
   - database types, migrations, injected `AppDb`, and build-time SQLite behavior;
   - authentication, secrets, optional integrations, and configuration precedence.
5. Create the testing layer with Node test, pure-boundary, dependency-injection, fetch fake, and SQLite integration patterns.
6. Create the operations layer with standalone build, Docker bootstrap, environment, persistent data, and maintenance-script contracts.
7. Review the cross-cutting guides and edit only statements contradicted by this repository or the new layer map.
8. Run a convergence pass across all specs: remove duplication, verify evidence paths, and ensure indexes match files.
9. Verify all spec prose is Chinese while code identifiers, file paths, commands, environment variables, and contract field names remain unchanged.

## Validation Commands

```powershell
python ./.trellis/scripts/get_context.py --mode packages
rg -n "To be filled|TODO: fill|TBD|placeholder|template boilerplate" .trellis/spec
rg -n "frontend/quality-guidelines|quality-guidelines.md" .trellis .codex .agents
git diff --check
npm run check
npm run build
git status --short
```

Additionally, enumerate Markdown links in `.trellis/spec/**/index.md` and verify that every relative target exists. Compare every spec directory's actual Markdown files with its index entries.

## Review Gates

- No spec rule is accepted without a source, test, config, migration, project doc, or repeated local pattern.
- No product file may change.
- `npm run build` must run after `npm run check`, not concurrently with typecheck.
- Any compatibility stub for an old spec path must be justified by a live reference.
- Before task completion, re-read all indexes and the full diff rather than relying only on scans.

## Rollback Points

- After frontend refinement and before adding new layers.
- After backend/testing creation and before operations guidance.
- Before deleting or renaming any existing spec file referenced by task manifests.
