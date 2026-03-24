import { describe, it, expect, afterEach } from "vitest";
import { compile } from "../src/compiler.js";
import { validate } from "../src/validator.js";
import { lint } from "../src/linter.js";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

describe("end-to-end", () => {
  const tmpDir = `/tmp/ghac-e2e-${Date.now()}`;

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("compiles a multi-job workflow with includes and templates", () => {
    // Set up a realistic project
    const ghsrc = path.join(tmpDir, ".ghsrc");
    fs.mkdirSync(path.join(ghsrc, "workflows"), { recursive: true });
    fs.mkdirSync(path.join(ghsrc, "jobs"), { recursive: true });
    fs.mkdirSync(path.join(ghsrc, "partials"), { recursive: true });
    fs.mkdirSync(path.join(ghsrc, "env"), { recursive: true });

    // Config
    fs.writeFileSync(
      path.join(ghsrc, "ghac.config.yml"),
      "source: .ghsrc\noutput: .github/workflows\n"
    );

    // Partial: node setup
    fs.writeFileSync(
      path.join(ghsrc, "partials", "node-setup.yml"),
      [
        "uses: actions/setup-node@v4",
        "with:",
        '  node-version: "20"',
        "  cache: npm",
      ].join("\n")
    );

    // Job: lint
    fs.writeFileSync(
      path.join(ghsrc, "jobs", "lint.yml"),
      [
        "runs-on: ubuntu-latest",
        "steps:",
        "  - uses: actions/checkout@v4",
        "  - !include partials/node-setup.yml",
        "  - run: npm run lint",
      ].join("\n")
    );

    // Job: test (template)
    fs.writeFileSync(
      path.join(ghsrc, "jobs", "test.yml"),
      [
        "runs-on: ubuntu-latest",
        "environment: ${{ ghac.environment }}",
        "steps:",
        "  - uses: actions/checkout@v4",
        "  - uses: actions/setup-node@v4",
        "    with:",
        '      node-version: "${{ ghac.node_version }}"',
        "  - run: npm ci",
        "  - run: npm test",
      ].join("\n")
    );

    // Workflow: CI pipeline
    fs.writeFileSync(
      path.join(ghsrc, "workflows", "ci.yml"),
      [
        "name: CI Pipeline",
        "on:",
        "  push:",
        "    branches: [main]",
        "  pull_request:",
        "",
        "jobs:",
        "  lint: !include jobs/lint.yml",
        "  test: !template",
        "    src: jobs/test.yml",
        "    vars:",
        "      environment: ci",
        '      node_version: "20"',
      ].join("\n")
    );

    // Compile
    const result = compile(tmpDir);
    expect(result.errors).toHaveLength(0);
    expect(result.workflows).toHaveLength(1);

    const ci = result.workflows[0];
    const parsed = yaml.load(ci.content) as any;

    // Verify structure
    expect(parsed.name).toBe("CI Pipeline");
    expect(parsed.on.push.branches).toEqual(["main"]);

    // Verify include resolution
    expect(parsed.jobs.lint["runs-on"]).toBe("ubuntu-latest");
    expect(parsed.jobs.lint.steps[1].uses).toBe("actions/setup-node@v4");
    expect(parsed.jobs.lint.steps[2].run).toBe("npm run lint");

    // Verify template resolution
    expect(parsed.jobs.test.environment).toBe("ci");
    expect(parsed.jobs.test.steps[1].with["node-version"]).toBe("20");

    // Validate the compiled output
    const validation = validate(parsed, "ci.yml");
    expect(validation.valid).toBe(true);

    // Lint the source
    const lintResult = lint(tmpDir);
    expect(lintResult.passed).toBe(true);
  });
});
