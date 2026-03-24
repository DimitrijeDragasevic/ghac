import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["bin/ghac.ts"],
    format: ["esm"],
    clean: true,
    sourcemap: true,
    target: "node20",
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: false,
    sourcemap: true,
    target: "node20",
  },
]);
