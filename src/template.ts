import fs from "node:fs";
import path from "node:path";
import { parse } from "./parser.js";
import type { TemplateDirective } from "./types.js";
import { TemplateError } from "./errors.js";

const GHAC_VAR_PATTERN = /\$\{\{\s*ghac\.(\w+)\s*\}\}/g;

function isTemplateDirective(value: unknown): value is TemplateDirective {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).type === "template" &&
    typeof (value as any).src === "string"
  );
}

export function substituteVars(
  node: unknown,
  vars: Record<string, string>,
  filePath: string = "<inline>"
): any {
  if (typeof node === "string") {
    return node.replace(GHAC_VAR_PATTERN, (match, varName: string) => {
      if (!(varName in vars)) {
        throw new TemplateError(filePath, varName);
      }
      return vars[varName];
    });
  }

  if (node === null || node === undefined) return node;
  if (typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map((item) => substituteVars(item, vars, filePath));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    result[key] = substituteVars(value, vars, filePath);
  }
  return result;
}

export function resolveTemplates(node: unknown, sourceDir: string): any {
  if (node === null || node === undefined) return node;
  if (typeof node !== "object") return node;

  if (isTemplateDirective(node)) {
    const fullPath = path.resolve(sourceDir, node.src);
    const content = fs.readFileSync(fullPath, "utf-8");
    const parsed = parse(content);
    return substituteVars(parsed, node.vars, node.src);
  }

  if (Array.isArray(node)) {
    return node.map((item) => resolveTemplates(item, sourceDir));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    result[key] = resolveTemplates(value, sourceDir);
  }
  return result;
}
