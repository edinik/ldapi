# Frontend Development Guidelines

These guidelines describe the conventions currently used by the LDAPI Next.js application. They are implementation contracts for pages, client components, server modules, and tests.

## Guidelines Index

| Guide | Description |
|---|---|
| [Directory Structure](./directory-structure.md) | Ownership of pages, components, boundary helpers, and server modules |
| [Component Guidelines](./component-guidelines.md) | Component composition, shared form primitives, and accessibility |
| [Hook Guidelines](./hook-guidelines.md) | Small client hooks and separation from transport helpers |
| [State Management](./state-management.md) | Server data, local UI state, and derived state |
| [Quality Guidelines](./quality-guidelines.md) | Required commands and behavior-focused testing |
| [Type Safety](./type-safety.md) | Boundary normalization, DTO projections, and injectable database types |

## Pre-Development Checklist

- Read `directory-structure.md` before adding a new module or moving responsibilities.
- Read `component-guidelines.md` and `state-management.md` for React or form work.
- Read `hook-guidelines.md` before adding a custom hook or client request helper.
- Read `type-safety.md` for API payload, database, or DTO work.
- Read `quality-guidelines.md` before changing tests or validation commands.
- For changes crossing UI, API, service, and storage, also read `../guides/cross-layer-thinking-guide.md`.

## Quality Check

- Run `npm run check`, then run `npm run build` after the check has completed.
- Verify external UI, API, and database contracts remain unchanged for refactors.
- Search for direct database writes in Route Handlers and duplicated transport/form logic.
- Ensure new boundary functions have behavior tests.

**Language**: Project specification documents are written in English.
