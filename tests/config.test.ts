import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";
import path from "node:path";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");

describe("loadConfig", () => {
  it("loads config from ghac.config.yml in project root", () => {
    const projectRoot = path.join(FIXTURES, "basic-project");
    const config = loadConfig(projectRoot);
    expect(config).toEqual({
      source: ".ghsrc",
      output: ".github/workflows",
      flatten: "prefix",
    });
  });

  it("returns defaults when no config file exists", () => {
    const config = loadConfig("/tmp/nonexistent-project");
    expect(config).toEqual({
      source: ".ghsrc",
      output: ".github/workflows",
      flatten: "prefix",
    });
  });

  it("loads config from .ghsrc/ directory as fallback", () => {
    const projectRoot = path.join(FIXTURES, "basic-project");
    const config = loadConfig(projectRoot);
    expect(config.source).toBe(".ghsrc");
  });
});
