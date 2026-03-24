import { describe, it, expect } from "vitest";
import { lint } from "../src/linter.js";
import path from "node:path";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");

describe("lint", () => {
  it("passes for a well-structured project", () => {
    const projectRoot = path.join(FIXTURES, "basic-project");
    const result = lint(projectRoot);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("warns when workflows/ directory is missing", () => {
    const result = lint("/tmp/nonexistent");
    expect(result.passed).toBe(false);
    expect(result.errors[0].rule).toBe("source-dir-exists");
  });

  it("warns about .yml files outside recognized directories", () => {
    const projectRoot = path.join(FIXTURES, "basic-project");
    const result = lint(projectRoot);
    const strayFileWarnings = result.warnings.filter((w) => w.rule === "no-stray-files");
    expect(strayFileWarnings).toHaveLength(0);
  });

  it("warns when workflow file lacks a name field", async () => {
    const fs = await import("node:fs");
    const tmpDir = `/tmp/ghac-lint-test-${Date.now()}`;
    const wfDir = path.join(tmpDir, ".ghsrc", "workflows");
    fs.mkdirSync(wfDir, { recursive: true });
    fs.writeFileSync(
      path.join(wfDir, "nameless.yml"),
      "on: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n"
    );

    const result = lint(tmpDir);
    const nameWarnings = result.warnings.filter((w) => w.rule === "workflow-has-name");
    expect(nameWarnings).toHaveLength(1);
    expect(nameWarnings[0].message).toContain("name");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
