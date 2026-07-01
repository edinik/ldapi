import { db } from "@/db";
import { type SiteDirectoryItem } from "@/components/SiteDirectory";
import { HomeTabs } from "@/components/HomeTabs";
import { getHomepageModels, type ModelDisplayItem } from "@/lib/model-display";
import { getSiteModelCapabilityLabels, parseReasoningEffortLevels, resolveSiteModelCapabilities } from "@/lib/site-model-capabilities";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allSites = await db.query.sites.findMany({
    where: (sites, { eq }) => eq(sites.isActive, true),
    with: {
      siteModels: {
        with: { model: true },
      },
    },
    orderBy: (sites, { desc }) => [desc(sites.createdAt)],
  });
  const allModels = await db.query.models.findMany({
    orderBy: (models, { asc }) => [asc(models.developer), asc(models.name)],
  });
  const modelList = allModels.map((model) => ({
    ...model,
    reasoningEffortLevels: parseReasoningEffortLevels(model.reasoningEffortLevels),
  })) as ModelDisplayItem[];

  const siteList: SiteDirectoryItem[] = allSites.map((site) => {
    const modelCapabilities = site.siteModels.map((sm) => {
      const capabilities = resolveSiteModelCapabilities(
        { ...sm.model, reasoningEffortLevels: parseReasoningEffortLevels(sm.model.reasoningEffortLevels) },
        { ...sm, reasoningEffortLevelsOverride: sm.reasoningEffortLevelsOverride == null ? null : parseReasoningEffortLevels(sm.reasoningEffortLevelsOverride) },
      );
      const labels = getSiteModelCapabilityLabels(capabilities);

      return { name: sm.model.name, capabilities: labels, rating: sm.rating ?? null };
    });

    return {
      id: site.id,
      name: site.name,
      url: site.url,
      description: site.description,
      adminProfileUrl: site.adminProfileUrl,
      discussionUrl: site.discussionUrl,
      hasCheckIn: site.hasCheckIn,
      autoCheckIn: site.autoCheckIn,
      checkInUrl: site.checkInUrl,
      supportsClaudeCode: site.supportsClaudeCode,
      supportsCodex: site.supportsCodex,
      supportsImmersiveTranslation: site.supportsImmersiveTranslation,
      welfareUrl: site.welfareUrl,
      statusUrl: site.statusUrl,
      hasRateLimit: site.hasRateLimit,
      rateLimitInfo: site.rateLimitInfo,
      hasActivityRequirement: site.hasActivityRequirement,
      activityRequirementInfo: site.activityRequirementInfo,
      models: modelCapabilities.map((model) => model.name),
      modelCapabilities,
    };
  });

  const homepageModels = getHomepageModels(modelList);

  return (
    <div className="ld-page">
      <header className="border-b border-[var(--hairline)] bg-[rgba(250,249,245,0.86)] backdrop-blur">
        <div className="ld-container flex h-16 items-center justify-between">
          <Link href="/" className="ld-focus-ring flex items-center gap-3 rounded-md">
            <span className="grid size-8 place-items-center rounded-full bg-[var(--ink)] text-sm font-semibold text-[var(--on-dark)]">
              L
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">LDAPI</p>
              <p className="text-xs text-[var(--muted)]">AI 公益站导航</p>
            </div>
          </Link>
          <Link href="/login" className="ld-button-secondary">
            管理入口
          </Link>
        </div>
      </header>

      <main className="ld-container py-10 lg:py-14">
          <HomeTabs sites={siteList} models={homepageModels} />
      </main>
    </div>
  );
}
