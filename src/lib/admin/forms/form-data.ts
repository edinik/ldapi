export function getFormBoolean(form: FormData, name: string) {
  return form.get(name) === "on";
}

export function getFormValue(form: FormData, name: string) {
  return form.get(name) || null;
}

export function getFormValues(form: FormData, name: string) {
  return form.getAll(name).map(String);
}
