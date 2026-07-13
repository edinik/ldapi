# Hook Guidelines

## Scope

Custom hooks are small and local. The project does not use a global client state or server-state library.

## Mutation Pattern

Separate the pure transport function from React pending state:

```ts
// Pure and directly testable
requestJson(url, { method: "POST", body });

// React lifecycle wrapper
const { pending, mutate } = useJsonMutation();
const response = await mutate("/api/models", "POST", payload);
```

- `requestJson` owns JSON headers and serialization.
- `useJsonMutation` owns the pending lifecycle and resets it in `finally`.
- The calling component owns the URL, method, confirmation prompt, success navigation, and entity-specific behavior.
- Use the pure transport helper directly for bodyless DELETE requests when submit pending state should not change.

## Naming

- Hooks start with `use` and live near the boundary they serve, for example `src/lib/admin/use-json-mutation.ts`.
- Pure helpers must not use a `use` prefix.

## Avoid

- Do not create one hook per entity when only URL and redirect differ.
- Do not put router navigation or confirmation dialogs into a generic transport hook.
- Do not catch and silently discard network errors inside the transport helper.
