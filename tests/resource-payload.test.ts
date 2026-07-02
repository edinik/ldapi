import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseResourcePayload, parseResourceTags, serializeResourceTags } from "../src/lib/resource-payload";

describe("resource payload helpers", () => {
  it("normalizes tags from arrays and comma/newline separated strings", () => {
    assert.deepEqual(parseResourceTags([" Docker ", "docker", "", "反代"]), ["Docker", "反代"]);
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
