# GHAC — GitHub Actions Compiler

A CLI tool that lets you organize GitHub Actions workflows in nested folders with reusable partials and templates, then compiles them into the flat YAML files GitHub requires in `.github/workflows/`.

## Why

GitHub Actions forces all workflows into a single flat directory. With 20+ workflows, this becomes unmanageable. GHAC lets you structure workflows by concern and compile to flat output.

## Quick Start

```bash
# Install
npm install

# Compile .ghsrc/ → .github/workflows/
npx tsx bin/ghac.ts build --project /path/to/your-project

# Validate compiled output
npx tsx bin/ghac.ts validate --project /path/to/your-project

# Lint source structure
npx tsx bin/ghac.ts lint --project /path/to/your-project

# Watch and rebuild on changes
npx tsx bin/ghac.ts watch --project /path/to/your-project
```

## Source Structure

Organize workflows in `.ghsrc/` with nested folders:

```
.ghsrc/
├── ghac.config.yml
├── workflows/
│   ├── deploy/
│   │   ├── staging-auto.yml      → deploy-staging-auto.yml
│   │   ├── prod-mainnet.yml      → deploy-prod-mainnet.yml
│   │   └── rollback.yml          → deploy-rollback.yml
│   ├── testing/
│   │   ├── unit-tests.yml        → testing-unit-tests.yml
│   │   ├── lint.yml              → testing-lint.yml
│   │   └── integration.yml       → testing-integration.yml
│   ├── ops/
│   │   └── cleanup-dev.yml       → ops-cleanup-dev.yml
│   └── reusable/
│       └── terraform-deploy.yml  → reusable-terraform-deploy.yml
└── partials/
    ├── checkout.yml
    ├── setup-go.yml
    ├── setup-node.yml
    └── gcp-auth.yml
```

GHAC compiles this into flat files in `.github/workflows/`, prefixing filenames with their folder path.

## Config

```yaml
# ghac.config.yml
source: .ghsrc                # Source directory (default: .ghsrc)
output: .github/workflows     # Output directory (default: .github/workflows)
flatten: prefix               # Naming strategy: "prefix" (folder-file) or "flat" (filename only)
```

## Features

### Nested Workflow Folders

Organize workflows into logical groups. Subfolders become filename prefixes in the output:

```
workflows/deploy/staging.yml → deploy-staging.yml
workflows/testing/lint.yml   → testing-lint.yml
```

Set `flatten: flat` in config to use just the filename (no prefix).

### `!include` — Reusable Step Fragments

Extract shared steps into `partials/` and include them:

```yaml
# partials/checkout.yml
uses: actions/checkout@v4
with:
  submodules: recursive
  token: ${{ secrets.PAT_TOKEN }}
```

```yaml
# workflows/testing/lint.yml
steps:
  - !include partials/checkout.yml
  - run: npm run lint
```

Change the checkout action SHA once in `partials/checkout.yml` and every workflow using it updates on rebuild.

### `!template` — Include with Variables

```yaml
# workflows/deploy/prod.yml
jobs:
  deploy: !template
    src: jobs/deploy.yml
    vars:
      environment: production
      node_version: "20"
```

```yaml
# jobs/deploy.yml
runs-on: ubuntu-latest
environment: ${{ ghac.environment }}
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: "${{ ghac.node_version }}"
```

Template variables use `${{ ghac.varname }}` syntax. GitHub Actions expressions (`${{ github.ref }}`) are left untouched.

### `!env` — Environment Config Files

```yaml
env: !env env/production.yml
```

Loads key-value pairs from an environment config file.

## CLI Commands

| Command | Description |
|---------|-------------|
| `build` | Compile `.ghsrc/` into `.github/workflows/` |
| `validate` | Check compiled output is valid GitHub Actions YAML |
| `lint` | Verify source structure follows conventions |
| `watch` | Rebuild automatically on file changes |

All commands accept `--project <path>` to specify the project root (defaults to current directory).

## Development

```bash
npm install
npm test              # Run tests
npm run test:watch    # Watch mode
npm run build         # Production build
```

## Tech Stack

TypeScript, Node.js, commander, js-yaml, chokidar, vitest, tsup
