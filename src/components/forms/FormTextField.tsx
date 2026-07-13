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
    <div>
      <label htmlFor={name} className="ld-label">
        {label}
        {required && <span className="text-[var(--primary)]"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={getStringValue(defaultValue)}
        placeholder={placeholder}
        className="ld-input mt-2"
      />
      {helper && <p className="ld-helper mt-2">{helper}</p>}
    </div>
  );
}
