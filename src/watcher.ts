import path from "node:path";
import chokidar from "chokidar";
import { loadConfig } from "./config.js";
import { build } from "./compiler.js";

export function createWatcher(projectRoot: string, onRebuild?: () => void) {
  const config = loadConfig(projectRoot);
  const sourceDir = path.resolve(projectRoot, config.source);

  const watcher = chokidar.watch(sourceDir, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200 },
  });

  const rebuild = () => {
    console.log("\nChange detected, rebuilding...\n");
    try {
      build(projectRoot);
      onRebuild?.();
    } catch (err) {
      console.error("Build failed:", err);
    }
  };

  watcher.on("change", rebuild);
  watcher.on("add", rebuild);
  watcher.on("unlink", rebuild);

  return watcher;
}

export function watch(projectRoot: string) {
  console.log("Watching for changes...\n");

  // Do an initial build
  try {
    build(projectRoot);
  } catch {
    // Initial build errors are already logged by build()
  }

  const watcher = createWatcher(projectRoot);

  // Keep process alive
  process.on("SIGINT", async () => {
    console.log("\nStopping watcher...");
    await watcher.close();
    process.exit(0);
  });
}
