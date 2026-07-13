export type FormCheckboxField = {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
};

type FormCheckboxGroupProps = {
  fields: FormCheckboxField[];
  data?: Record<string, unknown>;
  columnsClassName?: string;
};

export function FormCheckboxGroup({
  fields,
  data = {},
  columnsClassName = "sm:grid-cols-2",
}: FormCheckboxGroupProps) {
  return (
    <div className={`grid gap-3 ${columnsClassName}`}>
      {fields.map((field) => (
        <label
          key={field.name}
          className="flex gap-3 rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.64)] p-3"
        >
          <input
            name={field.name}
            type="checkbox"
            defaultChecked={field.defaultChecked ?? Boolean(data[field.name])}
            className="mt-1 size-4 accent-[var(--primary)]"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--ink)]">{field.label}</span>
            {field.description && <span className="ld-helper mt-1 block">{field.description}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
