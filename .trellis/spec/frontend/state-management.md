# State Management

## Current Model

The application uses React local state and server-rendered data. There is no global state library.

## State Ownership

- Database-backed data is loaded in server pages or `src/server/` services and passed to components as typed props.
- Search queries, selected filters, dropdown visibility, and form editor state use local `useState`.
- Expensive derived lists use `useMemo`, as in `SiteDirectory`, `ModelOverview`, and `ResourceDirectory`.
- Controlled state is appropriate for domain editors such as site-model overrides and resource tags.
- Native form fields use `FormData` at submission time; pure serializers convert it to the API payload.

## Example

```tsx
const [selectedTags, setSelectedTags] = useState<string[]>([]);
const filtered = useMemo(
  () => filterResources(resources, { query, type, tags: selectedTags }),
  [query, resources, selectedTags, type],
);
```

## Rules

- Derive filtered data from source props and filter state; do not maintain a second mutable copy.
- Keep server records out of global browser state unless a future feature demonstrates a real cross-page need.
- Do not move isolated dropdown or form state into a shared store.
- When several action kinds update the same complex state, prefer one reducer over scattered branches.
