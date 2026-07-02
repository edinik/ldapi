# Resource Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-managed resource directory with a public homepage tab for tool projects and LinuxDo tutorial posts.

**Architecture:** Add a single `resources` table and keep resource-specific behavior in small helper modules. Reuse the existing App Router, authenticated API route, admin table, shared form, and homepage tab patterns already used by sites and models.

**Tech Stack:** Next.js App Router, React, TypeScript, Drizzle ORM, SQLite, Tailwind CSS, Node test runner.

---

## File Structure

- Modify `src/db/schema.ts`: add `resources` table.
- Create `src/lib/resource-payload.ts`: parse and normalize incoming admin form/API payloads.
- Create `src/lib/resource-directory-filter.ts`: filter public resources by query, type, and tags.
- Create `tests/resource-payload.test.ts`: cover type, tag, and URL normalization.
- Create `tests/resource-directory-filter.test.ts`: cover search, type filtering, tag filtering, and combined filters.
- Create `src/components/ResourceForm.tsx`: admin create/edit form with type-aware sections and reusable tag suggestions.
- Create `src/components/ResourceDirectory.tsx`: public resource tab content with filters and two sections.
- Modify `src/components/HomeTabs.tsx`: add `resources` tab.
- Modify `src/app/page.tsx`: query active resources and pass them into `HomeTabs`.
- Create `src/app/admin/resources/page.tsx`: admin list and stats.
- Create `src/app/admin/resources/new/page.tsx`: create page and client submit logic.
- Create `src/app/admin/resources/[id]/edit/page.tsx`: edit page.
- Create `src/app/admin/resources/[id]/edit/EditResourceClient.tsx`: update/delete client logic.
- Create `src/app/api/resources/route.ts`: GET and POST resources.
- Create `src/app/api/resources/[id]/route.ts`: PUT and DELETE resources.
- Modify `src/app/admin/page.tsx`: add navigation to resource management.
- Add Drizzle migration under `drizzle/`: create `resources` table.

---

### Task 1: Resource Payload Helpers

**Files:**
- Create: `src/lib/resource-payload.ts`
- Create: `tests/resource-payload.test.ts`

- [ ] **Step 1: Add failing payload tests**

Create `tests/resource-payload.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseResourcePayload, parseResourceTags, serializeResourceTags } from "../src/lib/resource-payload";

describe("resource payload helpers", () => {
  it("normalizes tags from arrays and comma/newline separated strings", () => {
    assert.deepEqual(parseResourceTags([" Docker ", "docker", "", "反代"]), ["Docker", "docker", "反代"]);
    assert.deepEqual(parseResourceTags("Docker, 反代\n新手向"), ["Docker", "反代", "新手向"]);
    assert.equal(serializeResourceTags([" Docker ", "", "反代"]), "[\"Docker\",\"反代\"]");
  });

  it("parses tool payloads with nullable links", () => {
    const result = parseResourcePayload({
      type: "tool",
      title: "Cool Project",
      description: "Useful open-source tool",
      tags: "AI, GitHub",
      githubUrl: " https://github.com/example/project ",
      officialUrl: "",
      demoUrl: null,
      linuxdoUrl: "https://linux.do/t/topic/1",
      recommendation: "",
      isActive: true,
    });

    assert.equal(result.type, "tool");
    assert.equal(result.title, "Cool Project");
    assert.equal(result.githubUrl, "https://github.com/example/project");
    assert.equal(result.officialUrl, null);
    assert.equal(result.demoUrl, null);
    assert.equal(result.recommendation, null);
    assert.equal(result.tags, "[\"AI\",\"GitHub\"]");
    assert.equal(result.isActive, true);
  });

  it("falls back to tutorial type and requires a trimmed title", () => {
    const result = parseResourcePayload({
      type: "unknown",
      title: "  LinuxDo Guide  ",
      tags: [],
      isActive: false,
    });

    assert.equal(result.type, "tutorial");
    assert.equal(result.title, "LinuxDo Guide");
    assert.equal(result.isActive, false);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npx tsc --noEmit
node --test tests/resource-payload.test.ts
```

Expected: `tsc` or the node test fails because `src/lib/resource-payload.ts` does not exist.

- [ ] **Step 3: Implement payload helpers**

Create `src/lib/resource-payload.ts`:

```ts
export const resourceTypes = ["tool", "tutorial"] as const;

export type ResourceType = (typeof resourceTypes)[number];

function nullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

export function parseResourceTags(value: unknown) {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,]/)
      : [];

  return Array.from(
    new Set(
      rawTags
        .map((tag) => String(tag).trim())
        .filter((tag) => tag.length > 0),
    ),
  );
}

export function serializeResourceTags(value: unknown) {
  return JSON.stringify(parseResourceTags(value));
}

export function parseStoredResourceTags(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return parseResourceTags(parsed);
  } catch {
    return [];
  }
}

export function normalizeResourceType(value: unknown): ResourceType {
  return value === "tool" ? "tool" : "tutorial";
}

export function parseResourcePayload(body: Record<string, unknown>) {
  return {
    type: normalizeResourceType(body.type),
    title: requiredString(body.title),
    description: nullableString(body.description),
    tags: serializeResourceTags(body.tags),
    githubUrl: nullableString(body.githubUrl),
    officialUrl: nullableString(body.officialUrl),
    demoUrl: nullableString(body.demoUrl),
    linuxdoUrl: nullableString(body.linuxdoUrl),
    recommendation: nullableString(body.recommendation),
    isActive: booleanValue(body.isActive, true),
  };
}
```

- [ ] **Step 4: Run payload tests**

Run:

```bash
node --test tests/resource-payload.test.ts
```

Expected: all tests in `resource-payload.test.ts` pass.

---

### Task 2: Resource Filter Helpers

**Files:**
- Create: `src/lib/resource-directory-filter.ts`
- Create: `tests/resource-directory-filter.test.ts`

- [ ] **Step 1: Add failing filter tests**

Create `tests/resource-directory-filter.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterResources, getResourceTagOptions, type DirectoryResource } from "../src/lib/resource-directory-filter";

const resources: DirectoryResource[] = [
  {
    id: 1,
    type: "tool",
    title: "Open Gateway",
    description: "API proxy project",
    tags: ["API", "Docker"],
    githubUrl: "https://github.com/example/open-gateway",
    officialUrl: "https://gateway.example.com",
    demoUrl: "https://demo.example.com",
    linuxdoUrl: "https://linux.do/t/topic/1",
    recommendation: null,
  },
  {
    id: 2,
    type: "tutorial",
    title: "Nginx reverse proxy guide",
    description: "LinuxDo deployment tutorial",
    tags: ["反代", "Docker"],
    githubUrl: null,
    officialUrl: null,
    demoUrl: null,
    linuxdoUrl: "https://linux.do/t/topic/2",
    recommendation: "步骤完整，评论区排错信息多",
  },
  {
    id: 3,
    type: "tool",
    title: "Prompt Website",
    description: null,
    tags: ["Prompt"],
    githubUrl: null,
    officialUrl: "https://prompt.example.com",
    demoUrl: null,
    linuxdoUrl: null,
    recommendation: null,
  },
];

describe("resource directory filters", () => {
  it("matches query across text, tags, links, and recommendation", () => {
    assert.deepEqual(filterResources(resources, { query: "github", type: "all", tags: [] }).map((item) => item.id), [1]);
    assert.deepEqual(filterResources(resources, { query: "排错", type: "all", tags: [] }).map((item) => item.id), [2]);
    assert.deepEqual(filterResources(resources, { query: "prompt", type: "all", tags: [] }).map((item) => item.id), [3]);
  });

  it("filters by resource type", () => {
    assert.deepEqual(filterResources(resources, { query: "", type: "tutorial", tags: [] }).map((item) => item.id), [2]);
  });

  it("requires every selected tag", () => {
    assert.deepEqual(filterResources(resources, { query: "", type: "all", tags: ["Docker", "反代"] }).map((item) => item.id), [2]);
  });

  it("returns sorted unique tag options", () => {
    assert.deepEqual(getResourceTagOptions(resources), ["API", "Docker", "Prompt", "反代"]);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
node --test tests/resource-directory-filter.test.ts
```

Expected: fails because `src/lib/resource-directory-filter.ts` does not exist.

- [ ] **Step 3: Implement filter helpers**

Create `src/lib/resource-directory-filter.ts`:

```ts
import type { ResourceType } from "@/lib/resource-payload";

export type ResourceTypeFilter = ResourceType | "all";

export type DirectoryResource = {
  id: number;
  type: ResourceType;
  title: string;
  description: string | null;
  tags: string[];
  githubUrl: string | null;
  officialUrl: string | null;
  demoUrl: string | null;
  linuxdoUrl: string | null;
  recommendation: string | null;
};

export type ResourceDirectoryFilters = {
  query: string;
  type: ResourceTypeFilter;
  tags: string[];
};

export function filterResources(resources: DirectoryResource[], filters: ResourceDirectoryFilters) {
  const query = filters.query.trim().toLowerCase();

  return resources.filter((resource) => {
    const matchesQuery =
      query.length === 0 ||
      [
        resource.title,
        resource.description ?? "",
        resource.recommendation ?? "",
        resource.githubUrl ?? "",
        resource.officialUrl ?? "",
        resource.demoUrl ?? "",
        resource.linuxdoUrl ?? "",
        ...resource.tags,
      ].some((value) => value.toLowerCase().includes(query));

    const matchesType = filters.type === "all" || resource.type === filters.type;
    const matchesTags = filters.tags.every((tag) => resource.tags.includes(tag));

    return matchesQuery && matchesType && matchesTags;
  });
}

export function getResourceTagOptions(resources: DirectoryResource[]) {
  return Array.from(new Set(resources.flatMap((resource) => resource.tags))).sort((a, b) => a.localeCompare(b));
}
```

- [ ] **Step 4: Run filter tests**

Run:

```bash
node --test tests/resource-directory-filter.test.ts
```

Expected: all tests in `resource-directory-filter.test.ts` pass.

---

### Task 3: Database Schema, Migration, And API

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/app/api/resources/route.ts`
- Create: `src/app/api/resources/[id]/route.ts`
- Add: `drizzle/<next-number>_resource_directory.sql`
- Modify: `drizzle/meta/_journal.json`
- Add: `drizzle/meta/<next-number>_snapshot.json`

- [ ] **Step 1: Add schema table**

Modify `src/db/schema.ts` after `models`:

```ts
export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull().default("tutorial"),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").notNull().default("[]"),
  githubUrl: text("github_url"),
  officialUrl: text("official_url"),
  demoUrl: text("demo_url"),
  linuxdoUrl: text("linuxdo_url"),
  recommendation: text("recommendation"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
```

- [ ] **Step 2: Add collection API route**

Create `src/app/api/resources/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { parseResourcePayload } from "@/lib/resource-payload";

export async function GET() {
  const allResources = await db.select().from(resources).orderBy(desc(resources.updatedAt), desc(resources.id));
  return NextResponse.json(allResources);
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();
  const resourceData = parseResourcePayload(body);

  if (!resourceData.title) {
    return NextResponse.json({ error: "资源标题不能为空" }, { status: 400 });
  }

  const [newResource] = await db.insert(resources).values(resourceData).returning();
  return NextResponse.json(newResource, { status: 201 });
}
```

- [ ] **Step 3: Add item API route**

Create `src/app/api/resources/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { parseResourcePayload } from "@/lib/resource-payload";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const resourceId = parseInt(id);
  const body = await req.json();
  const resourceData = parseResourcePayload(body);

  if (!resourceData.title) {
    return NextResponse.json({ error: "资源标题不能为空" }, { status: 400 });
  }

  await db
    .update(resources)
    .set({ ...resourceData, updatedAt: new Date() })
    .where(eq(resources.id, resourceId));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const resourceId = parseInt(id);

  await db.delete(resources).where(eq(resources.id, resourceId));
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Generate migration**

Run:

```bash
npm run db:generate
```

Expected: a new migration SQL file and matching Drizzle metadata snapshot are created.

- [ ] **Step 5: Verify schema and API compile**

Run:

```bash
npx tsc --noEmit
```

Expected: TypeScript succeeds.

---

### Task 4: Admin Resource UI

**Files:**
- Create: `src/components/ResourceForm.tsx`
- Create: `src/app/admin/resources/page.tsx`
- Create: `src/app/admin/resources/new/page.tsx`
- Create: `src/app/admin/resources/[id]/edit/page.tsx`
- Create: `src/app/admin/resources/[id]/edit/EditResourceClient.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Create `ResourceForm`**

Implement `src/components/ResourceForm.tsx` with these exported props:

```ts
interface ResourceFormProps {
  initialData?: Record<string, unknown>;
  tagOptions: string[];
  onSubmit: (data: Record<string, unknown>) => void;
  saving: boolean;
}
```

The form must:

- Keep `type` in component state with default `tool` for new resources.
- Submit `type`, `title`, `description`, `tags`, `githubUrl`, `officialUrl`, `demoUrl`, `linuxdoUrl`, `recommendation`, and `isActive`.
- Parse initial stored tags with `parseStoredResourceTags`.
- Provide a tag combobox that filters `tagOptions` by current input.
- Add tags on Enter, comma, or clicking a suggestion.
- Render selected tags as removable chips.
- Show tool link fields under a "工具链接" section.
- Show recommendation under a "教程说明" section.
- Keep all fields mounted so switching type never clears existing values.

- [ ] **Step 2: Add admin list page**

Create `src/app/admin/resources/page.tsx` that:

- Calls `requireAdmin()`.
- Queries all resources ordered by `updatedAt desc`, then `id desc`.
- Parses `tags` for display.
- Shows stats for all resources, published resources, tool resources, and tutorial resources.
- Renders an admin table with title, type, tags, status, primary link, and edit link.
- Links to `/admin/resources/new`.
- Links back to `/admin` and `/`.

- [ ] **Step 3: Add new resource page**

Create `src/app/admin/resources/new/page.tsx` as a client page following the existing `src/app/admin/models/new/page.tsx` pattern. It should fetch existing resources server-side only if implemented as a server wrapper; otherwise make this page a server component with a nested client component. Prefer the server-wrapper pattern so tag suggestions do not require another client fetch.

The nested client submit function posts to `/api/resources` and redirects to `/admin/resources` on success.

- [ ] **Step 4: Add edit resource page and client**

Create `src/app/admin/resources/[id]/edit/page.tsx` that:

- Calls `requireAdmin()`.
- Loads the resource by id.
- Calls `notFound()` if missing.
- Loads all resource tags for suggestions.
- Renders `EditResourceClient`.

Create `src/app/admin/resources/[id]/edit/EditResourceClient.tsx` that:

- PUTs form data to `/api/resources/${resource.id}`.
- Redirects to `/admin/resources` on success.
- Deletes through `DELETE /api/resources/${resource.id}` after confirmation.

- [ ] **Step 5: Add admin navigation**

Modify `src/app/admin/page.tsx` header actions to include:

```tsx
<Link href="/admin/resources" className="ld-button-secondary">
  资源管理
</Link>
```

- [ ] **Step 6: Verify admin UI compile**

Run:

```bash
npx tsc --noEmit
```

Expected: TypeScript succeeds.

---

### Task 5: Public Resource Tab

**Files:**
- Create: `src/components/ResourceDirectory.tsx`
- Modify: `src/components/HomeTabs.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `ResourceDirectory`**

Create `src/components/ResourceDirectory.tsx` as a client component that:

- Accepts `resources: DirectoryResource[]`.
- Uses `filterResources` and `getResourceTagOptions`.
- Maintains `query`, `selectedTags`, and `selectedType`.
- Shows one filter panel with search, type chips, tag chips, result count, and clear button.
- Splits filtered resources into tool resources and tutorial resources.
- Renders "工具项目" and "LinuxDo 教程" sections only when the active type filter allows them.
- Shows an empty state when there are no resources or no matches.

Cards should use existing classes such as `ld-card`, `ld-badge`, `ld-button-secondary`, `ld-filter-panel`, `ld-filter-chip`, and `ld-link`.

- [ ] **Step 2: Add resources tab to `HomeTabs`**

Modify `src/components/HomeTabs.tsx`:

```ts
import { ResourceDirectory } from "@/components/ResourceDirectory";
import type { DirectoryResource } from "@/lib/resource-directory-filter";

type Tab = "sites" | "models" | "resources";

export function HomeTabs({
  sites,
  models,
  resources,
}: {
  sites: SiteDirectoryItem[];
  models: ModelDisplayItem[];
  resources: DirectoryResource[];
}) {
  // Add 资源 tab button and render <ResourceDirectory resources={resources} />.
}
```

- [ ] **Step 3: Query active resources on homepage**

Modify `src/app/page.tsx`:

- Import `resources` from `@/db/schema`.
- Query `db.query.resources.findMany` or `db.select().from(resources)` with `isActive=true`.
- Sort by newest first.
- Map stored `tags` through `parseStoredResourceTags`.
- Pass `resources={resourceList}` to `HomeTabs`.

- [ ] **Step 4: Verify homepage compile**

Run:

```bash
npx tsc --noEmit
```

Expected: TypeScript succeeds.

---

### Task 6: Final Verification

**Files:**
- Potentially update: `README.md` if the public/admin entry list needs the new resource paths.

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
node --test tests/resource-payload.test.ts tests/resource-directory-filter.test.ts
```

Expected: all resource tests pass.

- [ ] **Step 2: Run full test suite**

Run:

```bash
node --test tests/*.test.ts
```

Expected: all repository tests pass.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: ESLint succeeds.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 5: Apply local database update for manual smoke test**

Run:

```bash
npm run db:push
```

Expected: local SQLite database has the `resources` table.

- [ ] **Step 6: Smoke test in browser**

Run:

```bash
npm run dev
```

Expected: dev server starts. Manually verify:

- `/admin/resources` requires login.
- A tool resource can be created, edited, and deleted.
- A tutorial resource can be created, edited, and deleted.
- Existing tags appear as suggestions in the resource form.
- `/` shows a `资源` tab.
- Tool resources and tutorial resources are shown in separate sections.
- Search, type filter, tag filter, and clear filters work.
