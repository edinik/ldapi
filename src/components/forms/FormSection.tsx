import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  muted?: boolean;
  children: ReactNode;
};

export function FormSection({ title, description, muted = false, children }: FormSectionProps) {
  return (
    <fieldset className={muted ? "ld-card-light p-5 opacity-70" : "ld-card-light p-5"}>
      <legend className="px-1 text-lg font-semibold text-[var(--ink)]">{title}</legend>
      {description && <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </fieldset>
  );
}
