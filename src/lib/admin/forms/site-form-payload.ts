import { getFormBoolean, getFormValue } from "./form-data";

export function buildSiteFormPayload(form: FormData, siteModels: unknown[]) {
  return {
    name: form.get("name"),
    url: form.get("url"),
    description: getFormValue(form, "description"),
    adminProfileUrl: getFormValue(form, "adminProfileUrl"),
    discussionUrl: getFormValue(form, "discussionUrl"),
    hasCheckIn: getFormBoolean(form, "hasCheckIn"),
    autoCheckIn: getFormBoolean(form, "autoCheckIn"),
    checkInUrl: getFormValue(form, "checkInUrl"),
    supportsClaudeCode: getFormBoolean(form, "supportsClaudeCode"),
    supportsCodex: getFormBoolean(form, "supportsCodex"),
    supportsImmersiveTranslation: getFormBoolean(form, "supportsImmersiveTranslation"),
    welfareUrl: getFormValue(form, "welfareUrl"),
    statusUrl: getFormValue(form, "statusUrl"),
    hasRateLimit: getFormBoolean(form, "hasRateLimit"),
    rateLimitInfo: getFormValue(form, "rateLimitInfo"),
    hasActivityRequirement: getFormBoolean(form, "hasActivityRequirement"),
    activityRequirementInfo: getFormValue(form, "activityRequirementInfo"),
    isActive: getFormBoolean(form, "isActive"),
    siteModels,
  };
}
