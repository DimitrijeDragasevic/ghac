import { describe, it, expect } from "vitest";
import { compile } from "../src/compiler.js";
import path from "node:path";
import yaml from "js-yaml";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");

describe("compile", () => {
  it("compiles a basic project with includes into valid YAML", () => {
    const projectRoot = path.join(FIXTURES, "basic-project");
    const result = compile(projectRoot);

    expect(result.errors).toHaveLength(0);
    expect(result.workflows).toHaveLength(1);

    const ci = result.workflows[0];
    expect(ci.outputName).toBe("ci.yml");

    // Parse the output to verify structure
    const parsed = yaml.load(ci.content) as any;
    expect(parsed.name).toBe("CI");
    expect(parsed.jobs.lint["runs-on"]).toBe("ubuntu-latest");
    // Verify nested include was resolved
    expect(parsed.jobs.lint.steps[1].uses).toBe("actions/setup-node@v4");
  });

  it("compiles a template project with variable substitution", () => {
    const projectRoot = path.join(FIXTURES, "template-project");
    const result = compile(projectRoot);

    expect(result.errors).toHaveLength(0);
    expect(result.workflows).toHaveLength(1);

    const deploy = result.workflows[0];
    const parsed = yaml.load(deploy.content) as any;
    expect(parsed.jobs["deploy-prod"].environment).toBe("production");
  });

  it("returns errors for invalid references instead of throwing", () => {
    const projectRoot = path.join(FIXTURES, "invalid-project");
    const result = compile(projectRoot);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("not found");
  });

  it("compiles nested workflow folders with prefix flattening", () => {
    const projectRoot = path.join(FIXTURES, "nested-project");
    const result = compile(projectRoot);

    expect(result.errors).toHaveLength(0);
    expect(result.workflows).toHaveLength(3);

    const names = result.workflows.map((w) => w.outputName).sort();
    expect(names).toEqual([
      "deploy-prod.yml",
      "deploy-staging.yml",
      "testing-lint.yml",
    ]);

    // Verify source paths preserve folder structure
    const sourcePaths = result.workflows.map((w) => w.sourcePath).sort();
    expect(sourcePaths).toEqual([
      "workflows/deploy/prod.yml",
      "workflows/deploy/staging.yml",
      "workflows/testing/lint.yml",
    ]);

    // Verify includes still work inside nested workflows
    const staging = result.workflows.find((w) => w.outputName === "deploy-staging.yml")!;
    const parsed = yaml.load(staging.content) as any;
    expect(parsed.name).toBe("Deploy Staging");
    expect(parsed.jobs.deploy.steps[0].uses).toBe("actions/checkout@v4");
  });

  it("uses flat naming when configured", () => {
    // Create a temp project with flatten: flat
    const fs = require("fs");
    const tmpDir = `/tmp/ghac-flat-test-${Date.now()}`;
    const wfDir = path.join(tmpDir, ".ghsrc", "workflows", "deploy");
    fs.mkdirSync(wfDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, ".ghsrc", "ghac.config.yml"),
      "source: .ghsrc\noutput: .github/workflows\nflatten: flat\n"
    );
    fs.writeFileSync(
      path.join(wfDir, "staging.yml"),
      "name: Staging\non: push\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n"
    );

    const result = compile(tmpDir);
    expect(result.errors).toHaveLength(0);
    expect(result.workflows[0].outputName).toBe("staging.yml");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
