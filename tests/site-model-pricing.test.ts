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
