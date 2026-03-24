import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CLI = path.resolve(import.meta.dirname, "../bin/ghac.ts");
const BASIC_PROJECT = path.resolve(import.meta.dirname, "fixtures/basic-project");
const RUNNER = "npx tsx";

describe("CLI", () => {
  it("shows help with --help", () => {
    const output = execSync(`${RUNNER} ${CLI} --help`, { encoding: "utf-8" });
    expect(output).toContain("ghac");
    expect(output).toContain("build");
    expect(output).toContain("validate");
    expect(output).toContain("lint");
  });

  it("build command compiles workflows to output dir", () => {
    const tmpDir = `/tmp/ghac-test-${Date.now()}`;
    execSync(`mkdir -p ${tmpDir}/.ghsrc && cp -r ${BASIC_PROJECT}/.ghsrc/* ${tmpDir}/.ghsrc/`);
    const output = execSync(`${RUNNER} ${CLI} build --project ${tmpDir}`, { encoding: "utf-8" });
    expect(output).toContain("ci.yml");

    // Verify file was created
    expect(fs.existsSync(path.join(tmpDir, ".github/workflows/ci.yml"))).toBe(true);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("validate command checks compiled output", () => {
    const output = execSync(`${RUNNER} ${CLI} validate --project ${BASIC_PROJECT}`, {
      encoding: "utf-8",
    });
    expect(output).toContain("valid");
  });

  it("lint command checks source structure", () => {
    const output = execSync(`${RUNNER} ${CLI} lint --project ${BASIC_PROJECT}`, {
      encoding: "utf-8",
    });
    expect(output).toContain("passed");
  });
});
