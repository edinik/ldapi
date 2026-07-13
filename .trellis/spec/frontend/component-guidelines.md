# Component Guidelines

## Component Boundaries

- Add `"use client"` only when the component uses hooks, browser APIs, or event-driven local state.
- Keep server data loading outside client components. Pass typed DTOs into interactive directory components.
- Define props close to the component unless the type is a cross-layer DTO owned by `src/lib` or `src/server`.

## Shared Form Primitives

Use the existing primitives for repeated form structure:

```tsx
import { FormSection } from "@/components/forms/FormSection";
import { FormTextField } from "@/components/forms/FormTextField";
import { FormSubmitBar } from "@/components/forms/FormSubmitBar";

<FormSection title="基础信息">
  <FormTextField name="name" label="名称" required defaultValue={data.name} />
</FormSection>
<FormSubmitBar saving={saving} idleLabel="保存" />
```

- Share a component when the same stable structure appears across domains.
- Keep domain-specific controls such as site pricing, model icon selection, and resource tag editing in their owning forms.
- Form components collect UI state; pure serializers in `src/lib/admin/forms/` own the API payload shape.

## Styling and Accessibility

- Use existing `ld-*` utility classes and CSS variables from `globals.css`.
- Associate labels and inputs with matching `htmlFor` / `id` values.
- Interactive non-submit controls must use `type="button"`.
- Combobox-like controls expose `role`, `aria-expanded`, `aria-controls`, and option selection state.
- Preserve existing responsive breakpoints when extracting shared components; use explicit variant props when layouts differ.

## Common Mistakes

- Hiding confirmation text, navigation targets, or soft/hard delete rules inside a generic component.
- Replacing a domain component with a large configuration DSL that is harder to understand than the original JSX.
- Changing field defaults while consolidating components; payload tests must lock these semantics first.
