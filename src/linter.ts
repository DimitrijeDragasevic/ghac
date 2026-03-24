import fs from "node:fs";
import path from "node:path";
import { parse } from "./parser.js";
import { loadConfig } from "./config.js";
import type { LintResult, LintWarning, LintError } from "./types.js";

export function lint(projectRoot: string): LintResult {
  const config = loadConfig(projectRoot);
  const sourceDir = path.resolve(projectRoot, config.source);
  const warnings: LintWarning[] = [];
  const errors: LintError[] = [];

  // Rule: source directory must exist
  if (!fs.existsSync(sourceDir)) {
    errors.push({
      file: sourceDir,
      message: `Source directory not found: ${sourceDir}`,
      rule: "source-dir-exists",
    });
    return { passed: false, warnings, errors };
  }

  const workflowsDir = path.join(sourceDir, "workflows");
  if (!fs.existsSync(workflowsDir)) {
    errors.push({
      file: workflowsDir,
      message: `Workflows directory not found: ${workflowsDir}`,
      rule: "source-dir-exists",
    });
    return { passed: false, warnings, errors };
  }

  // Rule: recognized directories
  const recognized = new Set(["workflows", "jobs", "partials", "env"]);
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !recognized.has(entry.name)) {
      warnings.push({
        file: path.join(sourceDir, entry.name),
        message: `Unrecognized directory: ${entry.name}. Expected one of: ${[...recognized].join(", ")}`,
        rule: "no-stray-files",
      });
    }
    if (entry.isFile() && !entry.name.startsWith("ghac.config")) {
      warnings.push({
        file: path.join(sourceDir, entry.name),
        message: `File at source root: ${entry.name}. Place YAML files in workflows/, jobs/, partials/, or env/`,
        rule: "no-stray-files",
      });
    }
  }

  // Rule: workflow files should have a name field (recursive)
  function lintWorkflowDir(dir: string, prefix: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        lintWorkflowDir(abs, rel);
      } else if (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")) {
        try {
          const content = fs.readFileSync(abs, "utf-8");
          const parsed = parse(content) as any;
          if (parsed && typeof parsed === "object" && !parsed.name) {
            warnings.push({
              file: `workflows/${rel}`,
              message: "Workflow file should have a 'name' field",
              rule: "workflow-has-name",
            });
          }
        } catch {
          // Parse errors will be caught by the compiler/validator
        }
      }
    }
  }
  lintWorkflowDir(workflowsDir);

  return {
    passed: errors.length === 0,
    warnings,
    errors,
  };
}
