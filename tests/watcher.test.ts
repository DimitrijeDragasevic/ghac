import { describe, it, expect, vi, afterEach } from "vitest";
import { createWatcher } from "../src/watcher.js";
import fs from "node:fs";
import path from "node:path";

describe("createWatcher", () => {
  const tmpDir = `/tmp/ghac-watch-test-${Date.now()}`;

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("triggers rebuild callback when a source file changes", async () => {
    // Set up a minimal project
    const srcDir = path.join(tmpDir, ".ghsrc", "workflows");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, "ci.yml"),
      "name: CI\non: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n"
    );

    const onRebuild = vi.fn();
    const watcher = createWatcher(tmpDir, onRebuild);

    // Give chokidar time to initialize
    await new Promise((r) => setTimeout(r, 500));

    // Modify a file
    fs.writeFileSync(
      path.join(srcDir, "ci.yml"),
      "name: CI Updated\non: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n"
    );

    // Wait for the watcher to trigger
    await new Promise((r) => setTimeout(r, 1000));

    expect(onRebuild).toHaveBeenCalled();

    await watcher.close();
  });
});
