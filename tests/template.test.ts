import { describe, it, expect } from "vitest";
import { substituteVars, resolveTemplates } from "../src/template.js";
import path from "node:path";

const FIXTURES = path.resolve(import.meta.dirname, "fixtures");
const SOURCE_DIR = path.join(FIXTURES, "template-project", ".ghsrc");

describe("substituteVars", () => {
  it("replaces ${{ ghac.varname }} with provided values", () => {
    const input = {
      environment: "${{ ghac.environment }}",
      node: "${{ ghac.node_version }}",
    };
    const vars = { environment: "production", node_version: "20" };
    const result = substituteVars(input, vars);
    expect(result).toEqual({
      environment: "production",
      node: "20",
    });
  });

  it("replaces variables in nested objects", () => {
    const input = {
      steps: [
        {
          with: {
            "node-version": "${{ ghac.node_version }}",
          },
        },
      ],
    };
    const vars = { node_version: "20" };
    const result = substituteVars(input, vars);
    expect(result.steps[0].with["node-version"]).toBe("20");
  });

  it("throws TemplateError for undefined variables", () => {
    const input = { env: "${{ ghac.undefined_var }}" };
    expect(() => substituteVars(input, {})).toThrow("undefined template variable");
  });

  it("handles strings with mixed content", () => {
    const input = { cmd: "echo ${{ ghac.name }} on ${{ ghac.env }}" };
    const vars = { name: "app", env: "prod" };
    const result = substituteVars(input, vars);
    expect(result.cmd).toBe("echo app on prod");
  });

  it("leaves non-ghac ${{ }} expressions untouched", () => {
    const input = { expr: "${{ github.ref }}" };
    const result = substituteVars(input, {});
    expect(result.expr).toBe("${{ github.ref }}");
  });
});

describe("resolveTemplates", () => {
  it("resolves !template directives by loading file and substituting vars", () => {
    const input = {
      name: "Deploy",
      jobs: {
        "deploy-prod": {
          type: "template",
          src: "jobs/deploy.yml",
          vars: { environment: "production", node_version: "20" },
        },
      },
    };
    const result = resolveTemplates(input, SOURCE_DIR);
    expect(result.jobs["deploy-prod"]).toHaveProperty("runs-on", "ubuntu-latest");
    expect(result.jobs["deploy-prod"]).toHaveProperty("environment", "production");
  });
});
