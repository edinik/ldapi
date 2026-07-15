import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type FormTextFieldProps = {
  name: string;
  label: string;
  type?: string;
  step?: string;
  required?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  helper?: string;
};

function getStringValue(value: unknown) {
  if (value == null) return "";
  return String(value);
}

export function FormTextField({
  name,
  label,
  type = "text",
  step,
  required = false,
  defaultValue,
  placeholder,
  helper,
}: FormTextFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={getStringValue(defaultValue)}
        placeholder={placeholder}
      />
      {helper && <FieldDescription>{helper}</FieldDescription>}
    </Field>
  );
}
