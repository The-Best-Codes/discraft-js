## Discraft v2

### Adapters

The new approach to the Discraft CLI will be something like Astro. It needs to be modular, composable, extensible, and adaptable. Similar to Astro's "adapter" approach, where adapters are used to connect to different platforms, Discraft will use adapters to connect to different platforms. This will allow Discraft to be easily extended to support new platforms in the future.

For example, in a Discraft project, you could run `discraft add vercel-adapter` to add support for Vercel deployment, or `discraft add coolify-adapter` to add support for Coolify deployment.

### Extensions

Discraft v2 will also support extensions (also via the discraft add command). Extensions are modular pieces of code that can be added to a Discraft project to extend its functionality. For example, you could run `discraft add persistence-extension` to add support for easy data persistence in a data/ directory. This will be somewhat similar to Astro's approach as well (e.g. how you can add React or Tailwind to your Astro project), but more like shadcn CLI. Adding an extension will intelligently add the necessary files, environment variables, dependencies, and other configurations to your project.

### New init command

The `discraft init` command will experience some changes in v2. Rather than the old 3 templates, `js`, `ts`, and `vercel-ts-ai`, there will be two base templates: `js` and `ts`. These templates will provide a starting point for new Discraft projects, with pre-configured settings and dependencies. Users can then add additional adapters and extensions as needed to customize their projects.

### New dev command

The new `discraft dev` command will have a reworked dev server for better hot reloading (using Bun instead of nodemon). This will provide faster and more efficient development experience.

### New `discraft.config.{ts,js}` file

Discraft v2 will introduce a discraft config file that allows users to customize various aspects of their projects. This file will be located at the root of the project and will contain configuration options for adapters, extensions, and other settings. Users can modify this file to suit their specific needs and preferences.
Examples of supported config include:

- Changing the bot's main entry point (by default, it's `src/index.ts`)
- Modify the files that the dev command ignores when determining if a process needs restarted (by default, ignore dist, node_modules, etc. but allow extending it or overriding it)
- etc.

## New Template Structure

The old template structure is something like this:

```bash
templates/
├── ts
│   ├── clients
│   │   └── discord.ts
│   ├── commands
│   │   ├── longcommand.ts
│   │   ├── messageinfo.ts
│   │   ├── ping.ts
│   │   └── userinfo.ts
│   ├── events
│   │   ├── error.ts
│   │   ├── messageCreate.ts
│   │   └── ready.ts
│   ├── gitignore.template
│   ├── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── utils
│       └── logger.ts
└──
```

The new structure will be more like this by default:

```bash
templates/
└── ts
    ├── discraft.config.ts
    ├── gitignore.template
    ├── package.json
    ├── src
    │   ├── commands
    │   ├── events
    │   ├── index.ts
    │   └── utils
    └── tsconfig.json
```

### Command Details

- `discraft dev`: Starts the development server
- `discraft build`: Builds the project (builds for all targets specificied in the discraft config, or you can override via CLI args)
- `discraft start`: Starts the bot (using Node if detected, else Bun, allow overrides via CLI args)
- `discraft add`: Add new stuff to the project (adapters, extensions, etc.)
- `discraft init`: Initialize a new project

### Expected packages

- @discraft/\_core
- @discraft/\_templates (used by CLI, contains templates in .hbs format or something)
- @discraft/extension-persistence
- @discraft/extension-cron
- @discraft/extension-commands (enabled by default)
- @discraft/extension-events (enabled by default)
- @discraft/adapter-bun
- @discraft/adapter-node (default adapter used)
- @discraft/adapter-vercel
- @discraft/adapter-coolify
- discraft (CLI)

---

Putting all that together, I've created a pseudo-project in prd-example/. It's an imagination of what output you would get if you ran `discraft init` and chose the TypeScript template and default options.
