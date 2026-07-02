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
