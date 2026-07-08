# Site Model Pricing Design

## Context

LDAPI currently stores official/default model prices on `models` and stores site-model relationships in `site_models`. The relationship table already supports per-site capability overrides and a rating, but it cannot describe that one site charges differently for the same model than another site.

The new pricing behavior belongs on `site_models`, because pricing is specific to a site and model pair.

## Goals

- Allow each site-model pair to define its own pricing.
- Support usage-based prices, per-request prices, free models, and custom textual pricing.
- Let usage-based prices inherit model default prices and apply a multiplier, so site pricing can follow global model price updates.
- Let usage-based prices override input/output/cache prices manually when a site differs from the official price.
- Show concrete public directory prices for every structured mode: input/output prices for usage pricing, per-request price for per-request pricing, and free label for free pricing.
- Preserve existing site model capability override and rating behavior.

## Non-Goals

- No billing enforcement or user metering.
- No currency conversion.
- No sorting or filtering by price in this iteration.
- No historical price tracking.
- No automatic fetching of official prices.

## Data Model

Add these nullable fields to `site_models`:

- `pricing_mode`: `inherit`, `usage`, `per_request`, `free`, or `custom`.
- `usage_price_source`: `model_default` or `manual`.
- `price_multiplier`: numeric multiplier, defaulting to `1` in application logic.
- `input_cost_per_m_tokens_override`: manual usage input price.
- `output_cost_per_m_tokens_override`: manual usage output price.
- `cache_read_cost_per_m_tokens_override`: manual cache read price.
- `cache_write_cost_per_m_tokens_override`: manual cache write price.
- `per_request_cost`: per-request price.
- `pricing_notes`: custom or supplemental text.

`pricing_mode` defaults to `inherit` when missing. In `inherit` mode, public display uses the related model's default usage prices with multiplier `1`.

## Pricing Semantics

### Inherit

Uses model default token prices directly. Public directory still shows final concrete values, such as input and output prices, rather than "same as official".

### Usage

Usage pricing has two sources:

- `model_default`: use model default token prices, then multiply each available price by `price_multiplier`.
- `manual`: use site-model override token prices. The multiplier still applies, defaulting to `1`, so an admin can enter base custom prices and adjust them together.

If a source price is missing, the resolved display for that item is omitted. If both input and output prices are missing, the public display shows `价格未填写`.

### Per Request

Uses `per_request_cost`. Public directory displays `每次 $x`. If the amount is missing, it displays `价格未填写`.

### Free

Public directory displays `免费`.

### Custom

Uses `pricing_notes` as the public price text. If empty, it displays `价格未填写`.

## Admin UI

In `SiteForm`, each selected model card gets a pricing section below capability overrides:

- Billing mode select: inherit, usage, per request, free, custom.
- For usage:
  - Source select: model default or manual.
  - Multiplier number input, default `1`.
  - Manual source reveals input/output/cache price inputs.
- For per request:
  - Per-request price input.
- For custom:
  - Pricing notes textarea.
- Pricing notes may also be available as supplemental text for structured modes if the current layout can support it cleanly.

The form should keep the existing compact card pattern and avoid making selected model cards too tall when pricing is not enabled.

## Public Directory

`HomePage` resolves pricing when building `SiteDirectoryItem.modelCapabilities`.

Each site model in the public directory displays pricing near its capabilities and rating:

- Usage or inherit: `输入 $x/M tokens`, `输出 $y/M tokens`.
- Cache prices appear only when resolved: `缓存读 $x/M tokens`, `缓存写 $y/M tokens`.
- Per request: `每次 $x`.
- Free: `免费`.
- Custom: display `pricing_notes`.
- Missing structured data: `价格未填写`.

The directory does not expose raw multiplier as the primary display. The user sees final prices. Multiplier can be reflected in admin UI only.

## API And Payload Flow

`SiteModelPayload` accepts the new pricing fields and normalizes them:

- Unknown `pricingMode` becomes `inherit`.
- Unknown `usagePriceSource` becomes `model_default`.
- Empty numeric fields become `null`.
- Numeric fields parse through a shared helper and reject non-finite values by returning `null`.
- Multiplier defaults to `1` if missing, empty, non-finite, or less than or equal to `0`.
- Empty notes become `null`.

`syncSiteModels` writes the normalized fields into `site_models` along with existing capability override and rating data.

## Helper Boundary

Add a pricing helper module, likely `src/lib/site-model-pricing.ts`, responsible for:

- Pricing mode constants and type guards.
- Numeric normalization for payloads.
- Resolving final display prices from model defaults plus site-model pricing fields.
- Formatting prices consistently with existing `formatCost` style.

This keeps pricing rules out of `SiteForm`, API routes, and `HomePage` mapping logic.

## Migration

Create a new Drizzle migration adding the new columns to `site_models`.

Existing rows require no backfill because nullable fields plus application defaults make them behave as `inherit`.

## Testing

Add focused tests before production changes:

- Payload normalization:
  - Parses usage mode with model default source and multiplier.
  - Parses manual usage override prices.
  - Parses per-request price.
  - Normalizes invalid numbers and empty notes.
- Pricing resolution:
  - Inherit displays model default input/output prices.
  - Usage with multiplier displays calculated input/output prices.
  - Manual usage overrides display manual values after multiplier.
  - Missing usage prices display `价格未填写`.
  - Per-request, free, and custom modes display expected labels.
- Directory mapping:
  - `HomePage`-equivalent mapping includes resolved pricing text for each site model.
- Form initialization:
  - Editing a site preserves pricing settings in selected model cards.

## Risks And Limits

- Manual prices plus multiplier can be misunderstood. The UI must label the multiplier as applying to the selected price source.
- SQLite stores numeric prices as `real`, so very precise decimal arithmetic is not guaranteed. This is acceptable for display-only pricing.
- Custom pricing remains unstructured and cannot be sorted or computed.
- If model default prices are absent, inherited or default-sourced usage pricing cannot produce input/output prices.
