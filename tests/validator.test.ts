import { describe, it, expect } from "vitest";
import { validate } from "../src/validator.js";

describe("validate", () => {
  it("passes for valid workflow YAML", () => {
    const validYaml = {
      name: "CI",
      on: { push: { branches: ["main"] } },
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [{ uses: "actions/checkout@v4" }],
        },
      },
    };
    const result = validate(validYaml, "ci.yml");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when 'on' trigger is missing", () => {
    const invalid = {
      name: "CI",
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [{ run: "echo hi" }],
        },
      },
    };
    const result = validate(invalid, "ci.yml");
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("on");
  });

  it("fails when 'jobs' is missing", () => {
    const invalid = {
      name: "CI",
      on: "push",
    };
    const result = validate(invalid, "ci.yml");
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("jobs");
  });

  it("fails when a job has no 'runs-on' and no 'uses'", () => {
    const invalid = {
      name: "CI",
      on: "push",
      jobs: {
        build: {
          steps: [{ run: "echo hi" }],
        },
      },
    };
    const result = validate(invalid, "ci.yml");
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("runs-on");
  });

  it("passes when a job uses 'uses' (reusable workflow) instead of 'runs-on'", () => {
    const valid = {
      name: "CI",
      on: "push",
      jobs: {
        build: {
          uses: "./.github/workflows/reusable.yml",
        },
      },
    };
    const result = validate(valid, "ci.yml");
    expect(result.valid).toBe(true);
  });

  it("fails when a job step has neither 'run', 'uses', nor 'with'", () => {
    const invalid = {
      name: "CI",
      on: "push",
      jobs: {
        build: {
          "runs-on": "ubuntu-latest",
          steps: [{ name: "broken step" }],
        },
      },
    };
    const result = validate(invalid, "ci.yml");
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("step");
  });
});
