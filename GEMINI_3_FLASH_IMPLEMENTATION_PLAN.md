> Note from BestCodes: This plan is AI-generated.

# Discraft v2 Implementation Plan

This document outlines the comprehensive architecture and implementation strategy for Discraft v2, based on the PRD and the `prd-example`.

## 1. Core Architecture: The "Bridge" Pattern
Discraft v2 moves away from static templates to a dynamic "Bridge" architecture.
- **User Code (`src/`)**: Pure logic, minimal boilerplate.
- **Discraft Bridge (`.discraft/`)**: Auto-generated glue code that connects User Code to the Discord API via Extensions and Adapters.
- **Orchestrator (`@discraft/core`)**: The engine that reads the config and generates the Bridge.

## 2. Package Breakdown

### A. `@discraft/core` (The Engine)
The brain of the operation. It won't be run directly by users but will be used by the CLI and Adapters.
- **Config Loader**: Using `jiti` or `esbuild-register` to read `discraft.config.ts` dynamically.
- **Virtual File System (VFS)**: Responsible for generating the `.discraft` directory.
- **Lifecycle Hooks**:
  - `setup`: Runs during `init`.
  - `transform`: Generates glue code.
  - `build`: Preparation for production.
  - `dev-runtime`: Hooks for hot-reloading.

### B. `discraft` (The CLI)
The entry point for the developer.
- `discraft init`:
  - Clones the base template (JS/TS).
  - Prompts for initial adapters (default: Node).
- `discraft dev`:
  - Starts the watcher.
  - Generates `.discraft` files on every change to `src/`.
  - Uses `Bun.spawn` (if available) for ultra-fast bot restarts.
- `discraft add <module>`:
  - Detects if the module is an `adapter` or `extension`.
  - Installs via `npm/pnpm/yarn/bun`.
  - **Auto-Config**: Uses AST (via `magic-ast` or `recast`) to inject the module into `discraft.config.ts`.
- `discraft build`:
  - Triggers the adapter's build process (e.g., bundling for Vercel/Cloudflare).

### C. Adapters (Environment Layer)
Adapters define **how** the bot starts and stays alive.
- **`@discraft/adapter-node`**:
  - Standard `client.login()` approach.
  - Handles SIGINT/SIGTERM for graceful shutdowns.
- **`@discraft/adapter-vercel`**:
  - Transforms the bot into a Webhook listener.
  - Disables the "Events" extension (which requires a persistent socket).

### D. Extensions (Feature Layer)
Extensions define **what** the bot can do.
- **`@discraft/extension-commands`**:
  - Scans `src/commands`.
  - Generates a map of commands.
  - Injects `interactionCreate` handling logic into the Bridge.
- **`@discraft/extension-events`**:
  - Scans `src/events`.
  - Generates `client.on(event, handler)` logic.

---

## 3. The Bridge Generation Logic (`.discraft/`)

When a user runs `discraft dev`, the following happens:

1. **Scan**: `@discraft/core` looks at `src/commands`. Finds `ping.ts`.
2. **Template**: Using Handlebars, it generates `.discraft/extension-commands/register.ts`:
   ```typescript
   import ping from '../../src/commands/ping';
   export const commands = [ping];
   export function register(client) { ... }
   ```
3. **Execution**: The internal entry point (hidden from user) imports these generated files and the Client.

---

## 4. Implementation phases

### Phase 1: The Foundation (Current Focus)
- [ ] Define the `DiscraftConfig` type in `@discraft/core`.
- [ ] Create the CLI wrapper with `commander`.
- [ ] Implement the dynamic generated folder logic.

### Phase 2: The Default Experience
- [ ] Implement `@discraft/adapter-node`.
- [ ] Implement `@discraft/extension-commands` and `extension-events`.
- [ ] Make `discraft dev` work by watching the filesystem and regenerating the bridge.

### Phase 3: Deployment & Expansion
- [ ] Implement `discraft build` logic.
- [ ] Build `@discraft/adapter-vercel`.
- [ ] Implement `discraft add` using AST modification to make setup seamless.

---

## 5. Directory Mapping (v2 workspace)
- `/packages/cli`: CLI commands and user interaction.
- `/packages/core`: The generating engine and base types.
- `/packages/adapter-*`: Platform adapters.
- `/packages/extension-*`: Feature extensions.
- `/packages/templates`: `.hbs` or base files for `init`.
