# Contributing to Discraft.js

We love your input! We want to make contributing to Discraft.js as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Environment Setup

1. **Prerequisites**

   - Install [Bun](https://bun.sh) (our preferred JavaScript runtime and package manager)
   - Node.js (LTS version recommended)
   - Git

2. **Local Development**

   ```bash
   # Clone the repository
   git clone https://github.com/The-Best-Codes/discraft-js.git
   cd discraft-js

   # Install dependencies
   bun install
   ```

## Development Process

1. Fork the repository and create your branch from `main`
2. Make your changes
3. If you've added code that should be tested, add tests
4. Ensure the test suite passes
5. Issue that pull request!

## Project Structure

There are only **two folders** in the project that you should need to edit:

1. `editing/` - Contains the editing (un-minified) version of what you find in:

   - `bin/` - Contains the CLI
   - `scripts/` - Contains the scripts
   - `common/` - Contains the common files (like logger utils)
     When you want to minify and output the editing scripts (before a commit, for example), run `bun run build`

2. `src/` - This is **not the source of the project**, it's a template directory that Discraft generates Discord bot projects from.

## Build Process

We use Bun for bundling and building the project. The build process is handled through:

```bash
bun run build
```

You should run this before commiting changes in `editing/` to see them in the other folders as well.

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable
2. Do not update the version in the package.json file! We'll do that for you
3. Your PR will be merged once you have the sign-off of at least one maintainer

**Note**: Your PR will probably be merged as a beta release. Since don't yet have an efficient test process, we release new features in beta and just see if they break!

## Any Questions?

Feel free to open an issue or join our community discussions if you have any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
