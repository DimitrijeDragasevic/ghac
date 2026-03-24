import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { GhacConfig } from "./types.js";
import { ConfigError } from "./errors.js";

const DEFAULTS: GhacConfig = {
  source: ".ghsrc",
  output: ".github/workflows",
  flatten: "prefix",
};

const CONFIG_FILENAME = "ghac.config.yml";

export function loadConfig(projectRoot: string): GhacConfig {
  // Try project root first, then .ghsrc/ directory
  const candidates = [
    path.join(projectRoot, CONFIG_FILENAME),
    path.join(projectRoot, ".ghsrc", CONFIG_FILENAME),
  ];

  for (const configPath of candidates) {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed = yaml.load(raw) as Partial<GhacConfig> | null;

      if (parsed && typeof parsed !== "string") {
        const flatten = parsed.flatten as string | undefined;
        return {
          source: parsed.source ?? DEFAULTS.source,
          output: parsed.output ?? DEFAULTS.output,
          flatten: flatten === "flat" ? "flat" : DEFAULTS.flatten,
        };
      }
    }
  }

  return { ...DEFAULTS };
}
