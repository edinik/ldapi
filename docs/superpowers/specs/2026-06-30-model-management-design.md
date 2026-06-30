# Model Management Design

## Goal

Add a model management surface for recording detailed AI model metadata and expose a curated model overview on the homepage.

## Scope

- Add model detail fields to the existing `models` table.
- Add authenticated admin CRUD screens for models.
- Keep existing site-to-model association by model name working.
- Add a homepage model overview that only shows active models marked for homepage display.
- Do not add hard delete as the primary workflow; use active/display toggles.

## Fields

- Basic: developer, model ID, name, icon, group, type, notes.
- Capabilities: tool calling, vision, temperature, reasoning.
- Modalities: input/output text, image, audio, video.
- Costs: input, output, cache read, cache write in `$ / M tokens`.
- Limits: context window, max output tokens.
- Dates: knowledge cutoff, release date, last updated.
- Display controls: active, show on homepage.

## UI

Admin model form follows the existing warm editorial design system. It uses grouped sections with visible labels, 44px+ controls, and compact cards suitable for repeated maintenance. The homepage uses a short model overview section, not a full data dump.

## Verification

- Unit tests cover model display helpers.
- TypeScript, lint, and production build are run after implementation.
