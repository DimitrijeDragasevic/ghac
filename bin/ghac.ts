#!/usr/bin/env node

import { program } from "commander";
import { build, compile } from "../src/compiler.js";
import { validate } from "../src/validator.js";
import { lint } from "../src/linter.js";
import yaml from "js-yaml";

program
  .name("ghac")
  .description("GitHub Actions Compiler — structured workflows compiled to flat YAML")
  .version("0.1.0");

program
  .command("build")
  .description("Compile source workflows into .github/workflows/ YAML")
  .option("-p, --project <path>", "Project root directory", process.cwd())
  .action((opts) => {
    console.log("Building workflows...\n");
    const result = build(opts.project);
    if (result.errors.length > 0) {
      process.exit(1);
    }
    console.log("\nDone.");
  });

program
  .command("validate")
  .description("Validate compiled workflows against GitHub Actions requirements")
  .option("-p, --project <path>", "Project root directory", process.cwd())
  .action((opts) => {
    const result = compile(opts.project);

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        console.error(`COMPILE ERROR: ${error.file}: ${error.message}`);
      }
      process.exit(1);
    }

    let hasErrors = false;
    for (const workflow of result.workflows) {
      const parsed = yaml.load(workflow.content);
      const validation = validate(parsed, workflow.outputName);
      if (validation.valid) {
        console.log(`  ✓ ${workflow.outputName} is valid`);
      } else {
        hasErrors = true;
        for (const err of validation.errors) {
          console.error(`  ✗ ${workflow.outputName}: ${err.message}`);
        }
      }
    }

    if (hasErrors) {
      process.exit(1);
    } else {
      console.log("\nAll workflows valid.");
    }
  });

program
  .command("lint")
  .description("Check source structure and conventions")
  .option("-p, --project <path>", "Project root directory", process.cwd())
  .action((opts) => {
    const result = lint(opts.project);

    for (const warning of result.warnings) {
      console.warn(`  WARN [${warning.rule}]: ${warning.message}`);
    }
    for (const error of result.errors) {
      console.error(`  ERR  [${error.rule}]: ${error.message}`);
    }

    if (result.passed) {
      console.log("\nLint passed.");
    } else {
      console.error("\nLint failed.");
      process.exit(1);
    }
  });

program
  .command("watch")
  .description("Watch source files and rebuild on changes")
  .option("-p, --project <path>", "Project root directory", process.cwd())
  .action(async (opts) => {
    const { watch } = await import("../src/watcher.js");
    watch(opts.project);
  });

program.parse();
