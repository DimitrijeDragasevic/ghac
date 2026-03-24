export class GhacError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GhacError";
  }
}

export class ConfigError extends GhacError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class ParseError extends GhacError {
  public file: string;
  public line?: number;

  constructor(file: string, message: string, line?: number) {
    super(`${file}${line ? `:${line}` : ""}: ${message}`);
    this.name = "ParseError";
    this.file = file;
    this.line = line;
  }
}

export class ResolveError extends GhacError {
  public file: string;
  public referencedPath: string;

  constructor(file: string, referencedPath: string) {
    super(`${file}: referenced file not found: ${referencedPath}`);
    this.name = "ResolveError";
    this.file = file;
    this.referencedPath = referencedPath;
  }
}

export class TemplateError extends GhacError {
  public file: string;
  public variable: string;

  constructor(file: string, variable: string) {
    super(`${file}: undefined template variable: ${variable}`);
    this.name = "TemplateError";
    this.file = file;
    this.variable = variable;
  }
}
