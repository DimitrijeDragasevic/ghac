import { describe, it, expect } from "vitest";
import { resolve } from "../src/resolver.js";
import path from "node:path";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");
const SOURCE_DIR = path.join(FIXTURES, "basic-project", ".ghsrc");

describe("resolve", () => {
  it("resolves !include directives by loading referenced file content", () => {
    const input = {
      name: "CI",
      jobs: {
        lint: { type: "include" as const, path: "jobs/lint.yml" },
      },
    };
    const result = resolve(input, SOURCE_DIR);
    expect(result.jobs.lint).toHaveProperty("runs-on", "ubuntu-latest");
    expect(result.jobs.lint.steps).toBeDefined();
  });

  it("resolves nested !include directives recursively", () => {
    const input = {
      name: "CI",
      jobs: {
        lint: { type: "include" as const, path: "jobs/lint.yml" },
      },
    };
    const result = resolve(input, SOURCE_DIR);
    const steps = result.jobs.lint.steps;
    // Step 0: checkout, Step 1: resolved node-setup partial, Step 2: npm run lint
    expect(steps[1]).toHaveProperty("uses", "actions/setup-node@v4");
  });

  it("resolves !include in arrays by splicing content in place", () => {
    const input = {
      steps: [
        { uses: "actions/checkout@v4" },
        { type: "include" as const, path: "partials/node-setup.yml" },
        { run: "npm test" },
      ],
    };
    const result = resolve(input, SOURCE_DIR);
    expect(result.steps).toHaveLength(3);
    expect(result.steps[1]).toHaveProperty("uses", "actions/setup-node@v4");
  });

  it("throws ResolveError for missing referenced files", () => {
    const input = {
      jobs: {
        lint: { type: "include" as const, path: "jobs/nonexistent.yml" },
      },
    };
    expect(() => resolve(input, SOURCE_DIR)).toThrow("not found");
  });

  it("detects circular includes", async () => {
    const fs = await import("node:fs");
    const tmpDir = `/tmp/ghac-circular-test-${Date.now()}`;
    fs.mkdirSync(path.join(tmpDir, "jobs"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, "jobs", "a.yml"),
      "name: A\njob: !include jobs/b.yml\n"
    );
    fs.writeFileSync(
      path.join(tmpDir, "jobs", "b.yml"),
      "name: B\njob: !include jobs/a.yml\n"
    );

    const input = {
      root: { type: "include" as const, path: "jobs/a.yml" },
    };
    expect(() => resolve(input, tmpDir)).toThrow("Circular include");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
