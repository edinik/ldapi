# Resource Directory Design

## Goal

Add a homepage resource tab for useful tools, open-source projects, helpful websites, demos, LinuxDo discussion links, and high-quality LinuxDo tutorial posts. Admin users can create, edit, publish, unpublish, and delete resources from the backend.

## Scope

- Add a single `resources` table for both tool resources and tutorial posts.
- Add authenticated admin CRUD screens for resources.
- Add reusable tag entry with free input and suggestions from existing resource tags.
- Add a homepage resource tab that separates tool projects from LinuxDo tutorials.
- Add search, type filtering, and tag filtering on the public resource tab.
- Only active resources appear on the public homepage.

## Data Model

`resources` stores both resource types:

- `id`
- `type`: `tool` or `tutorial`
- `title`
- `description`
- `tags`: JSON string containing a string array
- `githubUrl`
- `officialUrl`
- `demoUrl`
- `linuxdoUrl`
- `recommendation`
- `isActive`
- `createdAt`
- `updatedAt`

Tool resources primarily use title, description, tags, GitHub URL, official URL, demo URL, and LinuxDo URL. Tutorial resources primarily use title, description, tags, LinuxDo URL, and recommendation.

Tags are not managed through a separate table in this version. The app derives reusable tag suggestions and public filter options from existing resource records. Tag normalization trims whitespace, removes empty entries, and deduplicates repeated labels.

## Admin UI

Add `/admin/resources` as the resource management entry. The admin list shows title, type, tags, status, primary link, and edit action. It includes actions for adding resources and deleting existing records.

Add shared create and edit pages using `ResourceForm`. The form contains:

- Type selector: tool project or LinuxDo tutorial
- Title
- Description
- Tag input with free typing and existing-tag suggestions
- LinuxDo URL
- GitHub URL, official URL, and demo URL for tool resources
- Recommendation for tutorial resources
- Published status

Changing the selected type adjusts field emphasis in the UI but does not erase values already typed into fields that are less relevant for the new type.

## Public UI

`HomeTabs` gains a third tab: resources. The resource tab has one shared filter panel and two content sections:

- Tool projects
- LinuxDo tutorials

The filter panel supports:

- Text search across title, description, tags, recommendation, and URLs
- Multi-select tag chips
- Type filter for all resources, tool projects only, or tutorials only

Tool cards show title, description, tags, and available links for GitHub, official site, demo, and LinuxDo discussion. Tutorial cards show title, description, tags, recommendation, and a LinuxDo original-post link.

## Verification

- Add unit tests for resource filtering: search, tags, type filtering, and combined filters.
- Add unit tests for resource payload parsing: tag normalization, empty URL handling, and resource type handling.
- Run lint and relevant tests after implementation.
- Apply the Drizzle schema update with a generated migration or `db:push`, depending on the deployment workflow used for this repository.
