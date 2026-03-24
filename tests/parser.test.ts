import { describe, it, expect } from "vitest";
import { parse } from "../src/parser.js";

describe("parse", () => {
  it("parses plain YAML without custom tags", () => {
    const input = `name: CI\non:\n  push:\n    branches: [main]`;
    const result = parse(input);
    expect(result).toEqual({
      name: "CI",
      on: { push: { branches: ["main"] } },
    });
  });

  it("parses !include tags into IncludeDirective objects", () => {
    const input = `jobs:\n  lint: !include jobs/lint.yml`;
    const result = parse(input);
    expect(result.jobs.lint).toEqual({
      type: "include",
      path: "jobs/lint.yml",
    });
  });

  it("parses !include tags in arrays", () => {
    const input = `steps:\n  - uses: actions/checkout@v4\n  - !include partials/setup.yml\n  - run: npm test`;
    const result = parse(input);
    expect(result.steps[1]).toEqual({
      type: "include",
      path: "partials/setup.yml",
    });
  });

  it("parses !template tags into TemplateDirective objects", () => {
    const input = `jobs:\n  deploy: !template\n    src: jobs/deploy.yml\n    vars:\n      environment: production`;
    const result = parse(input);
    expect(result.jobs.deploy).toEqual({
      type: "template",
      src: "jobs/deploy.yml",
      vars: { environment: "production" },
    });
  });

  it("parses !env tags into EnvDirective objects", () => {
    const input = `env: !env env/production.yml`;
    const result = parse(input);
    expect(result.env).toEqual({
      type: "env",
      path: "env/production.yml",
    });
  });
});
