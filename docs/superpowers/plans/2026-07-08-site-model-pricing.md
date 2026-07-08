# Site Model Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-site, per-model pricing settings and display concrete public directory prices for usage-based, per-request, free, and custom pricing modes.

**Architecture:** Pricing fields live on `site_models`, because prices vary by site-model relationship. A focused `src/lib/site-model-pricing.ts` module owns parsing, normalization, resolution, and formatting. API payload sync, the site form, and public directory mapping use that helper instead of duplicating pricing rules.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Drizzle ORM, SQLite, Node `node:test`, `tsx`, ESLint.

---

## File Structure

- Create `src/lib/site-model-pricing.ts`
  - Defines pricing mode/source types.
  - Normalizes payload values.
  - Resolves display-ready pricing labels from model defaults and site-model overrides.
- Create `tests/site-model-pricing.test.ts`
  - Covers numeric normalization, pricing payload parsing, and public price label resolution.
- Modify `src/db/schema.ts`
  - Adds pricing columns to `siteModels`.
- Create `drizzle/0004_site_model_pricing.sql`
  - Adds nullable pricing columns to existing `site_models`.
- Modify `drizzle/meta/_journal.json`
  - Registers migration `0004_site_model_pricing`.
- Modify `src/lib/site-model-payload.ts`
  - Adds pricing fields to `SiteModelPayload`.
  - Uses pricing helper normalization in `normalizeSiteModelPayload`.
  - Writes pricing fields in `syncSiteModels`.
- Modify `src/components/SiteForm.tsx`
  - Adds pricing state fields to each selected model.
  - Renders pricing controls inside selected model cards.
  - Includes pricing fields in submitted `siteModels`.
- Modify `src/components/SiteDirectory.tsx`
  - Adds `pricingLabels` to model capability display.
- Modify `src/app/page.tsx`
  - Resolves site-model prices while building `SiteDirectoryItem`.
- Optional modify `tests/site-model-capabilities.test.ts`
  - Only if shared test fixtures need type updates after pricing types are introduced.

## Task 1: Pricing Helper

**Files:**
- Create: `src/lib/site-model-pricing.ts`
- Test: `tests/site-model-pricing.test.ts`

- [ ] **Step 1: Write the failing pricing helper tests**

Create `tests/site-model-pricing.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatSiteModelPricing,
  normalizeSiteModelPricingPayload,
  parseNullablePrice,
  type ModelPricingDefaults,
  type SiteModelPricingSettings,
} from "../src/lib/site-model-pricing";

const modelDefaults: ModelPricingDefaults = {
  inputCostPerMTokens: 5,
  outputCostPerMTokens: 25,
  cacheReadCostPerMTokens: 0.5,
  cacheWriteCostPerMTokens: 6.25,
};

describe("site model pricing", () => {
  it("parses nullable price values from strings and numbers", () => {
    assert.equal(parseNullablePrice(" 1.25 "), 1.25);
    assert.equal(parseNullablePrice(2), 2);
    assert.equal(parseNullablePrice(""), null);
    assert.equal(parseNullablePrice("abc"), null);
    assert.equal(parseNullablePrice(Number.POSITIVE_INFINITY), null);
  });

  it("normalizes invalid payload fields to safe defaults", () => {
    assert.deepEqual(
      normalizeSiteModelPricingPayload({
        pricingMode: "unknown",
        usagePriceSource: "bad",
        priceMultiplier: "-2",
        inputCostPerMTokensOverride: "abc",
        pricingNotes: "   ",
      }),
      {
        pricingMode: "inherit",
        usagePriceSource: "model_default",
        priceMultiplier: 1,
        inputCostPerMTokensOverride: null,
        outputCostPerMTokensOverride: null,
        cacheReadCostPerMTokensOverride: null,
        cacheWriteCostPerMTokensOverride: null,
        perRequestCost: null,
        pricingNotes: null,
      },
    );
  });

  it("normalizes usage payloads with multiplier and manual override prices", () => {
    assert.deepEqual(
      normalizeSiteModelPricingPayload({
        pricingMode: "usage",
        usagePriceSource: "manual",
        priceMultiplier: "1.2",
        inputCostPerMTokensOverride: "4",
        outputCostPerMTokensOverride: 12,
        cacheReadCostPerMTokensOverride: "",
        cacheWriteCostPerMTokensOverride: "3.5",
        pricingNotes: "includes platform fee",
      }),
      {
        pricingMode: "usage",
        usagePriceSource: "manual",
        priceMultiplier: 1.2,
        inputCostPerMTokensOverride: 4,
        outputCostPerMTokensOverride: 12,
        cacheReadCostPerMTokensOverride: null,
        cacheWriteCostPerMTokensOverride: 3.5,
        perRequestCost: null,
        pricingNotes: "includes platform fee",
      },
    );
  });

  it("shows inherited model prices as concrete input and output labels", () => {
    const labels = formatSiteModelPricing(modelDefaults, {
      pricingMode: "inherit",
      usagePriceSource: "model_default",
      priceMultiplier: 1,
      inputCostPerMTokensOverride: null,
      outputCostPerMTokensOverride: null,
      cacheReadCostPerMTokensOverride: null,
      cacheWriteCostPerMTokensOverride: null,
      perRequestCost: null,
      pricingNotes: null,
    });

    assert.deepEqual(labels, [
      "输入 $5/M tokens",
      "输出 $25/M tokens",
      "缓存读 $0.5/M tokens",
      "缓存写 $6.25/M tokens",
    ]);
  });

  it("applies multiplier to model default usage prices", () => {
    const labels = formatSiteModelPricing(modelDefaults, {
      pricingMode: "usage",
      usagePriceSource: "model_default",
      priceMultiplier: 1.2,
      inputCostPerMTokensOverride: null,
      outputCostPerMTokensOverride: null,
      cacheReadCostPerMTokensOverride: null,
      cacheWriteCostPerMTokensOverride: null,
      perRequestCost: null,
      pricingNotes: null,
    });

    assert.deepEqual(labels, [
      "输入 $6/M tokens",
      "输出 $30/M tokens",
      "缓存读 $0.6/M tokens",
      "缓存写 $7.5/M tokens",
    ]);
  });

  it("applies multiplier to manual usage override prices", () => {
    const labels = formatSiteModelPricing(modelDefaults, {
      pricingMode: "usage",
      usagePriceSource: "manual",
      priceMultiplier: 2,
      inputCostPerMTokensOverride: 3,
      outputCostPerMTokensOverride: 9,
      cacheReadCostPerMTokensOverride: null,
      cacheWriteCostPerMTokensOverride: null,
      perRequestCost: null,
      pricingNotes: null,
    });

    assert.deepEqual(labels, ["输入 $6/M tokens", "输出 $18/M tokens"]);
  });

  it("shows missing price text when usage prices cannot resolve", () => {
    const emptyModel: ModelPricingDefaults = {
      inputCostPerMTokens: null,
      outputCostPerMTokens: null,
      cacheReadCostPerMTokens: null,
      cacheWriteCostPerMTokens: null,
    };
    const settings: SiteModelPricingSettings = {
      pricingMode: "usage",
      usagePriceSource: "model_default",
      priceMultiplier: 1,
      inputCostPerMTokensOverride: null,
      outputCostPerMTokensOverride: null,
      cacheReadCostPerMTokensOverride: null,
      cacheWriteCostPerMTokensOverride: null,
      perRequestCost: null,
      pricingNotes: null,
    };

    assert.deepEqual(formatSiteModelPricing(emptyModel, settings), ["价格未填写"]);
  });

  it("formats per-request, free, and custom pricing", () => {
    const base = {
      usagePriceSource: "model_default" as const,
      priceMultiplier: 1,
      inputCostPerMTokensOverride: null,
      outputCostPerMTokensOverride: null,
      cacheReadCostPerMTokensOverride: null,
      cacheWriteCostPerMTokensOverride: null,
    };

    assert.deepEqual(
      formatSiteModelPricing(modelDefaults, { ...base, pricingMode: "per_request", perRequestCost: 0.02, pricingNotes: null }),
      ["每次 $0.02"],
    );
    assert.deepEqual(
      formatSiteModelPricing(modelDefaults, { ...base, pricingMode: "free", perRequestCost: null, pricingNotes: null }),
      ["免费"],
    );
    assert.deepEqual(
      formatSiteModelPricing(modelDefaults, { ...base, pricingMode: "custom", perRequestCost: null, pricingNotes: "按套餐消耗额度" }),
      ["按套餐消耗额度"],
    );
  });
});
```

- [ ] **Step 2: Run the pricing helper test to verify it fails**

Run:

```bash
npx tsx --test tests/site-model-pricing.test.ts
```

Expected: FAIL because `src/lib/site-model-pricing.ts` does not exist.

- [ ] **Step 3: Add the minimal pricing helper implementation**

Create `src/lib/site-model-pricing.ts`:

```typescript
export const pricingModes = ["inherit", "usage", "per_request", "free", "custom"] as const;
export type PricingMode = (typeof pricingModes)[number];

export const usagePriceSources = ["model_default", "manual"] as const;
export type UsagePriceSource = (typeof usagePriceSources)[number];

export type SiteModelPricingSettings = {
  pricingMode: PricingMode;
  usagePriceSource: UsagePriceSource;
  priceMultiplier: number;
  inputCostPerMTokensOverride: number | null;
  outputCostPerMTokensOverride: number | null;
  cacheReadCostPerMTokensOverride: number | null;
  cacheWriteCostPerMTokensOverride: number | null;
  perRequestCost: number | null;
  pricingNotes: string | null;
};

export type ModelPricingDefaults = {
  inputCostPerMTokens: number | null;
  outputCostPerMTokens: number | null;
  cacheReadCostPerMTokens: number | null;
  cacheWriteCostPerMTokens: number | null;
};

function isPricingMode(value: unknown): value is PricingMode {
  return typeof value === "string" && pricingModes.includes(value as PricingMode);
}

function isUsagePriceSource(value: unknown): value is UsagePriceSource {
  return typeof value === "string" && usagePriceSources.includes(value as UsagePriceSource);
}

export function parseNullablePrice(value: unknown) {
  if (value === "" || value == null) return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parsePositiveMultiplier(value: unknown) {
  const parsed = parseNullablePrice(value);
  if (parsed == null || parsed <= 0) return 1;
  return parsed;
}

function parseNotes(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function normalizeSiteModelPricingPayload(value: Record<string, unknown>): SiteModelPricingSettings {
  return {
    pricingMode: isPricingMode(value.pricingMode) ? value.pricingMode : "inherit",
    usagePriceSource: isUsagePriceSource(value.usagePriceSource) ? value.usagePriceSource : "model_default",
    priceMultiplier: parsePositiveMultiplier(value.priceMultiplier),
    inputCostPerMTokensOverride: parseNullablePrice(value.inputCostPerMTokensOverride),
    outputCostPerMTokensOverride: parseNullablePrice(value.outputCostPerMTokensOverride),
    cacheReadCostPerMTokensOverride: parseNullablePrice(value.cacheReadCostPerMTokensOverride),
    cacheWriteCostPerMTokensOverride: parseNullablePrice(value.cacheWriteCostPerMTokensOverride),
    perRequestCost: parseNullablePrice(value.perRequestCost),
    pricingNotes: parseNotes(value.pricingNotes),
  };
}

export function normalizeStoredSiteModelPricing(value: Partial<SiteModelPricingSettings>): SiteModelPricingSettings {
  return normalizeSiteModelPricingPayload({
    pricingMode: value.pricingMode,
    usagePriceSource: value.usagePriceSource,
    priceMultiplier: value.priceMultiplier,
    inputCostPerMTokensOverride: value.inputCostPerMTokensOverride,
    outputCostPerMTokensOverride: value.outputCostPerMTokensOverride,
    cacheReadCostPerMTokensOverride: value.cacheReadCostPerMTokensOverride,
    cacheWriteCostPerMTokensOverride: value.cacheWriteCostPerMTokensOverride,
    perRequestCost: value.perRequestCost,
    pricingNotes: value.pricingNotes,
  });
}

function formatMoney(value: number) {
  return `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
}

function multiply(value: number | null, multiplier: number) {
  if (value == null) return null;
  return value * multiplier;
}

function usageLabels(source: ModelPricingDefaults, multiplier: number) {
  const labels = [
    ["输入", multiply(source.inputCostPerMTokens, multiplier)],
    ["输出", multiply(source.outputCostPerMTokens, multiplier)],
    ["缓存读", multiply(source.cacheReadCostPerMTokens, multiplier)],
    ["缓存写", multiply(source.cacheWriteCostPerMTokens, multiplier)],
  ] as const;

  const resolved = labels
    .filter((item): item is readonly [string, number] => item[1] != null)
    .map(([label, value]) => `${label} ${formatMoney(value)}/M tokens`);

  return resolved.length > 0 ? resolved : ["价格未填写"];
}

export function formatSiteModelPricing(
  model: ModelPricingDefaults,
  settings: SiteModelPricingSettings,
) {
  if (settings.pricingMode === "free") return ["免费"];
  if (settings.pricingMode === "custom") return settings.pricingNotes ? [settings.pricingNotes] : ["价格未填写"];
  if (settings.pricingMode === "per_request") {
    return settings.perRequestCost == null ? ["价格未填写"] : [`每次 ${formatMoney(settings.perRequestCost)}`];
  }

  const source =
    settings.pricingMode === "usage" && settings.usagePriceSource === "manual"
      ? {
          inputCostPerMTokens: settings.inputCostPerMTokensOverride,
          outputCostPerMTokens: settings.outputCostPerMTokensOverride,
          cacheReadCostPerMTokens: settings.cacheReadCostPerMTokensOverride,
          cacheWriteCostPerMTokens: settings.cacheWriteCostPerMTokensOverride,
        }
      : model;

  const multiplier = settings.pricingMode === "inherit" ? 1 : settings.priceMultiplier;
  return usageLabels(source, multiplier);
}
```

- [ ] **Step 4: Run the pricing helper test to verify it passes**

Run:

```bash
npx tsx --test tests/site-model-pricing.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/site-model-pricing.ts tests/site-model-pricing.test.ts
git commit -m "feat: add site model pricing helper"
```

## Task 2: Schema And Migration

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/0004_site_model_pricing.sql`
- Modify: `drizzle/meta/_journal.json`

- [ ] **Step 1: Write a failing schema assertion test**

Append this test to `tests/site-model-pricing.test.ts`:

```typescript
import { siteModels } from "../src/db/schema";

describe("site model pricing schema", () => {
  it("exposes pricing columns on the site_models schema", () => {
    assert.equal(siteModels.pricingMode.name, "pricing_mode");
    assert.equal(siteModels.usagePriceSource.name, "usage_price_source");
    assert.equal(siteModels.priceMultiplier.name, "price_multiplier");
    assert.equal(siteModels.inputCostPerMTokensOverride.name, "input_cost_per_m_tokens_override");
    assert.equal(siteModels.outputCostPerMTokensOverride.name, "output_cost_per_m_tokens_override");
    assert.equal(siteModels.cacheReadCostPerMTokensOverride.name, "cache_read_cost_per_m_tokens_override");
    assert.equal(siteModels.cacheWriteCostPerMTokensOverride.name, "cache_write_cost_per_m_tokens_override");
    assert.equal(siteModels.perRequestCost.name, "per_request_cost");
    assert.equal(siteModels.pricingNotes.name, "pricing_notes");
  });
});
```

- [ ] **Step 2: Run the schema assertion test to verify it fails**

Run:

```bash
npx tsx --test tests/site-model-pricing.test.ts
```

Expected: FAIL because `siteModels.pricingMode` is not defined.

- [ ] **Step 3: Add pricing columns to Drizzle schema**

In `src/db/schema.ts`, update the `siteModels` table:

```typescript
export const siteModels = sqliteTable("site_models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  modelId: integer("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
  supportsToolCallingOverride: integer("supports_tool_calling_override", { mode: "boolean" }),
  supportsVisionOverride: integer("supports_vision_override", { mode: "boolean" }),
  supportsTemperatureControlOverride: integer("supports_temperature_control_override", { mode: "boolean" }),
  supportsReasoningOverride: integer("supports_reasoning_override", { mode: "boolean" }),
  reasoningEffortLevelsOverride: text("reasoning_effort_levels_override"),
  supportsWebSearchOverride: integer("supports_web_search_override", { mode: "boolean" }),
  rating: text("rating"),
  pricingMode: text("pricing_mode"),
  usagePriceSource: text("usage_price_source"),
  priceMultiplier: real("price_multiplier"),
  inputCostPerMTokensOverride: real("input_cost_per_m_tokens_override"),
  outputCostPerMTokensOverride: real("output_cost_per_m_tokens_override"),
  cacheReadCostPerMTokensOverride: real("cache_read_cost_per_m_tokens_override"),
  cacheWriteCostPerMTokensOverride: real("cache_write_cost_per_m_tokens_override"),
  perRequestCost: real("per_request_cost"),
  pricingNotes: text("pricing_notes"),
});
```

- [ ] **Step 4: Add the SQLite migration**

Create `drizzle/0004_site_model_pricing.sql`:

```sql
ALTER TABLE `site_models` ADD `pricing_mode` text;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `usage_price_source` text;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `price_multiplier` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `input_cost_per_m_tokens_override` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `output_cost_per_m_tokens_override` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `cache_read_cost_per_m_tokens_override` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `cache_write_cost_per_m_tokens_override` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `per_request_cost` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `pricing_notes` text;
```

- [ ] **Step 5: Register the migration in the journal**

Append this entry to `drizzle/meta/_journal.json` after index `3`:

```json
{
  "idx": 4,
  "version": "6",
  "when": 1783520000000,
  "tag": "0004_site_model_pricing",
  "breakpoints": true
}
```

Keep valid JSON syntax by adding a comma after the previous entry.

- [ ] **Step 6: Run the schema assertion test to verify it passes**

Run:

```bash
npx tsx --test tests/site-model-pricing.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/db/schema.ts drizzle/0004_site_model_pricing.sql drizzle/meta/_journal.json tests/site-model-pricing.test.ts
git commit -m "feat: add site model pricing schema"
```

## Task 3: Payload Sync

**Files:**
- Modify: `src/lib/site-model-payload.ts`
- Test: `tests/site-model-pricing.test.ts`

- [ ] **Step 1: Write a failing payload integration test**

Append to `tests/site-model-pricing.test.ts`:

```typescript
import { getSiteModelPayloads } from "../src/lib/site-model-payload";

describe("site model pricing payloads", () => {
  it("includes normalized pricing fields when reading site model payloads", () => {
    assert.deepEqual(
      getSiteModelPayloads({
        siteModels: [
          {
            name: "Claude Opus",
            pricingMode: "usage",
            usagePriceSource: "manual",
            priceMultiplier: "1.5",
            inputCostPerMTokensOverride: "2",
            outputCostPerMTokensOverride: "8",
            cacheReadCostPerMTokensOverride: "",
            cacheWriteCostPerMTokensOverride: "1",
            perRequestCost: "0.05",
            pricingNotes: "  site markup ",
          },
        ],
      }),
      [
        {
          name: "Claude Opus",
          supportsToolCallingOverride: null,
          supportsVisionOverride: null,
          supportsTemperatureControlOverride: null,
          supportsReasoningOverride: null,
          reasoningEffortLevelsOverride: null,
          supportsWebSearchOverride: null,
          rating: null,
          pricingMode: "usage",
          usagePriceSource: "manual",
          priceMultiplier: 1.5,
          inputCostPerMTokensOverride: 2,
          outputCostPerMTokensOverride: 8,
          cacheReadCostPerMTokensOverride: null,
          cacheWriteCostPerMTokensOverride: 1,
          perRequestCost: 0.05,
          pricingNotes: "site markup",
        },
      ],
    );
  });
});
```

- [ ] **Step 2: Run the payload test to verify it fails**

Run:

```bash
npx tsx --test tests/site-model-pricing.test.ts
```

Expected: FAIL because `getSiteModelPayloads` does not include pricing fields.

- [ ] **Step 3: Extend `SiteModelPayload` and normalization**

In `src/lib/site-model-payload.ts`, import the pricing helper:

```typescript
import { normalizeSiteModelPricingPayload, type SiteModelPricingSettings } from "@/lib/site-model-pricing";
```

Update the type:

```typescript
export type SiteModelPayload = SiteModelPricingSettings & {
  name: string;
  supportsToolCallingOverride?: boolean | null;
  supportsVisionOverride?: boolean | null;
  supportsTemperatureControlOverride?: boolean | null;
  supportsReasoningOverride?: boolean | null;
  reasoningEffortLevelsOverride?: string[] | null;
  supportsWebSearchOverride?: boolean | null;
  rating?: string | null;
};
```

Inside `normalizeSiteModelPayload`, add:

```typescript
const pricing = normalizeSiteModelPricingPayload(record);
```

Return:

```typescript
return {
  name,
  supportsToolCallingOverride: nullableBoolean(record.supportsToolCallingOverride),
  supportsVisionOverride: nullableBoolean(record.supportsVisionOverride),
  supportsTemperatureControlOverride: nullableBoolean(record.supportsTemperatureControlOverride),
  supportsReasoningOverride: nullableBoolean(record.supportsReasoningOverride),
  reasoningEffortLevelsOverride: Array.isArray(record.reasoningEffortLevelsOverride) ? record.reasoningEffortLevelsOverride.map(String) : null,
  supportsWebSearchOverride: nullableBoolean(record.supportsWebSearchOverride),
  rating: typeof record.rating === "string" ? record.rating || null : null,
  ...pricing,
};
```

For the string payload branch, return normalized defaults:

```typescript
return name ? { name, ...normalizeSiteModelPricingPayload({}) } : null;
```

- [ ] **Step 4: Write pricing fields in `syncSiteModels`**

Add these fields to the `db.insert(siteModels).values({ ... })` object:

```typescript
pricingMode: payload.pricingMode,
usagePriceSource: payload.usagePriceSource,
priceMultiplier: payload.priceMultiplier,
inputCostPerMTokensOverride: payload.inputCostPerMTokensOverride,
outputCostPerMTokensOverride: payload.outputCostPerMTokensOverride,
cacheReadCostPerMTokensOverride: payload.cacheReadCostPerMTokensOverride,
cacheWriteCostPerMTokensOverride: payload.cacheWriteCostPerMTokensOverride,
perRequestCost: payload.perRequestCost,
pricingNotes: payload.pricingNotes,
```

- [ ] **Step 5: Run the payload test to verify it passes**

Run:

```bash
npx tsx --test tests/site-model-pricing.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/lib/site-model-payload.ts tests/site-model-pricing.test.ts
git commit -m "feat: sync site model pricing payloads"
```

## Task 4: Admin Site Form

**Files:**
- Modify: `src/components/SiteForm.tsx`

- [ ] **Step 1: Add pricing fields to the form item type**

Update imports:

```typescript
import {
  normalizeStoredSiteModelPricing,
  pricingModes,
  usagePriceSources,
  type PricingMode,
  type SiteModelPricingSettings,
  type UsagePriceSource,
} from "@/lib/site-model-pricing";
```

Update the type:

```typescript
type SiteModelFormItem = SiteModelPricingSettings & {
  name: string;
  supportsToolCallingOverride: boolean | null;
  supportsVisionOverride: boolean | null;
  supportsTemperatureControlOverride: boolean | null;
  supportsReasoningOverride: boolean | null;
  reasoningEffortLevelsOverride: ReasoningEffortLevel[] | null;
  supportsWebSearchOverride: boolean | null;
  rating: string | null;
};
```

- [ ] **Step 2: Add a default item factory**

Add near `normalizeOverride`:

```typescript
function createSiteModelFormItem(name: string): SiteModelFormItem {
  return {
    name,
    supportsToolCallingOverride: null,
    supportsVisionOverride: null,
    supportsTemperatureControlOverride: null,
    supportsReasoningOverride: null,
    reasoningEffortLevelsOverride: null,
    supportsWebSearchOverride: null,
    rating: null,
    ...normalizeStoredSiteModelPricing({}),
  };
}
```

Replace duplicate new item object literals in `getInitialSiteModels` fallback and `addModel` with `createSiteModelFormItem(name)`.

- [ ] **Step 3: Preserve pricing fields during edit initialization**

Inside the object returned from the `initialData.siteModels` mapper, spread stored pricing:

```typescript
return {
  name,
  supportsToolCallingOverride: normalizeOverride(record.supportsToolCallingOverride),
  supportsVisionOverride: normalizeOverride(record.supportsVisionOverride),
  supportsTemperatureControlOverride: normalizeOverride(record.supportsTemperatureControlOverride),
  supportsReasoningOverride: normalizeOverride(record.supportsReasoningOverride),
  reasoningEffortLevelsOverride: Array.isArray(record.reasoningEffortLevelsOverride)
    ? parseReasoningEffortLevels(record.reasoningEffortLevelsOverride.map(String))
    : typeof record.reasoningEffortLevelsOverride === "string"
      ? parseReasoningEffortLevels(record.reasoningEffortLevelsOverride)
      : null,
  supportsWebSearchOverride: normalizeOverride(record.supportsWebSearchOverride),
  rating: typeof record.rating === "string" ? record.rating || null : null,
  ...normalizeStoredSiteModelPricing({
    pricingMode: typeof record.pricingMode === "string" ? record.pricingMode as PricingMode : undefined,
    usagePriceSource: typeof record.usagePriceSource === "string" ? record.usagePriceSource as UsagePriceSource : undefined,
    priceMultiplier: typeof record.priceMultiplier === "number" ? record.priceMultiplier : undefined,
    inputCostPerMTokensOverride: typeof record.inputCostPerMTokensOverride === "number" ? record.inputCostPerMTokensOverride : null,
    outputCostPerMTokensOverride: typeof record.outputCostPerMTokensOverride === "number" ? record.outputCostPerMTokensOverride : null,
    cacheReadCostPerMTokensOverride: typeof record.cacheReadCostPerMTokensOverride === "number" ? record.cacheReadCostPerMTokensOverride : null,
    cacheWriteCostPerMTokensOverride: typeof record.cacheWriteCostPerMTokensOverride === "number" ? record.cacheWriteCostPerMTokensOverride : null,
    perRequestCost: typeof record.perRequestCost === "number" ? record.perRequestCost : null,
    pricingNotes: typeof record.pricingNotes === "string" ? record.pricingNotes : null,
  }),
};
```

- [ ] **Step 4: Add reusable number input and pricing editor helpers**

Add below `MiniSelect`:

```typescript
function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="ld-filter-label">{label}</span>
      <input
        type="number"
        step="any"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? null : Number(next));
        }}
        className="ld-input mt-2"
      />
    </label>
  );
}
```

Add pricing option constants:

```typescript
const pricingModeOptions = [
  { value: "inherit", label: "继承模型默认价" },
  { value: "usage", label: "按量计费" },
  { value: "per_request", label: "按次计费" },
  { value: "free", label: "免费" },
  { value: "custom", label: "自定义说明" },
];

const usagePriceSourceOptions = [
  { value: "model_default", label: "使用模型默认价格" },
  { value: "manual", label: "手动填写价格" },
];
```

- [ ] **Step 5: Add the `PricingEditor` component**

Add below `ReasoningEffortOverride`:

```typescript
function PricingEditor({
  item,
  onChange,
}: {
  item: SiteModelFormItem;
  onChange: <K extends keyof Omit<SiteModelFormItem, "name">>(key: K, value: SiteModelFormItem[K]) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.58)] p-3">
      <p className="text-sm font-semibold text-[var(--ink)]">价格</p>
      <p className="ld-helper mt-1">公开目录会显示最终输入/输出价或每次价格。</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MiniSelect
          label="计费模式"
          value={item.pricingMode}
          options={pricingModeOptions}
          onChange={(value) => onChange("pricingMode", value as PricingMode)}
        />
        {item.pricingMode === "usage" && (
          <>
            <MiniSelect
              label="价格来源"
              value={item.usagePriceSource}
              options={usagePriceSourceOptions}
              onChange={(value) => onChange("usagePriceSource", value as UsagePriceSource)}
            />
            <NumberInput
              label="倍率"
              value={item.priceMultiplier}
              placeholder="1"
              onChange={(value) => onChange("priceMultiplier", value ?? 1)}
            />
          </>
        )}
        {item.pricingMode === "per_request" && (
          <NumberInput
            label="每次价格"
            value={item.perRequestCost}
            placeholder="0.02"
            onChange={(value) => onChange("perRequestCost", value)}
          />
        )}
      </div>

      {item.pricingMode === "usage" && item.usagePriceSource === "manual" && (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <NumberInput label="输入 $/M tokens" value={item.inputCostPerMTokensOverride} onChange={(value) => onChange("inputCostPerMTokensOverride", value)} />
          <NumberInput label="输出 $/M tokens" value={item.outputCostPerMTokensOverride} onChange={(value) => onChange("outputCostPerMTokensOverride", value)} />
          <NumberInput label="缓存读 $/M tokens" value={item.cacheReadCostPerMTokensOverride} onChange={(value) => onChange("cacheReadCostPerMTokensOverride", value)} />
          <NumberInput label="缓存写 $/M tokens" value={item.cacheWriteCostPerMTokensOverride} onChange={(value) => onChange("cacheWriteCostPerMTokensOverride", value)} />
        </div>
      )}

      {item.pricingMode === "custom" && (
        <label className="mt-3 block">
          <span className="ld-filter-label">价格说明</span>
          <textarea
            value={item.pricingNotes ?? ""}
            rows={3}
            onChange={(event) => onChange("pricingNotes", event.target.value || null)}
            className="ld-input mt-2 min-h-20 resize-y"
          />
        </label>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Render pricing editor in each selected model card**

In the selected model card, below `ReasoningEffortOverride`, add:

```tsx
<div className="mt-3">
  <PricingEditor
    item={item}
    onChange={(key, value) => updateModelOverride(item.name, key, value)}
  />
</div>
```

- [ ] **Step 7: Run TypeScript and lint checks for the form**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit Task 4**

```bash
git add src/components/SiteForm.tsx
git commit -m "feat: add site model pricing form controls"
```

## Task 5: Public Directory Pricing Display

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/SiteDirectory.tsx`
- Test: `tests/site-model-pricing.test.ts`

- [ ] **Step 1: Write a failing directory mapping helper test**

Append to `tests/site-model-pricing.test.ts`:

```typescript
describe("site model directory pricing labels", () => {
  it("builds labels that can be displayed by the public directory", () => {
    const settings = normalizeSiteModelPricingPayload({
      pricingMode: "usage",
      usagePriceSource: "model_default",
      priceMultiplier: "1.1",
    });

    assert.deepEqual(formatSiteModelPricing(modelDefaults, settings), [
      "输入 $5.5/M tokens",
      "输出 $27.5/M tokens",
      "缓存读 $0.55/M tokens",
      "缓存写 $6.875/M tokens",
    ]);
  });
});
```

- [ ] **Step 2: Run the directory pricing test**

Run:

```bash
npx tsx --test tests/site-model-pricing.test.ts
```

Expected: PASS if Task 1 helper already covers this behavior. If it fails due to formatting, adjust `formatMoney` only until all pricing helper tests pass.

- [ ] **Step 3: Add `pricingLabels` to the directory type**

In `src/components/SiteDirectory.tsx`, update the `modelCapabilities` type:

```typescript
modelCapabilities: {
  name: string;
  capabilities: string[];
  rating: string | null;
  pricingLabels: string[];
}[];
```

- [ ] **Step 4: Render pricing labels in public model cards**

Inside each `site.modelCapabilities.map`, after the capability badge block, add:

```tsx
<div className="mt-2 flex flex-wrap gap-1.5">
  {model.pricingLabels.map((price) => (
    <span key={price} className="ld-badge bg-[rgba(250,249,245,0.7)]">
      {price}
    </span>
  ))}
</div>
```

Keep the existing `未标注` behavior tied only to capabilities/rating. Pricing labels should always render at least one item from the helper.

- [ ] **Step 5: Resolve pricing in `HomePage`**

In `src/app/page.tsx`, import:

```typescript
import { formatSiteModelPricing, normalizeStoredSiteModelPricing } from "@/lib/site-model-pricing";
```

Inside the `site.siteModels.map((sm) => { ... })` block, create pricing labels:

```typescript
const pricingLabels = formatSiteModelPricing(
  {
    inputCostPerMTokens: sm.model.inputCostPerMTokens,
    outputCostPerMTokens: sm.model.outputCostPerMTokens,
    cacheReadCostPerMTokens: sm.model.cacheReadCostPerMTokens,
    cacheWriteCostPerMTokens: sm.model.cacheWriteCostPerMTokens,
  },
  normalizeStoredSiteModelPricing({
    pricingMode: sm.pricingMode,
    usagePriceSource: sm.usagePriceSource,
    priceMultiplier: sm.priceMultiplier,
    inputCostPerMTokensOverride: sm.inputCostPerMTokensOverride,
    outputCostPerMTokensOverride: sm.outputCostPerMTokensOverride,
    cacheReadCostPerMTokensOverride: sm.cacheReadCostPerMTokensOverride,
    cacheWriteCostPerMTokensOverride: sm.cacheWriteCostPerMTokensOverride,
    perRequestCost: sm.perRequestCost,
    pricingNotes: sm.pricingNotes,
  }),
);
```

Return:

```typescript
return { name: sm.model.name, capabilities: labels, rating: sm.rating ?? null, pricingLabels };
```

- [ ] **Step 6: Run tests and type checks**

Run:

```bash
npx tsx --test tests/site-model-pricing.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit Task 5**

```bash
git add src/app/page.tsx src/components/SiteDirectory.tsx tests/site-model-pricing.test.ts
git commit -m "feat: show site model pricing in directory"
```

## Task 6: Final Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run the focused pricing test**

Run:

```bash
npx tsx --test tests/site-model-pricing.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run related existing tests**

Run:

```bash
npx tsx --test tests/site-model-capabilities.test.ts tests/site-model-options.test.ts tests/model-display.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: exits 0.

- [ ] **Step 5: Run production build**

Run:

```bash
npm run build
```

Expected: build exits 0.

- [ ] **Step 6: Inspect git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: no unintended files. If uncommitted implementation files remain, commit them with a focused message.

