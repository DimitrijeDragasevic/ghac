import type { ValidationResult, ValidationError } from "./types.js";

export function validate(workflow: any, fileName: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!workflow || typeof workflow !== "object") {
    errors.push({ file: fileName, message: "Workflow must be a YAML object" });
    return { valid: false, errors };
  }

  // Check required 'on' trigger
  if (!workflow.on) {
    errors.push({
      file: fileName,
      message: "Missing required field 'on' (workflow trigger)",
    });
  }

  // Check required 'jobs'
  if (!workflow.jobs || typeof workflow.jobs !== "object") {
    errors.push({
      file: fileName,
      message: "Missing required field 'jobs'",
    });
    return { valid: errors.length === 0, errors };
  }

  // Validate each job
  for (const [jobId, job] of Object.entries(workflow.jobs)) {
    const j = job as any;

    if (!j["runs-on"] && !j.uses) {
      errors.push({
        file: fileName,
        message: `Job '${jobId}' must have either 'runs-on' or 'uses' (reusable workflow)`,
        path: `jobs.${jobId}`,
      });
      continue;
    }

    if (j["runs-on"] && j.steps) {
      for (let i = 0; i < j.steps.length; i++) {
        const step = j.steps[i];
        if (!step.run && !step.uses) {
          errors.push({
            file: fileName,
            message: `Job '${jobId}' step ${i} must have 'run' or 'uses'`,
            path: `jobs.${jobId}.steps[${i}]`,
          });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
