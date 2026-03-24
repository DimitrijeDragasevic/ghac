/** Configuration loaded from ghac.config.yml */
export interface GhacConfig {
  source: string;
  output: string;
  /** How to flatten nested workflow folders into output filenames */
  flatten: "prefix" | "flat";
}

/** Represents a parsed !include directive */
export interface IncludeDirective {
  type: "include";
  path: string;
}

/** Represents a parsed !template directive */
export interface TemplateDirective {
  type: "template";
  src: string;
  vars: Record<string, string>;
}

/** Represents a parsed !env directive */
export interface EnvDirective {
  type: "env";
  path: string;
}

/** A compiled workflow ready for output */
export interface CompiledWorkflow {
  /** Source file path (relative to source dir) */
  sourcePath: string;
  /** Output file name */
  outputName: string;
  /** Final YAML content */
  content: string;
}

/** Result of a compilation run */
export interface CompileResult {
  workflows: CompiledWorkflow[];
  errors: CompileError[];
}

/** A compilation error */
export interface CompileError {
  file: string;
  message: string;
  line?: number;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  file: string;
  message: string;
  path?: string;
}

/** Lint result */
export interface LintResult {
  passed: boolean;
  warnings: LintWarning[];
  errors: LintError[];
}

export interface LintWarning {
  file: string;
  message: string;
  rule: string;
}

export interface LintError {
  file: string;
  message: string;
  rule: string;
}
