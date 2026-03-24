import fs from "node:fs";
import path from "node:path";
import { parse } from "./parser.js";
import type { IncludeDirective, EnvDirective } from "./types.js";
import { ResolveError } from "./errors.js";

function isIncludeDirective(value: unknown): value is IncludeDirective {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).type === "include" &&
    typeof (value as any).path === "string"
  );
}

function isEnvDirective(value: unknown): value is EnvDirective {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).type === "env" &&
    typeof (value as any).path === "string"
  );
}

function loadAndParse(filePath: string, sourceDir: string, visited: Set<string>): unknown {
  const fullPath = path.resolve(sourceDir, filePath);

  if (visited.has(fullPath)) {
    throw new Error(`Circular include detected: ${filePath}`);
  }

  if (!fs.existsSync(fullPath)) {
    throw new ResolveError(filePath, fullPath);
  }

  visited.add(fullPath);
  const content = fs.readFileSync(fullPath, "utf-8");
  const parsed = parse(content);
  const resolved = resolveNode(parsed, sourceDir, visited);
  visited.delete(fullPath);
  return resolved;
}

function resolveNode(node: unknown, sourceDir: string, visited: Set<string>): unknown {
  if (node === null || node === undefined) return node;
  if (typeof node !== "object") return node;

  if (isIncludeDirective(node)) {
    return loadAndParse(node.path, sourceDir, visited);
  }

  if (isEnvDirective(node)) {
    return loadAndParse(node.path, sourceDir, visited);
  }

  // Template directives are NOT resolved here — they go through the template engine
  if (Array.isArray(node)) {
    return node.map((item) => resolveNode(item, sourceDir, visited));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    result[key] = resolveNode(value, sourceDir, visited);
  }
  return result;
}

export function resolve(parsed: unknown, sourceDir: string): any {
  return resolveNode(parsed, sourceDir, new Set());
}
