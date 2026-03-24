import yaml from "js-yaml";
import type { IncludeDirective, TemplateDirective, EnvDirective } from "./types.js";

const includeType = new yaml.Type("!include", {
  kind: "scalar",
  construct(data: string): IncludeDirective {
    return { type: "include", path: data };
  },
});

const templateType = new yaml.Type("!template", {
  kind: "mapping",
  construct(data: { src: string; vars: Record<string, string> }): TemplateDirective {
    return {
      type: "template",
      src: data.src,
      vars: data.vars ?? {},
    };
  },
});

const envType = new yaml.Type("!env", {
  kind: "scalar",
  construct(data: string): EnvDirective {
    return { type: "env", path: data };
  },
});

const GHAC_SCHEMA = yaml.DEFAULT_SCHEMA.extend([includeType, templateType, envType]);

export function parse(content: string): any {
  return yaml.load(content, { schema: GHAC_SCHEMA });
}
