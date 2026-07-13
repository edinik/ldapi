import type { ResourceType } from "@/lib/resource-payload";
import { getFormBoolean, getFormValue } from "./form-data";

type ResourceFormState = {
  type: ResourceType;
  tags: string[];
};

export function buildResourceFormPayload(form: FormData, state: ResourceFormState) {
  return {
    type: state.type,
    title: form.get("title"),
    description: getFormValue(form, "description"),
    tags: state.tags,
    githubUrl: getFormValue(form, "githubUrl"),
    officialUrl: getFormValue(form, "officialUrl"),
    demoUrl: getFormValue(form, "demoUrl"),
    linuxdoUrl: getFormValue(form, "linuxdoUrl"),
    recommendation: getFormValue(form, "recommendation"),
    isActive: getFormBoolean(form, "isActive"),
  };
}
