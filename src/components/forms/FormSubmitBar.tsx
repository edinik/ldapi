type FormSubmitBarProps = {
  saving: boolean;
  idleLabel: string;
  savingLabel?: string;
};

export function FormSubmitBar({ saving, idleLabel, savingLabel = "保存中..." }: FormSubmitBarProps) {
  return (
    <div className="sticky bottom-4 z-10 rounded-xl border border-[var(--hairline)] bg-[rgba(250,249,245,0.88)] p-3 shadow-[var(--shadow-soft)] backdrop-blur">
      <button type="submit" disabled={saving} className="ld-button-primary w-full">
        {saving ? savingLabel : idleLabel}
      </button>
    </div>
  );
}
