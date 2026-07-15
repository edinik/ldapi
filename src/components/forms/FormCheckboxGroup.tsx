import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

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
    <div className={cn("grid gap-3", columnsClassName)}>
      {fields.map((field) => (
        <Field
          key={field.name}
          orientation="horizontal"
          className="items-start rounded-lg border border-border bg-card p-3"
        >
          <Checkbox
            id={field.name}
            name={field.name}
            value="on"
            defaultChecked={field.defaultChecked ?? Boolean(data[field.name])}
          />
          <FieldContent>
            <FieldLabel htmlFor={field.name} className="font-semibold">
              {field.label}
            </FieldLabel>
            {field.description && <FieldDescription>{field.description}</FieldDescription>}
          </FieldContent>
        </Field>
      ))}
    </div>
  );
}
